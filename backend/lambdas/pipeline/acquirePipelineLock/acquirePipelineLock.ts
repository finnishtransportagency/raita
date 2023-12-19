import { CodePipelineEvent } from 'aws-lambda';
import {
  DataProcessLockedError,
  acquirePipelineLockOrFail,
} from '../../../utils/dataProcessLock';
import { CodePipeline } from 'aws-sdk';

export async function handleAcquirePipelineLock(
  event: CodePipelineEvent,
): Promise<void> {
  const pipeline = new CodePipeline();
  const jobId = event['CodePipeline.job'].id;
  try {
    await acquirePipelineLockOrFail();
    await pipeline.putJobSuccessResult({ jobId }).promise();
  } catch (error: any) {
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
