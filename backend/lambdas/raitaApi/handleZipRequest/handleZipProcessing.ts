import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { S3 } from 'aws-sdk';
import JSZip from "jszip";
import { Readable } from "stream";
import { getGetEnvWithPreassignedContext } from "../../../../utils";
import { log } from "../../../utils/logger";
import { initialProgressData, successProgressData } from "./constants";
import { validateInputs, uploadProgressData, shouldUpdateProgressData, updateProgressFailed } from "./utils";

function getLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext('handleZipProcessing');
  return {
    sourceBucket: getEnv('SOURCE_BUCKET'),
    targetBucket: getEnv('TARGET_BUCKET'),
  };
}

async function handleZipProcessing(keys: string[], pollingFileKey: string) {
  const s3Client = new S3Client({});
  const zip = new JSZip();
  try {
    validateInputs(keys, pollingFileKey);
    const { sourceBucket, targetBucket } = getLambdaConfigOrFail();

    const totalKeys = keys.length;
    await uploadProgressData(initialProgressData, targetBucket, pollingFileKey, s3Client);

    let lastUpdateStep = 0;
    let progressPercentage = 0;
    const promises = keys.map(async (key: string, index: number) => {
      const command = new GetObjectCommand({
        Bucket: sourceBucket,
        Key: key,
      });
      const data = await s3Client.send(command);
      zip.file(key, data.Body as Readable);
      progressPercentage = Math.floor(((index + 1) / totalKeys) * 100);
      if (shouldUpdateProgressData(progressPercentage, lastUpdateStep)) {
        await uploadProgressData(
          { ...initialProgressData, progressPercentage },
          targetBucket,
          pollingFileKey,
          s3Client
        );
        lastUpdateStep = progressPercentage;
      }
      return data;
    });

    await Promise.all(promises).catch(async err => {
      log.error(`Error getting S3 Objects: ${err}`);
      await updateProgressFailed(targetBucket, pollingFileKey, s3Client);
      throw err;
    });

    const zipData = await zip
      .generateAsync({ type: 'nodebuffer' })
      .catch(async err => {
        log.error(`Error generating zip file: ${err}`);
        await updateProgressFailed(targetBucket, pollingFileKey, s3Client);
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
      await updateProgressFailed(targetBucket, pollingFileKey, s3Client);
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
        await updateProgressFailed(targetBucket, pollingFileKey, s3Client);
        throw err;
      });

    await uploadProgressData(
      { ...successProgressData, url },
      targetBucket,
      pollingFileKey,
      s3Client
    );
  } catch (err: unknown) {
    log.error(err);
  }
}
