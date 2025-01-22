import { CodePipelineEvent, Context } from 'aws-lambda';
import {
  DataProcessLockedError,
  acquirePipelineLockOrFail,
  lockTableExists,
} from '../../../utils/dataProcessLock';
import {
  CodePipelineClient,
  PutJobFailureResultCommand,
  PutJobSuccessResultCommand,
} from '@aws-sdk/client-codepipeline';
import { logPipeline } from '../../../utils/logger';
import { lambdaRequestTracker } from 'pino-lambda';
import { getDBConnection } from '../../dataProcess/csvCommon/db/dbUtil';

const withRequest = lambdaRequestTracker();
const dbConnection = getDBConnection();

export async function handleAcquirePipelineLock(
  event: CodePipelineEvent,
  context: Context,
): Promise<void> {
  withRequest(event, context);
  const pipelineClient = new CodePipelineClient();
  const jobId = event['CodePipeline.job'].id;
  try {
    const exists = await lockTableExists(await dbConnection);
    if (!exists) {
      const message = 'Lock table does not exist, lock not acquired';
      logPipeline.warn(message);
      await pipelineClient.send(
        new PutJobSuccessResultCommand({
          jobId,
          executionDetails: {
            summary: message,
          },
        }),
      );
      return;
    }
    await acquirePipelineLockOrFail(await dbConnection);
    await pipelineClient.send(
      new PutJobSuccessResultCommand({
        jobId,
        executionDetails: {
          summary: 'Lock acquired',
        },
      }),
    );
  } catch (error: any) {
    logPipeline.error(error);
    let message =
      error instanceof DataProcessLockedError
        ? 'Failed to acquire lock: data process in progress'
        : error.message ?? error;
    await pipelineClient.send(
      new PutJobFailureResultCommand({
        jobId,
        failureDetails: {
          message,
          type: 'JobFailed',
        },
      }),
    );
  }
}
