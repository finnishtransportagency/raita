import { S3Event } from 'aws-lambda';
import { ECSClient, LaunchType, RunTaskCommand } from '@aws-sdk/client-ecs';
import { logger } from '../../../utils/logger';
import {
  decodeS3EventPropertyString,
  getGetEnvWithPreassignedContext,
} from '../../../../utils';

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

/**
 * Build on example from https://www.gravitywell.co.uk/insights/using-ecs-tasks-on-aws-fargate-to-replace-lambda-functions/
 */
export async function handleZipFileEvent(event: S3Event): Promise<void> {
  try {
    const recordResults = event.Records.map(async eventRecord => {
      const {
        clusterArn,
        taskArn,
        containerName,
        targetBucketName,
        subnetIds,
      } = getLambdaConfigOrFail();
      const bucket = eventRecord.s3.bucket;
      const key = decodeS3EventPropertyString(eventRecord.s3.object.key);
      console.log(clusterArn, taskArn, containerName, targetBucketName);
      console.log(subnetIds);
      console.log(bucket);
      console.log(key);

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
                  value: bucket.name,
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
      const response = await client.send(command);
      console.log(response);
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
    await Promise.all(recordResults);
  } catch (err) {
    // TODO: Implement proper error handling to fail gracefully if any of the file extractions fails.
    logger.logError(`An error occured while processing zip events: ${err}`);
  }
}
