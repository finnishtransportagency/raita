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
import { lambdaRequestTracker } from 'pino-lambda';
import { randomUUID } from 'crypto';
import { format } from 'date-fns';
import { uploadProgressData } from '../fileGeneration/utils';
import { InitialProgressData } from '../fileGeneration/constants';

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
  uuid: string,
) {
  const requestBodyString = JSON.stringify(requestBody);
  if (requestBodyString.length <= invocationTypeByteLimit) {
    return requestBodyString;
  } else {
    const key = `progress/zip/dehydrate/${uuid}.json`;
    await uploadDeHydratedToS3(targetBucket, key, s3Client, requestBodyString);
    const dehydratedPayload = {
      keys: [key],
      pollingFileKey: requestBody.pollingFileKey,
      resultFileKey: requestBody.resultFileKey,
      dehydrated: true,
    };
    return JSON.stringify(dehydratedPayload);
  }
}

const withRequest = lambdaRequestTracker();

export async function handleZipRequest(
  event: ALBEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> {
  withRequest(event, _context);
  const { body } = event;
  const s3Client = new S3Client({});
  try {
    const requestBody: { keys: string[] } = body && JSON.parse(body);
    const user = await getUser(event);
    log.info({ user, requestBody });
    await validateReadUser(user);
    const { zipProcessingFn, region, targetBucket } = getLambdaConfigOrFail();
    // With the 'InvocationType: Event', the limited payload size is
    // 262144 bytes. If the payload size exceeds it, we dehydrate the payload
    // to s3 and pass the s3 key as payload.

    const now = new Date();
    const fileBaseName = `RAITA-zip-${format(now, 'dd.MM.yyyy-HH-mm')}`;
    const uuid = randomUUID();
    const pollingKey = `progress/${uuid}.json`;
    const resultFileKey = `common/zip/${uuid}/${fileBaseName}.zip`;

    const payloadString = await getPayloadString(
      {
        keys: requestBody.keys,
        pollingFileKey: pollingKey,
        resultFileKey,
      },
      targetBucket,
      s3Client,
      uuid,
    );
    const payload = new TextEncoder().encode(payloadString);
    const lambdaClient = new LambdaClient({ region });
    await uploadProgressData(
      InitialProgressData,
      targetBucket,
      pollingKey,
      s3Client,
    );
    const command = new InvokeCommand({
      FunctionName: zipProcessingFn,
      Payload: payload,
      InvocationType: 'Event',
    });
    await lambdaClient.send(command);
    return getRaitaSuccessResponse({
      polling_key: pollingKey,
    });
  } catch (error: any) {
    log.error(error);
    return getRaitaLambdaErrorResponse(error);
  }
}
