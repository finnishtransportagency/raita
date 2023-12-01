import { ALBEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { log } from '../../../utils/logger';
import { getUser, validateReadUser } from '../../../utils/userService';
import {
  getRaitaLambdaErrorResponse,
  getRaitaSuccessResponse,
} from '../../utils';

/**
 * Return user info that is used in frontend
 */
export async function handleUserRequest(
  event: ALBEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    const user = await getUser(event);
    await validateReadUser(user);
    return getRaitaSuccessResponse({ roles: user.roles });
  } catch (err: unknown) {
    log.error(err);
    return getRaitaLambdaErrorResponse(err);
  }
}
