// import { ECSClient, LaunchType, RunTaskCommand } from '@aws-sdk/client-ecs';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

/**
 * Build on example from https://www.gravitywell.co.uk/insights/using-ecs-tasks-on-aws-fargate-to-replace-lambda-functions/
 */
export const launchECSZipTask = async ({
  key,
  queueUrl,
}: {
  key: string;
  queueUrl: string;
}) => {
  // Invoke ECS task
  const sqsClient = new SQSClient();
  // add message to queue where ECS task will pick it up
  const body = {
    S3_SOURCE_KEY: key,
  };
  const messageCommand = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(body),
  });
  return await sqsClient.send(messageCommand);
};
