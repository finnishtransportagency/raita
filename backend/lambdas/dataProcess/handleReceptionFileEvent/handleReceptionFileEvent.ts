import { S3Event } from 'aws-lambda';
import { CopyObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { log } from '../../../utils/logger';
import { getGetEnvWithPreassignedContext } from '../../../../utils';
import {
  decodeS3EventPropertyString,
  getKeyData,
  isExcelSuffix,
  isZipPath,
  RaitaLambdaError,
} from '../../utils';
import { ZIP_SUFFIX } from '../../../../constants';
import { launchECSZipTask } from './utils';

function getLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext('Metadata parser lambda');
  return {
    clusterArn: getEnv('ECS_CLUSTER_ARN'),
    taskArn: getEnv('ECS_TASK_ARN'),
    containerName: getEnv('CONTAINER_NAME'),
    targetBucketName: getEnv('TARGET_BUCKET_NAME'),
    subnetIds: getEnv('SUBNET_IDS').split(','),
  };
}

export async function handleReceptionFileEvent(event: S3Event): Promise<void> {
  try {
    const recordResults = event.Records.map(async eventRecord => {
      const config = getLambdaConfigOrFail();
      const bucket = eventRecord.s3.bucket;
      const key = decodeS3EventPropertyString(eventRecord.s3.object.key);
      const { path, fileSuffix } = getKeyData(key);
      if (!isZipPath(path)) {
        throw new RaitaLambdaError(`Unexpected file path ${path}`, 400);
      }
      if (fileSuffix === ZIP_SUFFIX) {
        // Launch zip extraction for zip file
        return launchECSZipTask({
          ...config,
          key,
          sourceBucketName: bucket.name,
        });
      } else if (isExcelSuffix(fileSuffix)) {
        // Copy the file to target S3 bucket if is an Excel file
        const command = new CopyObjectCommand({
          Key: key,
          Bucket: config.targetBucketName,
          CopySource: `${bucket.name}/${key}`,
        });
        const s3Client = new S3Client({});
        return s3Client.send(command);
      }
    });
    await Promise.all(recordResults);
  } catch (err) {
    log.error(`An error occured while processing zip events: ${err}`);
  }
}
