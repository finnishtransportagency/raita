import { ECSClient, LaunchType, RunTaskCommand } from '@aws-sdk/client-ecs';

/**
 * Build on example from https://www.gravitywell.co.uk/insights/using-ecs-tasks-on-aws-fargate-to-replace-lambda-functions/
 */
export const launchECSZipTask = async ({
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
