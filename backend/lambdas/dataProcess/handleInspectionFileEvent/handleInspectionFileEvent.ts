import { S3Event, SQSEvent } from 'aws-lambda';
import { FileMetadataEntry } from '../../../types';

import { log } from '../../../utils/logger';
import BackendFacade from '../../../ports/backend';
import {
  getGetEnvWithPreassignedContext,
  isRaitaSourceSystem,
} from '../../../../utils';
import {
  getDecodedS3ObjectKey,
  getKeyData,
  getOriginalZipNameFromPath,
  isKnownIgnoredSuffix,
  isKnownSuffix,
} from '../../utils';
import { parseFileMetadata } from './parseFileMetadata';
import { IAdminLogger } from '../../../utils/adminLog/types';
import { PostgresLogger } from '../../../utils/adminLog/postgresLogger';

function getLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext('Metadata parser lambda');
  return {
    configurationFile: getEnv('CONFIGURATION_FILE'),
    configurationBucket: getEnv('CONFIGURATION_BUCKET'),
    openSearchDomain: getEnv('OPENSEARCH_DOMAIN'),
    region: getEnv('REGION'),
    metadataIndex: getEnv('METADATA_INDEX'),
  };
}

const adminLogger: IAdminLogger = new PostgresLogger();

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
): Promise<void> {
  const config = getLambdaConfigOrFail();
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
        log.info({ fileName: key }, 'Start handler');
        const file = await backend.files.getFileStream(eventRecord);
        const keyData = getKeyData(key);
        const s3MetaData = file.metaData;
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
        const parseResults = await parseFileMetadata({
          keyData,
          fileStream: file.fileStream,
          spec,
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
          tags: file.tags,
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
