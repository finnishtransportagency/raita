import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { S3 } from 'aws-sdk';

class RaitaLambdaException extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Generates a pre-signed url for a file in S3 bucket
 * Currently takes input in the POST request body
 */
export async function handleFileRequest(
  event: APIGatewayEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> {
  const { pathParameters, body } = event;
  const s3 = new S3();
  try {
    const dataBucket = process.env.DATA_BUCKET;
    if (!dataBucket) {
      throw new Error('Data bucket not specified.');
    }
    const requestBody = body ? JSON.parse(body) : undefined;
    if (!requestBody?.key) {
      throw new Error('path parameter key does not exist');
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
      throw new RaitaLambdaException('Invalid input', 400);
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
    const errorMessage =
      ((err instanceof Error || err instanceof RaitaLambdaException) &&
        err.message) ||
      (typeof err === 'string' && err) ||
      'An error occurred.';
    return {
      statusCode:
        (err instanceof RaitaLambdaException && err.statusCode) || 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: errorMessage }, null, 2),
    };
  }
}
