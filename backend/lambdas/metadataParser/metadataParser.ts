import { S3Event } from 'aws-lambda';
import {
  FileMetadataEntry,
  IExtractionSpec,
  IFileResult,
  ParseValueResult,
} from '../../types';
import { extractPathData } from './pathDataParser';
import { extractFileNameData } from './fileNameDataParser';
import {
  extractFileContentData,
  isContentExtractionRequired,
} from './contentDataParser';
import { logger } from '../../utils/logger';
import BackendFacade from '../../ports/backend';
import { z } from 'zod';

/**
 * Currently function takes in S3 events. This has implication that file port
 * does not make sense conceptually as we are committed in S3 from the outset.
 * Should we make the handling more generic from the start, accepting also HTTP trigger
 * events and using Strategy pattern possibly to plug in correct file backend based on
 * config or even event details.
 *
 * How to make this more generic, for example if incoming
 *
 */

const MetadataParserConfig = z.object({
  configurationFile: z.string(),
  configurationBucket: z.string(),
  openSearchDomain: z.string(),
  region: z.string(),
  metadataIndex: z.string(),
});

export type IMetadataParserConfig = z.infer<typeof MetadataParserConfig>;

function getLambdaConfigOrFail() {
  const config = {
    configurationFile: process.env['CONFIGURATION_FILE'],
    configurationBucket: process.env['CONFIGURATION_BUCKET'],
    openSearchDomain: process.env['OPENSEARCH_DOMAIN'],
    region: process.env['REGION'],
    metadataIndex: process.env['METADATA_INDEX'],
  };
  return MetadataParserConfig.parse(config);
}

export async function metadataParser(event: S3Event): Promise<void> {
  const config = getLambdaConfigOrFail();
  const backend = BackendFacade.getBackend(config);
  try {
    const spec = await backend.specs.getSpecification();
    const recordResults = event.Records.map<Promise<FileMetadataEntry | null>>(
      async eventRecord => {
        // HERE flow control if multiple event types (S3, HTTP...)
        // or files in multiple repositories
        const file = await backend.files.getFile(eventRecord);
        if (!spec.include.includeContentTypes.includes(file.contentType)) {
          return null;
        }
        const path = eventRecord.s3.object.key.split('/');
        const fileName = path[path.length - 1];
        const metadata = await parseFileMetadata({
          fileName,
          path,
          file,
          spec,
        });
        return {
          fileName,
          arn: eventRecord.s3.bucket.arn,
          bucket: eventRecord.s3.bucket.name,
          metadata,
        };
      },
    ).filter(x => Boolean(x)) as Array<Promise<FileMetadataEntry>>;
    // TODO: Now error in any of file causes a general error to be logged and potentially causes valid files not to be processed.
    // Switch to granular error handling.
    // Check if lambda supports es2022 and if so, switch to Promise.allSettled
    const entries = await Promise.all(recordResults);
    await backend.metadataStorage.saveFileMetadata(entries);
    logger.log('Entries persisted in OpenSearch.');
  } catch (err) {
    // TODO: Figure out proper error handling.
    logger.log(`An error occured while processing events: ${err}`);
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
}): Promise<ParseValueResult> {
  const fileNameData = extractFileNameData(
    fileName,
    spec.fileNameExtractionSpec,
  );
  const pathData = extractPathData(path, spec.folderTreeExtractionSpec);
  const parseContentData = isContentExtractionRequired({
    fileName,
    contentType: file.contentType,
    includeSpec: spec.include,
  });
  const fileContentData = parseContentData
    ? extractFileContentData(spec, file.fileBody?.toString())
    : {};
  return {
    ...pathData,
    ...fileContentData,
    ...fileNameData,
  };
}
