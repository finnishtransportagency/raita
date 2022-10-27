import { LogGroupTargetInput } from 'aws-cdk-lib/aws-events-targets';
import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { S3 } from 'aws-sdk';
import { getEnvOrFail } from '../../../utils';
import { logger } from '../../utils/logger';
import {
  getClientErrorMessage,
  getRaitaLambdaError,
  RaitaLambdaError,
} from '../utils';

function getLambdaConfigOrFail() {
  return {
    dataBucket: getEnvOrFail('DATA_BUCKET', 'handleS3FileRequest)'),
  };
}

/**
 * DRAFT IMPLEMENTATION
 * Generates a pre-signed url for a file in S3 bucket. Currently takes input in the POST request body.
 */
export async function handleFileRequest(
  event: APIGatewayEvent,
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

    console.log(event.body);
    console.log(requestBody);

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

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        {
          url,
        },
        null,
        2,
      ),
    };
  } catch (err: unknown) {
    logger.logError(err);
    return getRaitaLambdaError(err);
  }
}
