import { CodePipelineEvent, Context } from 'aws-lambda';
import {
  lockTableExists,
  releasePipelineLock,
} from '../../../utils/dataProcessLock';
import { CodePipeline } from 'aws-sdk';
import { logPipeline } from '../../../utils/logger';
import { lambdaRequestTracker } from 'pino-lambda';
import { getDBConnection } from '../../dataProcess/csvCommon/db/dbUtil';

const withRequest = lambdaRequestTracker();
const dbConnection = getDBConnection();

export async function handleReleasePipelineLock(
  event: CodePipelineEvent,
  context: Context,
): Promise<void> {
  withRequest(event, context);
  const pipeline = new CodePipeline();
  const jobId = event['CodePipeline.job'].id;
  try {
    const exists = await lockTableExists(await dbConnection);
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
    await releasePipelineLock(await dbConnection);
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
