import { ALBEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import {
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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
    dataBucket: getEnvOrFail('DATA_BUCKET', 'handleS3FileRequest)'),
  };
}
const withRequest = lambdaRequestTracker();

/**
 * Generates a pre-signed url for a file in S3 bucket.
 * Receives parameters in POST request body.
 */
export async function handleFileRequest(
  event: ALBEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> {
  withRequest(event, _context);
  const { body } = event;
  const s3Client = new S3Client();
  try {
    const user = await getUser(event);
    await validateReadUser(user);
    const { dataBucket } = getLambdaConfigOrFail();
    const requestBody = body && JSON.parse(body);
    if (!requestBody?.key) {
      throw new Error('Key not specified');
    }
    const { key } = requestBody;
    log.info(user, `Generating pre-signed url for ${key}`);
    // Check if file exists
    const exists = await s3Client.send(
      new HeadObjectCommand({
        Bucket: dataBucket,
        Key: key,
      }),
    );
    if (!exists) {
      throw new RaitaLambdaError('Invalid input', 400);
    }
    // Create pre-signed url
    const downloadCommand = new GetObjectCommand({
      Bucket: dataBucket,
      Key: key,
    });
    const url = await getSignedUrl(s3Client, downloadCommand, {
      expiresIn: 30,
    });
    return getRaitaSuccessResponse({ url });
  } catch (err: any) {
    log.error(err);
    return getRaitaLambdaErrorResponse(err);
  }
}
