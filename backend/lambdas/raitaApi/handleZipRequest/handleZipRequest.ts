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

function getLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext('handleZipRequest');
  return {
    zipProcessingFn: getEnv('ZIP_PROCESSING_FN'),
    region: getEnv('REGION'),
  };
}

export async function handleZipRequest(
  event: ALBEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> {
  const { body } = event;
  const requestBody = body && JSON.parse(body);
  const payloadString = JSON.stringify(requestBody);
  const payloadBytes = new TextEncoder().encode(payloadString);
  try {
    const user = await getUser(event);
    await validateReadUser(user);
    const { zipProcessingFn, region } = getLambdaConfigOrFail();

    const client = new LambdaClient({ region });
    const command = new InvokeCommand({
      FunctionName: zipProcessingFn,
      Payload: payloadBytes,
      InvocationType: 'Event',
    });
    await client.send(command);

    return getRaitaSuccessResponse({
      message: 'Zip processing initiated succesfully',
    });
  } catch (error) {
    log.error(error);
    return getRaitaLambdaErrorResponse(error);
  }
}
