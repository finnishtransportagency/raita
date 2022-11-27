import { ALBEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { S3 } from 'aws-sdk';
import { getEnvOrFail } from '../../../../utils';
import { logger } from '../../../utils/logger';
import {
  getRaitaLambdaErrorResponse,
  getRaitaSuccessResponse,
  RaitaLambdaError,
} from '../../utils';

function getLambdaConfigOrFail() {
  return {
    dataBucket: getEnvOrFail('DATA_BUCKET', 'handleS3FileRequest)'),
  };
}

/**
 * Generates a pre-signed url for a file in S3 bucket.
 * Receives parameters in POST request body.
 */
export async function handleFileRequest(
  event: ALBEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> {
  const { body } = event;
  const s3 = new S3();
  try {
    const { dataBucket } = getLambdaConfigOrFail();
    const requestBody = body && JSON.parse(body);
    if (!requestBody?.key) {
      throw new Error('Key not specified');
    }
    const { key } = requestBody;
    // Check if file exists
    const exists = await s3
      .headObject({
        Bucket: dataBucket,
        Key: key,
      })
      .promise();
    if (!exists) {
      throw new RaitaLambdaError('Invalid input', 400);
    }
    // Create pre-signed url
    const url = s3.getSignedUrl('getObject', {
      Bucket: dataBucket,
      Key: key,
      Expires: 30,
    });
    return getRaitaSuccessResponse({ url });
  } catch (err: unknown) {
    logger.logError(err);
    return getRaitaLambdaErrorResponse(err);
  }
}
