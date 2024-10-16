import { Context, S3Event, SQSEvent } from 'aws-lambda';
import { FileMetadataEntry } from '../../../types';

import { log } from '../../../utils/logger';
import BackendFacade from '../../../ports/backend';
import {
  getGetEnvWithPreassignedContext,
  isRaitaSourceSystem,
} from '../../../../utils';
import { getDecodedS3ObjectKey, getKeyData } from '../../utils';

import { IAdminLogger } from '../../../utils/adminLog/types';
import { PostgresLogger } from '../../../utils/adminLog/postgresLogger';
import {
  DBConnection,
  getDBConnection,
  insertRaporttiData,
  updateRaporttiMetadata,
} from '../csvCommon/db/dbUtil';
import { parseFileMetadata } from '../handleInspectionFileEvent/parseFileMetadata';
import {
  ENVIRONMENTS,
  fileSuffixesToIncludeInMetadataParsing,
} from '../../../../constants';
import { lambdaRequestTracker } from 'pino-lambda';

import { getLambdaConfigOrFail } from './util';

const postgresConnection: Promise<DBConnection> = getDBConnection();
const adminLogger: IAdminLogger = new PostgresLogger(postgresConnection);
const config = getLambdaConfigOrFail();
const backend = BackendFacade.getBackend(config);

const withRequest = lambdaRequestTracker();

/**
 * This is otherwise same as handleInspectionFileEvent.ts but writing to opensearh disabled.
 * This is started from file event from csv-data-mass-import s3 bucket.
 * The purpose of that bucket and this lambda is the mass import of existing csv files.
 * A separate bucket and lambda are use so import of existing files can be done indepedently of normal data-process.
 *
 */
export async function handleCSVMassImportFileEvent(
  event: SQSEvent,
  context: Context,
): Promise<void> {
  // @ts-ignore
  let currentKey: string = ''; // for logging in case of errors
  try {
    withRequest(event, context);
    const dbConnection = await postgresConnection;
    const doCSVParsing = true;
    const spec = await backend.specs.getSpecification();
    // one event from sqs can contain multiple s3 events
    const sqsRecordResults = event.Records.map(async sqsRecord => {
      const s3Event: S3Event = JSON.parse(sqsRecord.body);
      const recordResults = s3Event.Records.map<
        Promise<FileMetadataEntry | null>
      >(async eventRecord => {
        eventRecord;
        const key = getDecodedS3ObjectKey(eventRecord);
        currentKey = key;
        log.debug({ fileName: key }, 'Start CSVMassImport file handler');
        const fileStreamResult = await backend.files.getFileStream(eventRecord);
        const keyData = getKeyData(key);

        await adminLogger.init(
          'data-csv-mass-import',
          keyData.keyWithoutSuffix,
        );

        // Return empty null result if the top level folder does not match any of the names
        // of the designated source systems.
        if (!isRaitaSourceSystem(keyData.rootFolder)) {
          log.warn(`Ignoring file ${key} outside Raita source system folders.`);
          await adminLogger.error(
            `Tiedosto ${key} on väärässä tiedostopolussa ja sitä ei käsitellä`,
          );
          return null;
        }

        if (
          keyData.fileSuffix === fileSuffixesToIncludeInMetadataParsing.CSV_FILE
        ) {
          const reportId = dbConnection
            ? await insertRaporttiData(
                key,
                keyData.fileName,
                null,
                dbConnection,
              )
            : -1;

          const parseResults = await parseFileMetadata({
            keyData,
            fileStream: fileStreamResult.fileStream,
            spec,
            doCSVParsing,
            dbConnection,
            reportId,
            invocationId: 'MASSIMPORT',
          });
          if (parseResults.errors) {
            await adminLogger.error(
              `Tiedoston ${keyData.fileName} metadatan parsinnassa tapahtui virheitä. Metadata tallennetaan tietokantaan puutteellisena.`,
            );
          } else {
            await adminLogger.info(`Tiedosto parsittu: ${key}`);
          }
          const s3MetaData = fileStreamResult.metaData;
          const hash = eventRecord.s3.object.eTag;
          const skipHashCheck =
            s3MetaData['skip-hash-check'] !== undefined &&
            Number(s3MetaData['skip-hash-check']) === 1;
          return {
            // key is sent to be stored in url decoded format to db
            key,
            file_name: keyData.fileName,
            bucket_arn: eventRecord.s3.bucket.arn,
            bucket_name: eventRecord.s3.bucket.name,
            size: eventRecord.s3.object.size,
            metadata: parseResults.metadata,
            hash,
            tags: fileStreamResult.tags,
            reportId,
            errors: parseResults.errors,
            options: {
              skip_hash_check: skipHashCheck,
            },
          };
        } else {
          return null;
        }
      });
      // TODO: Now error in any of file causes a general error to be logged and potentially causes valid files not to be processed.
      // Switch to granular error handling.
      // Check if lambda supports es2022 and if so, switch to Promise.allSettled

      const entries = await Promise.all(recordResults).then(
        results => results.filter(x => Boolean(x)) as Array<FileMetadataEntry>,
      );
      if (doCSVParsing) {
        await updateRaporttiMetadata(entries, dbConnection);
      } else {
        log.warn('CSV postgres blocked in prod');
      }
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
            `Tiedoston ${currentKey} käsittely epäonnistui. Metadataa ei tallennettu.`,
          );
        }
      }),
    );
  } catch (err) {
    // TODO: Figure out proper error handling.
    log.error({
      error: err,
      message: 'An error occured while processing events',
    });
    await adminLogger.error(
      `Tiedoston ${currentKey} käsittely epäonnistui. Metadataa ei tallennettu.`,
    );
  }
}
