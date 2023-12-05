import { ALBEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { log } from '../../../utils/logger';
import { getUser, validateAdminUser } from '../../../utils/userService';
import {
  getRaitaLambdaErrorResponse,
  getRaitaSuccessResponse,
  RaitaLambdaError,
} from '../../utils';
import { getPostgresLogs } from '../../../utils/pgLogReader';
import { format } from 'date-fns';
import { parseISO } from 'date-fns';

/**
 * Handle request to view admin logs
 *
 * Expects the following params in request body:
 * startDate: date string in the form of YYYY-MM-DD
 * endDate: date string in the form of YYYY-MM-DD
 */
export async function handleAdminLogsRequest(
  event: ALBEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> {
  const { queryStringParameters } = event;
  try {
    const user = await getUser(event);
    await validateAdminUser(user);

    if (!queryStringParameters?.startDate || !queryStringParameters?.endDate) {
      throw new RaitaLambdaError(
        'startDate and endDate must be specified',
        400,
      );
    }
    // validate
    const parsedStartDate = parseISO(queryStringParameters?.startDate);
    if (isNaN(parsedStartDate.getTime())) {
      throw new RaitaLambdaError('Invalid startDate', 400);
    }
    const parsedEndDate = parseISO(queryStringParameters?.endDate);
    if (isNaN(parsedEndDate.getTime())) {
      throw new RaitaLambdaError('Invalid endDate', 400);
    }
    // TODO: define max interval?
    const startTimestamp = `${format(parsedStartDate, 'yyyy-MM-dd')}T00:00:00Z`;
    const endTimestamp = `${format(parsedEndDate, 'yyyy-MM-dd')}T23:59:59Z`;

    const logs = await getPostgresLogs(startTimestamp, endTimestamp);
    return getRaitaSuccessResponse({ logs });
  } catch (err: unknown) {
    log.error(err);
    return getRaitaLambdaErrorResponse(err);
  }
}
