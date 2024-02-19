import { S3Event } from 'aws-lambda';
import { FileMetadataEntry } from '../../../types';

import { log } from '../../../utils/logger';
import BackendFacade from '../../../ports/backend';
import { getGetEnvWithPreassignedContext } from '../../../../utils';
import { getDecodedS3ObjectKey, getKeyData, isCsvSuffix } from '../../utils';
import { IAdminLogger } from '../../../utils/adminLogger';
import { PostgresLogger } from '../../../utils/postgresLogger';
import cloneable from 'cloneable-readable';
import { parseCSVFileStream } from './csvDataParser/csvDataParser';
import {S3FileRepository} from "../../../adapters/s3FileRepository";

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
    const recordResults = event.Records.map(
      async eventRecord => {
        const key = getDecodedS3ObjectKey(eventRecord);
        currentKey = key;
        log.info({ fileName: key }, 'Start handler');
        const fileStreamResult = await files.getFileStream(eventRecord);
        const keyData = getKeyData(key);

        if (!isCsvSuffix(keyData.fileSuffix)) {
          log.info(
            `Ignoring file ${key} with known ignored suffix ${keyData.fileSuffix}`,
          );

          return null;
        }


        log.info("fileStreamResult " + fileStreamResult);
        log.info("fileStreamResult " + fileStreamResult.fileStream);


        if (fileStreamResult && fileStreamResult.fileStream) {
          const originalStream = cloneable(fileStreamResult.fileStream);
          originalStream.pause();
          const fileStreamToCsvParse = originalStream.clone();

          await adminLogger.info(`Tiedosto parsittu: ${key}`);

          log.info('csv parse file: ' + keyData.fileBaseName);
          const result = await parseCSVFileStream(
            keyData,
            fileStreamToCsvParse,
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
            tags: fileStreamResult.tags,
          };
        } else return null;
      },
    );

  } catch (err) {
    // TODO: Figure out proper error handling.
    log.error(`An error occured while processing events: ${err}`);
    await adminLogger.error(
      `Tiedoston ${currentKey} käsittely epäonnistui. csv dataa ei tallennettu.`,
    );
  }
}
