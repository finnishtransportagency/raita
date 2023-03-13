import { S3 } from 'aws-sdk';
import { ALBEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { getEnvOrFail } from '../../../../utils';
import { log } from '../../../utils/logger';
import { getUser, validateReadUser } from '../../../utils/userService';
import {
  getRaitaLambdaErrorResponse,
  getRaitaSuccessResponse,
  RaitaLambdaError,
} from '../../utils';

function getLambdaConfigOrFail() {
  return {
    dataBucket: getEnvOrFail('DATA_BUCKET', 'handlePollingRequest)'),
  };
}

async function getProgressDataFromS3(
  bucket: string,
  key: string,
  s3: S3,
) {
  const command = {
    Bucket: bucket,
    Key: key,
  };
  const data = await s3.getObject(command).promise();
  return data?.Body ? JSON.parse(data.Body.toString()) : null;
}

/**
 * Polls and parses a progression file in S3 to let the frontend
 * know when the request has succeeded.
 */
export async function handlePollingRequest(
  event: ALBEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> {
  const { queryStringParameters } = event;
  const s3 = new S3();
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
      s3,
    );
    if (!progressData) {
      throw new RaitaLambdaError('Invalid input', 400);
    }
    return getRaitaSuccessResponse({ progressData });
  } catch (err: unknown) {
    log.error(err);
    return getRaitaLambdaErrorResponse(err);
  }
}
