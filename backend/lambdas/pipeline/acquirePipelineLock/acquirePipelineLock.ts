import { CodePipelineEvent, Context } from 'aws-lambda';
import {
  DataProcessLockedError,
  acquirePipelineLockOrFail,
  lockTableExists,
} from '../../../utils/dataProcessLock';
import { CodePipeline } from 'aws-sdk';
import { logPipeline } from '../../../utils/logger';
import { lambdaRequestTracker } from 'pino-lambda';

const withRequest = lambdaRequestTracker();

export async function handleAcquirePipelineLock(
  event: CodePipelineEvent,
  context: Context,
): Promise<void> {
  withRequest(event, context);
  const pipeline = new CodePipeline();
  const jobId = event['CodePipeline.job'].id;
  try {
    const exists = await lockTableExists();
    if (!exists) {
      const message = 'Lock table does not exist, lock not acquired';
      logPipeline.warn(message);
      await pipeline
        .putJobSuccessResult({
          jobId,
          executionDetails: {
            summary: message,
          },
        })
        .promise();
      return;
    }
    await acquirePipelineLockOrFail();
    await pipeline
      .putJobSuccessResult({
        jobId,
        executionDetails: {
          summary: 'Lock acquired',
        },
      })
      .promise();
  } catch (error: any) {
    logPipeline.error(error);
    let message =
      error instanceof DataProcessLockedError
        ? 'Failed to acquire lock: data process in progress'
        : error.message ?? error;
    await pipeline
      .putJobFailureResult({
        jobId,
        failureDetails: {
          message,
          type: 'JobFailed',
        },
      })
      .promise();
  }
}
