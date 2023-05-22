import {
  S3Client,
} from '@aws-sdk/client-s3';
import { S3 } from 'aws-sdk';
import archiver, { Archiver } from 'archiver';
import { getGetEnvWithPreassignedContext } from '../../../../utils';
import { log } from '../../../utils/logger';
import {
  getRaitaLambdaErrorResponse,
  getRaitaSuccessResponse,
} from '../../utils';
import { initialProgressData, successProgressData } from './constants';
import {
  validateInputs,
  uploadProgressData,
  updateProgressFailed,
  ZipRequestBody,
  getJsonObjectFromS3,
  createLazyDownloadStreamFrom,
  uploadZip,
} from './utils';

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

export async function handleZipProcessing(event: ZipRequestBody) {
  const s3Client = new S3Client({});
  const s3 = new S3();
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
            s3,
          ).then(obj => obj.keys)
        : event.keys;
    const { pollingFileKey } = event;
    await uploadProgressData(
      initialProgressData,
      dataCollectionBucket,
      pollingFileKey,
      s3Client,
    );

    const totalKeys = keys.length;
    keys.map(async (key: string, index: number) => {
      log.info(`handling file ${index} of ${totalKeys}`);
      const fileStream = await createLazyDownloadStreamFrom(
        sourceBucket,
        key,
        s3Client,
      );
      archive.append(fileStream, { name: key });
    });

    const destKey = `zip/raita-zip-${Date.now()}.zip`;
    await Promise.all([
      finalizeArchiveSafely(archive),
      uploadZip(dataCollectionBucket, destKey, archive, s3Client),
    ]);

    const url = await s3
      .getSignedUrlPromise('getObject', {
        Bucket: dataCollectionBucket,
        Key: destKey,
        Expires: 600,
      })
      .catch(async err => {
        log.error(
          `Error getting the signed url for key: ${destKey} error: ${err}`,
        );
        await updateProgressFailed(
          dataCollectionBucket,
          pollingFileKey,
          s3Client,
        );
        throw err;
      });

    await uploadProgressData(
      { ...successProgressData, url },
      dataCollectionBucket,
      pollingFileKey,
      s3Client,
    );

    return getRaitaSuccessResponse({ message: 'Zipping completed' });
  } catch (err: unknown) {
    log.error(err);
    archive.abort();
    return getRaitaLambdaErrorResponse(err);
  }
}
