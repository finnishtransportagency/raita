import { S3Event } from 'aws-lambda';
import { ECSClient, LaunchType, RunTaskCommand } from '@aws-sdk/client-ecs';
import { logger } from '../../../utils/logger';
import { getGetEnvWithPreassignedContext } from '../../../../utils';
import {
  decodeS3EventPropertyString,
  getKeyConstituents,
  isZipPath,
  RaitaLambdaError,
} from '../../utils';
import { ZIP_SUFFIX } from '../../../../constants';
import { CopyObjectCommand, S3Client } from '@aws-sdk/client-s3';

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

const launchECSZipTask = async ({
  clusterArn,
  taskArn,
  containerName,
  targetBucketName,
  subnetIds,
  key,
  sourceBucketName,
}: {
  clusterArn: string;
  taskArn: string;
  containerName: string;
  targetBucketName: string;
  subnetIds: Array<string>;
  key: string;
  sourceBucketName: string;
}) => {
  // Invoke ECS task
  const client = new ECSClient({});
  const command = new RunTaskCommand({
    cluster: clusterArn,
    taskDefinition: taskArn,
    launchType: LaunchType.FARGATE,
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets: subnetIds,
        assignPublicIp: 'DISABLED',
      },
    },
    overrides: {
      containerOverrides: [
        {
          name: containerName,
          environment: [
            {
              name: 'S3_SOURCE_BUCKET',
              value: sourceBucketName,
            },
            {
              name: 'S3_SOURCE_KEY',
              value: key,
            },
            {
              name: 'S3_TARGET_BUCKET',
              value: targetBucketName,
            },
          ],
        },
      ],
    },
  });
  await client.send(command);
};

/**
 * Build on example from https://www.gravitywell.co.uk/insights/using-ecs-tasks-on-aws-fargate-to-replace-lambda-functions/
 */
export async function handleZipFileEvent(event: S3Event): Promise<void> {
  try {
    const recordResults = event.Records.map(async eventRecord => {
      const config = getLambdaConfigOrFail();
      const bucket = eventRecord.s3.bucket;
      const key = decodeS3EventPropertyString(eventRecord.s3.object.key);
      const { path, fileSuffix } = getKeyConstituents(key);
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
      } else {
        // Copy the file to target S3 bucket if not zip file
        const command = new CopyObjectCommand({
          Key: key,
          Bucket: bucket.name,
          CopySource: key,
        });
        const s3Client = new S3Client({});
        return s3Client.send(command);
      }
    });
    await Promise.all(recordResults);
  } catch (err) {
    // TODO: Temporary logging
    logger.logError(`An error occured while processing zip events: ${err}`);
  }
}
