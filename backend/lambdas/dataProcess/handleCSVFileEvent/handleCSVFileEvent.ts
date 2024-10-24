import { Context, S3Event, SQSEvent } from 'aws-lambda';
import { log, logCSVDBException } from '../../../utils/logger';
import {
  getDecodedS3ObjectKey,
  getKeyData,
  getOriginalZipNameFromPath,
  isCsvSuffix,
} from '../../utils';
import { parseCSVFileStream } from './csvDataParser/csvDataParser';
import { S3FileRepository } from '../../../adapters/s3FileRepository';
import { IAdminLogger } from '../../../utils/adminLog/types';
import { PostgresLogger } from '../../../utils/adminLog/postgresLogger';
import { getGetEnvWithPreassignedContext } from '../../../../utils';
import { DBConnection, getDBConnection } from '../csvCommon/db/dbUtil';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { lambdaRequestTracker } from 'pino-lambda';

function getLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext('Metadata parser lambda');
  return {
    configurationFile: getEnv('CONFIGURATION_FILE'),
    csvBucket: getEnv('CSV_BUCKET'),
    region: getEnv('REGION'),
  };
}

const postgresConnection: Promise<DBConnection> = getDBConnection();
const adminLogger: IAdminLogger = new PostgresLogger(postgresConnection);
const files = new S3FileRepository();

const withRequest = lambdaRequestTracker();

export async function handleCSVFileEvent(
  event: SQSEvent,
  context: Context,
): Promise<void> {
  let currentKey: string = ''; // for logging in case of errors
  try {
    withRequest(event, context);
    log.debug('Start csv file handler');
    log.debug(event);
    // Set preliminary value for logging invocation id or old zip file name would be used from previous invocation.
    // If exception happen before or during getting zip fiel name from metadata; loggings woul go under 'ZIP FILE ASSOCIATION FAILED' invocation id.
    let invocationId = 'ZIP FILE ASSOCIATION FAILED';
    await adminLogger.init('data-csv', invocationId);
    const dbConnection = await postgresConnection;

    if (!dbConnection) {
      // No DB connection
      logCSVDBException.error('No db connection');
      throw new Error('No db connection');
    }
    // one event from sqs can contain multiple s3 events
    const sqsRecordResults = event.Records.map(async sqsRecord => {
      const s3Event: S3Event = JSON.parse(sqsRecord.body);
      const recordResults: Promise<
        | null
        | {
            bucket_arn: string;
            size: number;
            file_name: string;
            bucket_name: string;
            key: string;
            tags: Record<string, string>;
          }
        | any[]
      >[] = s3Event.Records.map(async eventRecord => {
        try {
          const key = getDecodedS3ObjectKey(eventRecord);
          currentKey = key;
          log.info({ fileName: key }, 'Start csv file handler');
          log.debug(eventRecord);

          const fileStreamResult = await files.getFileStream(eventRecord);
          const keyData = getKeyData(key);
          const invocationIdWithOldBehavior = getOriginalZipNameFromPath(
            keyData.path,
          ); // fall back to old behaviour: guess zip file name
          invocationId = invocationIdWithOldBehavior;
          await adminLogger.init('data-csv', invocationId);
          try {
            const s3MetaData = fileStreamResult.metaData;
            const invocationId = s3MetaData['invocation-id']
              ? decodeURIComponent(s3MetaData['invocation-id'])
              : invocationIdWithOldBehavior;
            await adminLogger.init('data-csv', invocationId);
          } catch (err) {
            log.warn(
              `An error occured in getFileStream ${currentKey}: ${err} `,
            );
            await adminLogger.warn(
              `Tiedoston ${currentKey} ei löytynyt S3:sta. Toinen prosessi on jo käsitellyt tiedoston.` +
                err.message,
            );
            return null;
          }
          if (!isCsvSuffix(keyData.fileSuffix)) {
            log.debug(
              `Ignoring file ${key} with known ignored suffix ${keyData.fileSuffix}`,
            );

            return null;
          }

          if (fileStreamResult && fileStreamResult.fileStream) {
            log.debug('csv parse file: ' + keyData.fileBaseName);
            const result = await parseCSVFileStream(
              keyData,
              fileStreamResult.fileStream,
              dbConnection,
              invocationId,
            );
            if (result == 'success') {
              const config = getLambdaConfigOrFail();
              log.debug(
                'Success reading file, deleting: ' + keyData.fileBaseName,
              );
              const command = new DeleteObjectCommand({
                Bucket: config.csvBucket,
                Key: keyData.keyWithoutSuffix + '.' + keyData.fileSuffix,
              });
              const s3Client = new S3Client({});
              const a = await s3Client.send(command);
            }

            return {
              // key is sent to be stored in url decoded format to db
              key,
              file_name: keyData.fileName,
              bucket_arn: eventRecord.s3.bucket.arn,
              bucket_name: eventRecord.s3.bucket.name,
              size: eventRecord.s3.object.size,
              tags: fileStreamResult.tags,
            };
          } else return null;
        } catch (err) {
          log.error(`An error occured while processing events: ${err}`);
          await adminLogger.error(
            `Tiedoston ${currentKey} käsittely epäonnistui. csv dataa ei tallennettu.` +
              err.message,
          );
          return null;
        }
      });
      const entries = await Promise.all(recordResults).then(results =>
        log.debug(results),
      );
    });

    const settled = await Promise.allSettled(sqsRecordResults);
    await Promise.all(
      settled.map(async settledResult => {
        if (settledResult.status === 'rejected') {
          log.error({
            error: settledResult.reason,
            message: 'An error occured while processing events in array',
          });
          await adminLogger.error(
            `Tiedoston ${currentKey} käsittely epäonnistui. csv dataa ei tallennettu.`,
          );
        }
      }),
    );
  } catch (err) {
    // TODO: Figure out proper error handling.
    log.error(`An error occured while processing events: ${err}`);
    await adminLogger.error(
      `Tiedoston ${currentKey} käsittely epäonnistui. csv dataa ei tallennettu. ` +
        err.message,
    );
  }
}
