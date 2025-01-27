import { ALBEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getEnvOrFail } from '../../../../utils';
import { log } from '../../../utils/logger';
import { getUser, validateReadUser } from '../../../utils/userService';
import {
  getRaitaLambdaErrorResponse,
  getRaitaSuccessResponse,
  RaitaLambdaError,
} from '../../utils';
import { lambdaRequestTracker } from 'pino-lambda';

function getLambdaConfigOrFail() {
  return {
    dataBucket: getEnvOrFail('DATA_BUCKET', 'handlePollingRequest)'),
  };
}

async function getProgressDataFromS3(
  bucket: string,
  key: string,
  s3Client: S3Client,
) {
  const data = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
  return data?.Body ? JSON.parse(await data.Body.transformToString()) : null;
}

const withRequest = lambdaRequestTracker();

/**
 * Polls and parses a progression file in S3 to let the frontend
 * know when the request has succeeded.
 */
export async function handlePollingRequest(
  event: ALBEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> {
  withRequest(event, _context);
  const { queryStringParameters } = event;
  const s3Client = new S3Client();
  try {
    const user = await getUser(event);
    await validateReadUser(user);
    const { dataBucket } = getLambdaConfigOrFail();
    const queryKey = queryStringParameters?.queryKey;
    if (!queryKey) {
      throw new Error('Key not specified');
    }
    // Check if progress file exists
    const progressData = await getProgressDataFromS3(
      dataBucket,
      queryKey,
      s3Client,
    );
    if (!progressData) {
      throw new RaitaLambdaError('Invalid input', 400);
    }
    return getRaitaSuccessResponse({ progressData });
  } catch (err: any) {
    log.error(err);
    return getRaitaLambdaErrorResponse(err);
  }
}
