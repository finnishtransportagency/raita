import { CodePipelineEvent } from 'aws-lambda';
import { releasePipelineLock } from '../../../utils/dataProcessLock';
import { CodePipeline } from 'aws-sdk';

export async function handleReleasePipelineLock(
  event: CodePipelineEvent,
): Promise<void> {
  const pipeline = new CodePipeline();
  const jobId = event['CodePipeline.job'].id;
  try {
    await releasePipelineLock();
    await pipeline.putJobSuccessResult({ jobId }).promise();
  } catch (error) {
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
