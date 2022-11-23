import { S3Event } from 'aws-lambda';
import { ECSClient, RunTaskCommand } from '@aws-sdk/client-ecs';
import { logger } from '../../../utils/logger';

import {
  S3,
  S3Client,
  PutObjectCommand,
  PutObjectCommandOutput,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import * as unzipper from 'unzipper';
import * as mime from 'mime-types';
import { getGetEnvWithPreassignedContext } from '../../../../utils';

function getLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext('Metadata parser lambda');
  return {
    clusterArn: getEnv('ECS_CLUSTER_ARN'),
    taskArn: getEnv('ECS_TASK_ARN'),
    containerName: getEnv('CONTAINER_NAME'),
    targetBucket: getEnv('TARGET_BUCKET_NAME'),
  };
}

/**
 *
 */
export async function handleZipFileEvent(event: S3Event): Promise<void> {
  try {
    const recordResults = event.Records.map(async eventRecord => {
      const { clusterArn, taskArn, containerName, targetBucket } =
        getLambdaConfigOrFail();
      const bucket = eventRecord.s3.bucket;
      const key = eventRecord.s3.object.key;
      // Get filename and filepath
      // const filename = decodeURIComponent(
      //   eventRecord.s3.object.key.replace(/\+/g, ' '),
      // );
      // const filepath = filename.substring(0, filename.lastIndexOf('/') + 1);

      // Invoke ECS task
      const client = new ECSClient({});
      const command = new RunTaskCommand({
        cluster: clusterArn,
        taskDefinition: taskArn,
        overrides: {
          containerOverrides: [
            {
              name: containerName,
              environment: [
                {
                  name: 'S3_SOURCE_BUCKET',
                  value: bucket.arn,
                },
                {
                  name: 'S3_SOURCE_KEY',
                  value: key,
                },
                {
                  name: 'S3_TARGET_BUCKET',
                  value: targetBucket,
                },
              ],
            },
          ],
        },
      });
      const response = await client.send(command);

      // await ecs
      //   .runTask({
      //     cluster: process.env.ECS_CLUSTER_ARN,
      //     taskDefinition: process.env.ECS_TASK_ARN,
      //     networkConfiguration: {
      //       awsvpcConfiguration: {
      //         subnets: process.env.SUBNET_IDS.split(','),
      //         assignPublicIp: 'DISABLED',
      //       },
      //     },
      //     overrides: {
      //       // can override the cpu and memory here if required.
      //       // cpu: "",
      //       // memory: "",
      //       containerOverrides: [
      //         {
      //           name: process.env.ECS_CONTAINER_NAME,
      //           // task runtime variables
      //           environment: [
      //             {
      //               name: 'EXAMPLE_DYNAMIC_VARIABLE',
      //               value: 'test',
      //             },
      //           ],
      //         },
      //       ],
      //     },
      //     count: 1,
      //     launchType: 'FARGATE',
      //   })
      //   .promise();
    });
  } catch (err) {
    // TODO: Implement proper error handling to fail gracefully if any of the file extractions fails.
    logger.logError(`An error occured while processing zip events: ${err}`);
  }
}
