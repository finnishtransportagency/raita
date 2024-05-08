import { CodePipelineEvent, Context } from 'aws-lambda';
import {
  lockTableExists,
  releasePipelineLock,
} from '../../../utils/dataProcessLock';
import { CodePipeline } from 'aws-sdk';
import { logPipeline } from '../../../utils/logger';
import { lambdaRequestTracker } from 'pino-lambda';

const withRequest = lambdaRequestTracker();

export async function handleReleasePipelineLock(
  event: CodePipelineEvent,
  context: Context,
): Promise<void> {
  withRequest(event, context);
  const pipeline = new CodePipeline();
  const jobId = event['CodePipeline.job'].id;
  try {
    const exists = await lockTableExists();
    if (!exists) {
      const message = 'Lock table does not exist';
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
    await releasePipelineLock();
    await pipeline
      .putJobSuccessResult({
        jobId,
        executionDetails: {
          summary: 'Lock released',
        },
      })
      .promise();
  } catch (error) {
    logPipeline.error(error);
    await pipeline
      .putJobFailureResult({
        jobId,
        failureDetails: {
          message: 'Unknown failure',
          type: 'JobFailed',
        },
      })
      .promise();
  }
}
