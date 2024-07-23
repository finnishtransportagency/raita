import { Context, S3Event, SQSEvent } from 'aws-lambda';
import { FileMetadataEntry } from '../../../types';
import { lambdaRequestTracker } from 'pino-lambda';

import { log } from '../../../utils/logger';
import BackendFacade from '../../../ports/backend';
import {
  getGetEnvWithPreassignedContext,
  isRaitaSourceSystem,
} from '../../../../utils';
import {
  checkExistingHash,
  getDecodedS3ObjectKey,
  getKeyData,
  getOriginalZipNameFromPath,
  isKnownIgnoredSuffix,
  isKnownSuffix,
} from '../../utils';
import { parseFileMetadata } from './parseFileMetadata';
import { IAdminLogger } from '../../../utils/adminLog/types';
import { PostgresLogger } from '../../../utils/adminLog/postgresLogger';
import {
  DBConnection,
  getDBConnection,
  insertRaporttiData,
  updateRaporttiMetadata,
} from '../csvCommon/db/dbUtil';
import { ENVIRONMENTS } from '../../../../constants';
import { getPrismaClient } from '../../../utils/prismaClient';
import { compareVersionStrings } from '../../../utils/compareVersionStrings';

export function getLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext('Metadata parser lambda');
  return {
    configurationFile: getEnv('CONFIGURATION_FILE'),
    configurationBucket: getEnv('CONFIGURATION_BUCKET'),
    inspectionBucket: getEnv('INSPECTION_BUCKET'),
    csvBucket: getEnv('CSV_BUCKET'),
    openSearchDomain: getEnv('OPENSEARCH_DOMAIN'),
    region: getEnv('REGION'),
    metadataIndex: getEnv('METADATA_INDEX'),
    environment: getEnv('ENVIRONMENT'),
    allowCSVInProd: getEnv('ALLOW_CSV_INSPECTION_EVENT_PARSING_IN_PROD'),
  };
}
const adminLogger: IAdminLogger = new PostgresLogger();

const findReportByKey = async (key: string) => {
  const prisma = getPrismaClient();
  const foundReport = await (
    await prisma
  ).raportti.findFirst({
    where: {
      key: {
        in: [key],
      },
    },
  });
  await adminLogger.info(
    `FoundReport adminlogger: ${foundReport?.key}, ${key}`,
  );
  return foundReport;
};

const withRequest = lambdaRequestTracker();

let dbConnection: DBConnection | undefined = undefined;

export type IMetadataParserConfig = ReturnType<typeof getLambdaConfigOrFail>;

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
export async function handleInspectionFileEvent(
  event: SQSEvent,
  context: Context,
): Promise<void> {
  withRequest(event, context);
  const config = getLambdaConfigOrFail();
  const doCSVParsing =
    config.allowCSVInProd === 'true' ||
    config.environment !== ENVIRONMENTS.prod;
  if (doCSVParsing) {
    dbConnection = await getDBConnection();
  }
  const backend = BackendFacade.getBackend(config);
  let currentKey: string = ''; // for logging in case of errors
  try {
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
        log.info({ fileName: key }, 'Start inspection file handler');
        const fileStreamResult = await backend.files.getFileStream(
          eventRecord,
          true,
        );
        const keyData = getKeyData(key);
        const s3MetaData = fileStreamResult.metaData;
        const requireNewerParserVersion =
          s3MetaData['require-newer-parser-version'] !== undefined &&
          Number(s3MetaData['require-newer-parser-version']) === 1;
        const skipHashCheck =
          s3MetaData['skip-hash-check'] !== undefined &&
          Number(s3MetaData['skip-hash-check']) === 1;
        const invocationId = s3MetaData['invocation-id']
          ? decodeURIComponent(s3MetaData['invocation-id'])
          : getOriginalZipNameFromPath(keyData.path); // fall back to old behaviour: guess zip file name
        await adminLogger.init('data-inspection', invocationId);

        if (eventRecord.s3.object.size === 0) {
          // empty file is probably an error and will mess up searching by hash
          log.error({ message: 'Empty file, skipping', key });
          adminLogger.error(`Tyhjä tiedosto: ${key}`);
          return null;
        }
        // Return empty null result if the top level folder does not match any of the names
        // of the designated source systems.
        if (!isRaitaSourceSystem(keyData.rootFolder)) {
          log.warn(`Ignoring file ${key} outside Raita source system folders.`);
          await adminLogger.error(
            `Tiedosto ${key} on väärässä tiedostopolussa ja sitä ei käsitellä`,
          );
          return null;
        }
        if (!isKnownSuffix(keyData.fileSuffix)) {
          if (isKnownIgnoredSuffix(keyData.fileSuffix)) {
            log.info(
              `Ignoring file ${key} with known ignored suffix ${keyData.fileSuffix}`,
            );
            await adminLogger.info(
              `Tiedosto ${key} sisältää tunnetun tiedostopäätteen jota ei käsitellä: ${keyData.fileSuffix}`,
            );
          } else {
            log.error(
              `Ignoring file ${key} with unknown suffix ${keyData.fileSuffix}`,
            );
            await adminLogger.warn(
              `Tiedosto ${key} sisältää tuntemattoman tiedostopäätteen ja sitä ei käsitellä`,
            );
          }
          return null;
        }

        let reportId: number;

        if (!dbConnection) {
          // No DB connection
          reportId = -1;
        } else {
          // DB connection exists
          const foundReport = await findReportByKey(key);
          if (foundReport) {
            // Report found
            reportId = foundReport.id;
          } else {
            // Report not found, insert new report
            reportId = await insertRaporttiData(
              key,
              keyData.fileName,
              null,
              dbConnection,
            );
          }
        }

        const parseResults = await parseFileMetadata({
          keyData,
          fileStream: fileStreamResult.fileStream,
          spec,
          doCSVParsing,
          dbConnection,
          reportId,
        });
        if (parseResults.errors) {
          await adminLogger.error(
            `Tiedoston ${keyData.fileName} metadatan parsinnassa tapahtui virheitä. Metadata tallennetaan tietokantaan puutteellisena.`,
          );
        } else {
          await adminLogger.info(`Tiedosto parsittu: ${key}`);
        }
        return {
          // key is sent to be stored in url decoded format to db
          key,
          file_name: keyData.fileName,
          bucket_arn: eventRecord.s3.bucket.arn,
          bucket_name: eventRecord.s3.bucket.name,
          size: eventRecord.s3.object.size,
          metadata: parseResults.metadata,
          hash: parseResults.hash,
          tags: fileStreamResult.tags,
          reportId,
          errors: parseResults.errors,
          options: {
            skip_hash_check: skipHashCheck,
            require_newer_parser_version: requireNewerParserVersion,
          },
        };
      });
      // TODO: Now error in any of file causes a general error to be logged and potentially causes valid files not to be processed.
      // Switch to granular error handling.
      // Check if lambda supports es2022 and if so, switch to Promise.allSettled

      const entries = await Promise.all(recordResults).then(
        results => results.filter(x => Boolean(x)) as Array<FileMetadataEntry>,
      );

      if (doCSVParsing) {
        if (dbConnection) {
          const checkedEntries = await Promise.all(
            entries.map(async entry => {
              const foundReport = await findReportByKey(entry.key);
              const isSaveable = foundReport
                ? await checkExistingHash(entry, foundReport)
                : true;
              // updating existing file: don't update parsed_at_datetime

              entry.metadata.parsed_at_datetime =
                foundReport?.parsed_at_datetime != null
                  ? foundReport.parsed_at_datetime.toISOString()
                  : entry.metadata.parsed_at_datetime;
              return { entry, isSaveable };
            }),
          );
          const saveableEntries = checkedEntries
            .filter(result => result.isSaveable)
            .map(result => {
              adminLogger.info(result.entry.hash);
              return result.entry;
            });

          await updateRaporttiMetadata(saveableEntries, dbConnection);
        } else {
          log.error(
            'content parsing with called csv enabled and without dbconnection',
          );
        }
      } else {
        log.warn('CSV postgres blocked in prod');
      }
      return await backend.metadataStorage.saveFileMetadata(entries);
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
