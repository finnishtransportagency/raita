import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { S3 } from 'aws-sdk';
import { ALBEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import JSZip from 'jszip';

import { getGetEnvWithPreassignedContext } from '../../../../utils';
import { log } from '../../../utils/logger';
import { getUser, validateReadUser } from '../../../utils/userService';
import {
  shouldUpdateProgressData,
  updateProgressFailed,
  uploadProgressData,
  validateInputs,
} from './utils';
import { initialProgressData, successProgressData } from './constants';
import {
  getRaitaLambdaErrorResponse,
  getRaitaSuccessResponse,
} from '../../utils';

function getLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext('handleZipRequest');
  return {
    sourceBucket: getEnv('SOURCE_BUCKET'),
    targetBucket: getEnv('TARGET_BUCKET'),
  };
}

async function startZipProcess(keys: string[], pollingFileKey: string) {
  console.log('triggaa zippauksen, polling avain: ' + pollingFileKey);
  const s3Client = new S3Client({});
  const zip = new JSZip();
  try {
    validateInputs(keys, pollingFileKey);
    const { sourceBucket, targetBucket } = getLambdaConfigOrFail();

    const totalKeys = keys.length;
    uploadProgressData(initialProgressData, targetBucket, pollingFileKey);
    console.log('initial uploadi valmistuu')

    let lastUpdateStep = 0;
    let progressPercentage = 0;
    const promises = keys.map(async (key: string, index: number) => {
      const command = new GetObjectCommand({
        Bucket: sourceBucket,
        Key: key,
      });
      const data = await s3Client.send(command);
      zip.file(key, data.Body as Blob);
      progressPercentage = Math.floor(((index + 1) / totalKeys) * 100);
      console.log('progress: ' + progressPercentage);
      console.log('lastupdateperc: ' + lastUpdateStep);
      if (shouldUpdateProgressData(progressPercentage, lastUpdateStep)) {
        uploadProgressData(
          { ...initialProgressData, progressPercentage },
          targetBucket,
          pollingFileKey,
        );
        lastUpdateStep = progressPercentage;
      }
      return data;
    });

    await Promise.all(promises).catch(async err => {
      log.error(`Error getting S3 Objects: ${err}`);
      await updateProgressFailed(targetBucket, pollingFileKey);
      throw err;
    });

    const zipData = await zip
      .generateAsync({ type: 'nodebuffer' })
      .catch(async err => {
        log.error(`Error generating zip file: ${err}`);
        await updateProgressFailed(targetBucket, pollingFileKey);
        throw err;
      });

    const destKey = `zip/raita-zip-${Date.now()}.zip`;
    const putCommand = new PutObjectCommand({
      Bucket: targetBucket,
      Key: destKey,
      Body: zipData,
    });

    await s3Client.send(putCommand).catch(async err => {
      log.error(`Error uploading zip file to S3: ${err}`);
      await updateProgressFailed(targetBucket, pollingFileKey);
      throw err;
    });

    const s3 = new S3();
    const url = await s3
      .getSignedUrlPromise('getObject', {
        Bucket: targetBucket,
        Key: destKey,
        Expires: 30,
      })
      .catch(async err => {
        log.error(
          `Error getting the signed url for key: ${destKey} error: ${err}`,
        );
        await updateProgressFailed(targetBucket, pollingFileKey);
        throw err;
      });

    uploadProgressData(
      { ...successProgressData, url },
      targetBucket,
      pollingFileKey,
    );
  } catch (err: unknown) {
    log.error(err);
  }
}

export async function handleZipRequest(
  event: ALBEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> {
  const { body } = event;
  const requestBody = body && JSON.parse(body);
  const { keys, pollingFileKey } = requestBody;
  try {
    const user = await getUser(event);
    await validateReadUser(user);
    startZipProcess(keys, pollingFileKey);
    return getRaitaSuccessResponse({
      message: 'Zip process initiated successfully.',
    });
  } catch (error) {
    log.error(error);
    return getRaitaLambdaErrorResponse(error);
  }
}
