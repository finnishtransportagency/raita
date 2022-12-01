import { S3Event } from 'aws-lambda';
import {
  FileMetadataEntry,
  IExtractionSpec,
  IFileResult,
  ParseValueResult,
} from '../../../types';
import { extractPathData } from './pathDataParser';
import { extractFileNameData } from './fileNameDataParser';
import {
  calculateHash,
  extractFileContentData,
  shouldCalculateHash,
  shouldParseContent,
} from './contentDataParser';
import { log } from '../../../utils/logger';
import BackendFacade from '../../../ports/backend';
import {
  getGetEnvWithPreassignedContext,
  isRaitaSourceSystem,
} from '../../../../utils';
import { decodeS3EventPropertyString, decodeUriString } from '../../utils';

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
export async function handleInspectionFileEvent(event: S3Event): Promise<void> {
  const config = getLambdaConfigOrFail();
  const backend = BackendFacade.getBackend(config);
  try {
    const spec = await backend.specs.getSpecification();
    const recordResults = event.Records.map<Promise<FileMetadataEntry | null>>(
      async eventRecord => {
        const file = await backend.files.getFile(eventRecord);
        const key = decodeS3EventPropertyString(eventRecord.s3.object.key);
        const path = key.split('/');
        const rootFolder = path[0];
        // Return empty null result if the top level folder does not match any of the names
        // of the designated source systems.
        if (!isRaitaSourceSystem(rootFolder)) {
          log.warn(
            `Ignoring file ${eventRecord.s3.object.key} outside Raita source system folders.`,
          );
          return null;
        }

        // TODO: Handle tag creation based on root folder

        const fileName = decodeUriString(path[path.length - 1]);
        const parseResults = await parseFileMetadata({
          fileName,
          path,
          file,
          spec,
        });
        return {
          file_name: fileName,
          key,
          bucket_arn: eventRecord.s3.bucket.arn,
          bucket_name: eventRecord.s3.bucket.name,
          size: eventRecord.s3.object.size,
          ...parseResults,
        };
      },
    );
    // TODO: Now error in any of file causes a general error to be logged and potentially causes valid files not to be processed.
    // Switch to granular error handling.
    // Check if lambda supports es2022 and if so, switch to Promise.allSettled

    const entries = await Promise.all(recordResults).then(
      results => results.filter(x => Boolean(x)) as Array<FileMetadataEntry>,
    );

    await backend.metadataStorage.saveFileMetadata(entries);
  } catch (err) {
    // TODO: Figure out proper error handling.
    log.error(`An error occured while processing events: ${err}`);
  }
}

async function parseFileMetadata({
  fileName,
  path,
  file,
  spec,
}: {
  fileName: string;
  path: Array<string>;
  file: IFileResult;
  spec: IExtractionSpec;
}): Promise<{ metadata: ParseValueResult; hash: string | undefined }> {
  const fileNameData = extractFileNameData(
    fileName,
    spec.fileNameExtractionSpec,
  );
  const pathData = extractPathData(path, spec.folderTreeExtractionSpec);
  const fileBody = file.fileBody?.toString();
  const fileContentData =
    shouldParseContent({
      fileName,
    }) && fileBody
      ? extractFileContentData(spec, fileBody)
      : {};
  const hash =
    shouldCalculateHash({ fileName }) && fileBody
      ? calculateHash(fileBody)
      : undefined;

  return {
    metadata: {
      ...pathData,
      ...fileContentData,
      ...fileNameData,
    },
    hash,
  };
}
