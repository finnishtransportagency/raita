import { S3Event, SQSEvent } from 'aws-lambda';
import { log } from '../../../utils/logger';
import { getDecodedS3ObjectKey, getKeyData, isCsvSuffix } from '../../utils';
import { parseCSVFileStream } from './csvDataParser/csvDataParser';
import { S3FileRepository } from '../../../adapters/s3FileRepository';
import { IAdminLogger } from '../../../utils/adminLog/types';
import { PostgresLogger } from '../../../utils/adminLog/postgresLogger';
import { getGetEnvWithPreassignedContext } from '../../../../utils';
import { DBConnection, getDBConnection } from '../csvCommon/db/dbUtil';

export function getLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext('Metadata parser lambda');
  return {
    configurationFile: getEnv('CONFIGURATION_FILE'),
    csvBucket: getEnv('CSV_BUCKET'),
    region: getEnv('REGION'),
  };
}

const adminLogger: IAdminLogger = new PostgresLogger();
let dbConnection: DBConnection;

export async function handleCSVFileEvent(event: SQSEvent): Promise<void> {
  dbConnection = await getDBConnection();
  const files = new S3FileRepository();
  let currentKey: string = ''; // for logging in case of errors
  try {
    // one event from sqs can contain multiple s3 events
    const sqsRecordResults = event.Records.map(async sqsRecord => {
      const s3Event: S3Event = JSON.parse(sqsRecord.body);
      const recordResults = s3Event.Records.map(async eventRecord => {
        try {
          const key = getDecodedS3ObjectKey(eventRecord);
          currentKey = key;
          log.debug({ fileName: key }, 'Start csv file handler');
          log.debug(eventRecord);

          const fileStreamResult = await files.getFileStream(
            eventRecord,
            false,
          );

          log.debug(fileStreamResult);
          const keyData = getKeyData(key);
          log.debug(keyData);

          if (!isCsvSuffix(keyData.fileSuffix)) {
            log.info(
              `Ignoring file ${key} with known ignored suffix ${keyData.fileSuffix}`,
            );

            return null;
          }

          if (fileStreamResult && fileStreamResult.fileStream) {
            log.debug('csv parse file: ' + keyData.fileBaseName);
            const result = await parseCSVFileStream(
              keyData,
              fileStreamResult.fileStream,
              null,
              dbConnection,
            );
            log.debug('csv parsing result: ' + result);

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
            `Tiedoston ${currentKey} käsittely epäonnistui. csv dataa ei tallennettu.`,
          );
          return null;
        }
      });
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
            `iedoston ${currentKey} käsittely epäonnistui. csv dataa ei tallennettu.`,
          );
        }
      }),
    );

  } catch (err) {
    // TODO: Figure out proper error handling.
    log.error(`An error occured while processing events: ${err}`);
    await adminLogger.error(
      `Tiedoston ${currentKey} käsittely epäonnistui. csv dataa ei tallennettu.`,
    );
  }
}
