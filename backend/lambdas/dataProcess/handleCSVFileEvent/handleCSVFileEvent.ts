import { S3Event } from 'aws-lambda';
import { FileMetadataEntry } from '../../../types';

import { log } from '../../../utils/logger';
import BackendFacade from '../../../ports/backend';
import { getGetEnvWithPreassignedContext } from '../../../../utils';
import { getDecodedS3ObjectKey, getKeyData, isCsvSuffix } from '../../utils';
import { IAdminLogger } from '../../../utils/adminLogger';
import { PostgresLogger } from '../../../utils/postgresLogger';
import cloneable from 'cloneable-readable';
import {parseCSVFile, parseCSVFileStream} from './csvDataParser/csvDataParser';
import { S3FileRepository } from '../../../adapters/s3FileRepository';

export function getLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext('Metadata parser lambda');
  return {
    configurationFile: getEnv('CONFIGURATION_FILE'),
    csvBucket: getEnv('CSV_BUCKET'),
    region: getEnv('REGION'),
  };
}

const adminLogger: IAdminLogger = new PostgresLogger();

/**
 * Currently function takes in S3 events. This has implication that file port
 * does not make sense conceptually as we are committed in S3 from the outset.
 * Should we make the handling more generic from the start, accepting also HTTP trigger
 * events and using Strategy pattern possibly to plug in correct file backend based on
 * config or even event details.
 *
 * TODO: Parsing should be extracted out out the S3Event handler.
 *
 */
export async function handleCSVFileEvent(event: S3Event): Promise<void> {
  const config = getLambdaConfigOrFail();
  //const backend = BackendFacade.getBackend(config);
  const files = new S3FileRepository();
  let currentKey: string = ''; // for logging in case of errors
  try {
    const recordResults = event.Records.map(async eventRecord => {
      try {
        const key = getDecodedS3ObjectKey(eventRecord);
        currentKey = key;
        log.info({ fileName: key }, 'Start csv file handler');
        log.info("HELLO1");
        log.info(eventRecord);
        log.info("HELLO2");


        log.info("bucket_arn: " +eventRecord.s3.bucket.arn);
        log.info("bucket_name: " +eventRecord.s3.bucket.name);
        log.info("object.size: " +eventRecord.s3.object.size);

        //const fileStreamResult = await files.getFileStream(eventRecord, false);
        const fileResult = await files.getFile(eventRecord, false);
        log.info("HELLO3: ");
        log.info(fileResult);
        //log.info(fileStreamResult);
        const keyData = getKeyData(key);
        log.info(keyData);

        if (!isCsvSuffix(keyData.fileSuffix)) {
          log.info(
            `Ignoring file ${key} with known ignored suffix ${keyData.fileSuffix}`,
          );

          return null;
        }


        if (fileResult && fileResult.fileBody) {


          log.info('csv parse file: ' + keyData.fileBaseName);
          const result = await parseCSVFile(
            keyData,
            fileResult.fileBody,
            null,
          );
          log.info('csv parsing result: ' + result);

          return {
            // key is sent to be stored in url decoded format to db
            key,
            file_name: keyData.fileName,
            bucket_arn: eventRecord.s3.bucket.arn,
            bucket_name: eventRecord.s3.bucket.name,
            size: eventRecord.s3.object.size,
            tags: fileResult.tags,
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
      results => log.info(results),
    );
  } catch (err) {
    // TODO: Figure out proper error handling.
    log.error(`An error occured while processing events: ${err}`);
    await adminLogger.error(
      `Tiedoston ${currentKey} käsittely epäonnistui. csv dataa ei tallennettu.`,
    );
  }
}
