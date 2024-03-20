import { S3Event } from 'aws-lambda';
import { log } from '../../../utils/logger';
import { getDecodedS3ObjectKey, getKeyData, isCsvSuffix } from '../../utils';
import { parseCSVFileStream } from './csvDataParser/csvDataParser';
import { S3FileRepository } from '../../../adapters/s3FileRepository';
import {IAdminLogger} from "../../../utils/adminLog/types";
import {PostgresLogger} from "../../../utils/adminLog/postgresLogger";
import {getGetEnvWithPreassignedContext} from "../../../../utils";

export function getLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext('Metadata parser lambda');
  return {
    configurationFile: getEnv('CONFIGURATION_FILE'),
    csvBucket:  getEnv('CSV_BUCKET'),
    region: getEnv('REGION'),
  };
}

const adminLogger: IAdminLogger = new PostgresLogger();

export async function handleCSVFileEvent(event: S3Event): Promise<void> {
  const files = new S3FileRepository();
  let currentKey: string = ''; // for logging in case of errors
  try {
    const recordResults = event.Records.map(async eventRecord => {
      try {
        const key = getDecodedS3ObjectKey(eventRecord);
        currentKey = key;
        log.debug({ fileName: key }, 'Start csv file handler');
        log.debug(eventRecord);

        const fileStreamResult = await files.getFileStream(eventRecord, false);

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

    const entries = await Promise.all(recordResults).then(
      results => log.debug(results),
    );
  } catch (err) {
    // TODO: Figure out proper error handling.
    log.error(`An error occured while processing events: ${err}`);
    await adminLogger.error(
      `Tiedoston ${currentKey} käsittely epäonnistui. csv dataa ei tallennettu.`,
    );
  }
}
