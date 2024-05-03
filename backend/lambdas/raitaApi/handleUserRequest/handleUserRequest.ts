import { ALBEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { log } from '../../../utils/logger';
import { getUser, validateReadUser } from '../../../utils/userService';
import {
  getRaitaLambdaErrorResponse,
  getRaitaSuccessResponse,
} from '../../utils';
import { lambdaRequestTracker } from 'pino-lambda';

const withRequest = lambdaRequestTracker();

/**
 * Return user info that is used in frontend
 */
export async function handleUserRequest(
  event: ALBEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> {
  withRequest(event, _context);
  try {
    const user = await getUser(event);
    await validateReadUser(user);
    return getRaitaSuccessResponse({ roles: user.roles });
  } catch (err: any) {
    log.error(err);
    return getRaitaLambdaErrorResponse(err);
  }
}
