import { ALBEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

import { getGetEnvWithPreassignedContext } from '../../../../utils';
import { log } from '../../../utils/logger';
import { getUser, validateReadUser } from '../../../utils/userService';
import {
  getRaitaLambdaErrorResponse,
  getRaitaSuccessResponse,
} from '../../utils';
import { TextEncoder } from 'util';
import { invocationTypeByteLimit } from './constants';
import { S3Client } from '@aws-sdk/client-s3';
import { ZipRequestBody, uploadDeHydratedToS3 } from './utils';

function getLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext('handleZipRequest');
  return {
    zipProcessingFn: getEnv('ZIP_PROCESSING_FN'),
    region: getEnv('REGION'),
    targetBucket: getEnv('TARGET_BUCKET'),
  };
}

async function getPayloadString(
  requestBody: ZipRequestBody,
  targetBucket: string,
  s3Client: S3Client,
) {
  const requestBodyString = JSON.stringify(requestBody);
  if (requestBodyString.length <= invocationTypeByteLimit) {
    return requestBodyString;
  } else {
    const key = `dehydrate/${Date.now()}-${Math.floor(Math.random() * 100)}.json`;
    await uploadDeHydratedToS3(targetBucket, key, s3Client, requestBodyString);
    const dehydratedPayload = {
      keys: [key],
      pollingFileKey: requestBody.pollingFileKey,
      dehydrated: true,
    };
    return JSON.stringify(dehydratedPayload);
  }
}

export async function handleZipRequest(
  event: ALBEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> {
  const { body } = event;
  const s3Client = new S3Client({});
  try {
    const requestBody = body && JSON.parse(body);
    const user = await getUser(event);
    await validateReadUser(user);
    const { zipProcessingFn, region, targetBucket } = getLambdaConfigOrFail();
    // With the 'InvocationType: Event', the limited payload size is
    // 262144 bytes. If the payload size exceeds it, we dehydrate the payload
    // to s3 and pass the s3 key as payload.
    const payloadString = await getPayloadString(
      requestBody,
      targetBucket,
      s3Client,
    );
    const payload = new TextEncoder().encode(payloadString);
    const lambdaClient = new LambdaClient({ region });
    const command = new InvokeCommand({
      FunctionName: zipProcessingFn,
      Payload: payload,
      InvocationType: 'Event',
    });
    await lambdaClient.send(command);
    return getRaitaSuccessResponse({
      message: 'Zip processing initiated succesfully',
    });
  } catch (error) {
    log.error(error);
    return getRaitaLambdaErrorResponse(error);
  }
}
