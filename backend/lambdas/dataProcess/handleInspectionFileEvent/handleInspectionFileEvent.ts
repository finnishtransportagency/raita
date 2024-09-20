import { Context, S3Event, SQSEvent } from 'aws-lambda';
import { FileMetadataEntry } from '../../../types';
import { lambdaRequestTracker } from 'pino-lambda';

import { log, logLambdaInitializationError } from '../../../utils/logger';
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
import { getLambdaConfigOrFail } from './util';

const findReportByKey = async (key: string) => {
  const foundReport = await (
    await prisma
  ).raportti.findFirst({
    where: {
      key: {
        in: [key],
      },
    },
  });
  return foundReport;
};
const init = () => {
  try {
    const withRequest = lambdaRequestTracker();

    // init db connections and such
    // TODO: there should only be one db library used
    const prisma = getPrismaClient();
    const postgresConnection: Promise<DBConnection> = getDBConnection();
    const config = getLambdaConfigOrFail();
    const backend = BackendFacade.getBackend(config);
    const adminLogger: IAdminLogger = new PostgresLogger(postgresConnection);
    return {
      withRequest,
      prisma,
      postgresConnection,
      config,
      backend,
      adminLogger,
    };
  } catch (error) {
    logLambdaInitializationError.error(
      { error },
      'Error in lambda initialization code, abort',
    );
    throw error;
  }
};

const {
  withRequest,
  prisma,
  postgresConnection,
  config,
  backend,
  adminLogger,
} = init();

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
  const doCSVParsing =
    config.allowCSVInProd === 'true' ||
    config.environment !== ENVIRONMENTS.prod;
  let currentKey: string = ''; // for logging in case of errors
  try {
    withRequest(event, context);
    const dbConnection = await postgresConnection;
    if (!dbConnection) {
      throw new Error('No db connection');
    }
    const spec = await backend.specs.getSpecification();
    // one event from sqs can contain multiple s3 events
    const sqsRecordResults = event.Records.map(async sqsRecord => {
      const s3Event: S3Event = JSON.parse(sqsRecord.body);
      const recordResults = s3Event.Records.map<
        Promise<FileMetadataEntry | null>
      >(async eventRecord => {
        const key = getDecodedS3ObjectKey(eventRecord);
        currentKey = key;
        log.info({ fileName: key }, 'Start inspection file handler');
        const fileStreamResult = await backend.files.getFileStream(eventRecord);
        const keyData = getKeyData(key);
        // note: etag can change if same object is uploaded again with multipart upload using different chunk size, is this a problem?
        const hash = eventRecord.s3.object.eTag;
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
          await adminLogger.error(`Tyhjä tiedosto: ${key}`);
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

        // entry values that are known before parsing
        const entryBeforeParsing: Partial<FileMetadataEntry> = {
          key,
          hash,
          file_name: keyData.fileName,
          bucket_arn: eventRecord.s3.bucket.arn,
          bucket_name: eventRecord.s3.bucket.name,
          size: eventRecord.s3.object.size,
          metadata: {
            parser_version: spec.parserVersion,
          },
          options: {
            skip_hash_check: skipHashCheck,
            require_newer_parser_version: requireNewerParserVersion,
          },
        };
        let shouldParse = true;
        // DB connection exists
        const foundReport = await findReportByKey(key);
        if (foundReport) {
          // Report found
          reportId = foundReport.id;

          shouldParse = checkExistingHash(
            entryBeforeParsing as FileMetadataEntry,
            foundReport,
          );
        } else {
          // Report not found, insert new report
          reportId = await insertRaporttiData(
            key,
            keyData.fileName,
            null,
            dbConnection,
          );
        }
        if (!shouldParse) {
          log.info({ key, hash, reportId }, 'File not changed, skip parsing');
          return null;
        }

        const parseResults = await parseFileMetadata({
          keyData,
          fileStream: fileStreamResult.fileStream,
          spec,
          doCSVParsing,
          dbConnection,
          reportId,
          invocationId,
        });
        if (parseResults.errors) {
          await adminLogger.error(
            `Tiedoston ${keyData.fileName} metadatan parsinnassa tapahtui virheitä. Metadata tallennetaan tietokantaan puutteellisena.`,
          );
        } else {
          await adminLogger.info(`Tiedosto parsittu: ${key}`);
        }
        // if parsed_at_datetime already exists on found report, don't update it except if hash also changed
        let parsed_at_datetime =
          foundReport?.parsed_at_datetime != null
            ? foundReport.parsed_at_datetime.toISOString()
            : parseResults.metadata.parsed_at_datetime;
        if (foundReport && foundReport.hash !== hash) {
          parsed_at_datetime = parseResults.metadata.parsed_at_datetime;
        }
        return {
          ...entryBeforeParsing,
          metadata: {
            ...parseResults.metadata,
            parsed_at_datetime,
          },
          tags: fileStreamResult.tags,
          reportId,
          errors: parseResults.errors,
        } as FileMetadataEntry;
      });
      // TODO: Now error in any of file causes a general error to be logged and potentially causes valid files not to be processed.
      // Switch to granular error handling.
      // Check if lambda supports es2022 and if so, switch to Promise.allSettled

      const entries = (await Promise.all(recordResults)).filter(x =>
        Boolean(x),
      ) as Array<FileMetadataEntry>;

      if (!entries.length) {
        log.info('Nothing to save, exit');
        return null;
      }

      if (doCSVParsing) {
        await updateRaporttiMetadata(entries, dbConnection);
      } else {
        log.warn('CSV postgres blocked in prod');
      }
      await backend.metadataStorage.saveFileMetadata(entries);
      return true;
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
        return;
      }),
    );
  } catch (err) {
    // TODO: Figure out proper error handling.
    log.error({
      error: err,
      currentKey,
      message: 'An error occured while processing events',
    });
    await adminLogger.error(
      `Tiedoston ${currentKey} käsittely epäonnistui. Metadataa ei tallennettu.`,
    );
  }
}
