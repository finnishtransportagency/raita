import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import archiver, { Archiver } from 'archiver';
import { getGetEnvWithPreassignedContext } from '../../../../utils';
import { log } from '../../../utils/logger';
import {
  getRaitaLambdaErrorResponse,
  getRaitaSuccessResponse,
} from '../../utils';
import {
  validateInputs,
  ZipRequestBody,
  getJsonObjectFromS3,
  createLazyDownloadStreamFrom,
  uploadZip,
} from './utils';
import { lambdaRequestTracker } from 'pino-lambda';
import { Context } from 'aws-lambda';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { uploadProgressData } from '../fileGeneration/utils';
import {
  FailedProgressData,
  InitialProgressData,
  SuccessProgressData,
} from '../fileGeneration/constants';

function getLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext('handleZipProcessing');
  return {
    sourceBucket: getEnv('SOURCE_BUCKET'),
    dataCollectionBucket: getEnv('TARGET_BUCKET'),
  };
}

function finalizeArchiveSafely(archive: Archiver): Promise<void> {
  return new Promise((resolve, reject) => {
    // if we dont reject on error, the archive.finalize() promise will resolve normally
    // and the error will go unchecked causing the application to crash
    archive.on('error', reject);
    archive.finalize().then(resolve).catch(reject);
  });
}

/**
 * map s3 file keys to filenames for zip file
 * append _(1) etc to the name part for duplicates
 */
export function mapFileKeysToZipFileNames(keys: string[]) {
  const existingFilenames: string[] = [];
  const fileNames = keys.map(key => {
    const splitKey = key.split('/');
    // handle duplicate filenames
    let fileName = splitKey[splitKey.length - 1];
    if (existingFilenames.includes(fileName)) {
      const fileNameSplit = fileName.split('.');
      const suffix = fileNameSplit[fileNameSplit.length - 1];
      const prefix = fileNameSplit.slice(0, fileNameSplit.length - 1).join('.');
      fileName = `${prefix}_(${existingFilenames.length}).${suffix}`;
    }
    existingFilenames.push(fileName);
    return fileName;
  });
  return fileNames;
}

const withRequest = lambdaRequestTracker();

export async function handleZipProcessing(
  event: ZipRequestBody,
  context: Context,
) {
  withRequest(event, context);
  const s3Client = new S3Client({});
  const archive = archiver('zip', {
    zlib: { level: 5 },
  });
  try {
    const { sourceBucket, dataCollectionBucket } = getLambdaConfigOrFail();
    validateInputs(event.keys, event.pollingFileKey);
    const keys =
      event.keys.length === 1 && event.dehydrated
        ? await getJsonObjectFromS3(
            dataCollectionBucket,
            event.keys[0],
            s3Client,
          ).then(obj => obj.keys)
        : event.keys;
    const { pollingFileKey } = event;
    await uploadProgressData(
      InitialProgressData,
      dataCollectionBucket,
      pollingFileKey,
      s3Client,
    );

    const totalKeys = keys.length;
    // handle duplicate filenames
    const fileNames = mapFileKeysToZipFileNames(keys);
    keys.forEach((key: string, index: number) => {
      if (index === totalKeys - 1) {
        log.info(`Streaming the last of ${totalKeys} files`);
      }
      const fileStream = createLazyDownloadStreamFrom(
        sourceBucket,
        key,
        s3Client,
      );
      let fileName = fileNames[index];
      archive.append(fileStream, { name: fileName });
    });

    const destKey = `zip/raita-zip-${Date.now()}.zip`;
    await Promise.all([
      finalizeArchiveSafely(archive),
      uploadZip(dataCollectionBucket, destKey, archive, s3Client),
    ]);

    const getObjectCommand = new GetObjectCommand({
      Bucket: dataCollectionBucket,
      Key: destKey,
    });
    const url = await getSignedUrl(s3Client, getObjectCommand, {
      expiresIn: 600,
    });

    await uploadProgressData(
      { ...SuccessProgressData, url },
      dataCollectionBucket,
      pollingFileKey,
      s3Client,
    );

    return getRaitaSuccessResponse({ message: 'Zipping completed' });
  } catch (err: any) {
    log.error(err);
    archive.abort();
    await uploadProgressData(
      FailedProgressData,
      getLambdaConfigOrFail().dataCollectionBucket,
      event.pollingFileKey,
      s3Client,
    );
    return getRaitaLambdaErrorResponse(err);
  }
}
