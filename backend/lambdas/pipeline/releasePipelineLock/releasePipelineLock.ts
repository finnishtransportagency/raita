import { CodePipelineEvent, Context } from 'aws-lambda';
import {
  lockTableExists,
  releasePipelineLock,
} from '../../../utils/dataProcessLock';
import { logPipeline } from '../../../utils/logger';
import { lambdaRequestTracker } from 'pino-lambda';
import { getDBConnection } from '../../dataProcess/csvCommon/db/dbUtil';
import {
  CodePipelineClient,
  PutJobFailureResultCommand,
  PutJobSuccessResultCommand,
} from '@aws-sdk/client-codepipeline';

const withRequest = lambdaRequestTracker();
const dbConnection = getDBConnection();

export async function handleReleasePipelineLock(
  event: CodePipelineEvent,
  context: Context,
): Promise<void> {
  withRequest(event, context);
  const pipelineClient = new CodePipelineClient();
  const jobId = event['CodePipeline.job'].id;
  try {
    const exists = await lockTableExists(await dbConnection);
    if (!exists) {
      const message = 'Lock table does not exist';
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
    await releasePipelineLock(await dbConnection);
    await pipelineClient.send(
      new PutJobSuccessResultCommand({
        jobId,
        executionDetails: {
          summary: 'Lock released',
        },
      }),
    );
  } catch (error) {
    logPipeline.error(error);
    await pipelineClient.send(
      new PutJobFailureResultCommand({
        jobId,
        failureDetails: {
          message: 'Unknown failure',
          type: 'JobFailed',
        },
      }),
    );
  }
}
