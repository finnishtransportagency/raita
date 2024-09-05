// import { ECSClient, LaunchType, RunTaskCommand } from '@aws-sdk/client-ecs';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { log } from '../../../utils/logger';
import { asyncWait } from '../../../utils/common';

/**
 * Build on example from https://www.gravitywell.co.uk/insights/using-ecs-tasks-on-aws-fargate-to-replace-lambda-functions/
 */
export const launchECSZipTask = async ({
  key,
  queueUrl,
  sqsClient,
}: {
  key: string;
  queueUrl: string;
  sqsClient: SQSClient;
}) => {
  // Invoke ECS task
  // add message to queue where ECS task will pick it up
  const body = {
    S3_SOURCE_KEY: key,
  };
  const messageCommand = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(body),
  });
  let waitTime = 100;
  let maxWait = 4000;
  while (true) {
    // there can be a lot of parallel executions and sending can randomly fail, retry a few times
    try {
      const res = await sqsClient.send(messageCommand);
      return res;
    } catch (error) {
      log.warn(
        { error, body, waitTime },
        'Sending sqs client message failed, retrying',
      );
      if (waitTime > maxWait) {
        throw new Error('Error sending sqs after max retries');
      }
      await asyncWait(waitTime);
      waitTime = waitTime * 2;
      continue;
    }
  }
};
