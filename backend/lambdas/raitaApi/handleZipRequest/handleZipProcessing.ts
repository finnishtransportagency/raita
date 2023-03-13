import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { S3 } from 'aws-sdk';
import archiver from 'archiver';
import { PassThrough, Readable } from 'stream';
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
  shouldUpdateProgressData,
  updateProgressFailed,
  ZipRequestBody,
  getJsonObjectFromS3,
} from './utils';

function getLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext('handleZipProcessing');
  return {
    sourceBucket: getEnv('SOURCE_BUCKET'),
    dataCollectionBucket: getEnv('TARGET_BUCKET'),
  };
}

export async function handleZipProcessing(event: ZipRequestBody) {
  const s3Client = new S3Client({});
  const s3 = new S3();
  const archive = archiver('zip', {
    zlib: { level: 9 },
  });
  try {
    const { sourceBucket, dataCollectionBucket } = getLambdaConfigOrFail();
    validateInputs(event.keys, event.pollingFileKey);
    const keys =
      event.keys.length === 1 && event.dehydrated
        ? await getJsonObjectFromS3(dataCollectionBucket, event.keys[0], s3)
        : event.keys;
    const { pollingFileKey } = event;
    const totalKeys = keys.length;
    await uploadProgressData(
      initialProgressData,
      dataCollectionBucket,
      pollingFileKey,
      s3Client,
    );

    let lastUpdateStep = 0;
    let progressPercentage = 0;
    const promises = keys.map(async (key: string, index: number) => {
      const command = new GetObjectCommand({
        Bucket: sourceBucket,
        Key: key,
      });
      const data = await s3Client.send(command);
      const fileStream = data.Body as Readable;
      archive.append(fileStream, { name: key });
      progressPercentage = Math.floor(((index + 1) / totalKeys) * 100);
      if (shouldUpdateProgressData(progressPercentage, lastUpdateStep)) {
        await uploadProgressData(
          { ...initialProgressData, progressPercentage },
          dataCollectionBucket,
          pollingFileKey,
          s3Client,
        );
        lastUpdateStep = progressPercentage;
      }
      return data;
    });

    await Promise.all(promises).catch(async err => {
      log.error(`Error getting S3 Objects: ${err}`);
      await updateProgressFailed(
        dataCollectionBucket,
        pollingFileKey,
        s3Client,
      );
      throw err;
    });

    const stream = new PassThrough();
    archive.on('error', async err => {
      log.error(`Error generating zip file: ${err}`);
      await updateProgressFailed(
        dataCollectionBucket,
        pollingFileKey,
        s3Client,
      );
    });
    archive.pipe(stream);
    archive.finalize();

    const destKey = `zip/raita-zip-${Date.now()}.zip`;
    const putCommand = new PutObjectCommand({
      Bucket: dataCollectionBucket,
      Key: destKey,
      Body: stream,
    });

    await s3Client.send(putCommand).catch(async err => {
      log.error(`Error uploading zip file to S3: ${err}`);
      await updateProgressFailed(
        dataCollectionBucket,
        pollingFileKey,
        s3Client,
      );
      throw err;
    });

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
    return getRaitaLambdaErrorResponse(err);
  }
}
