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
 * Size in rows
 */
const MAXIMUM_LOG_PAGE_SIZE = 1000;

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
    if (!queryStringParameters?.pageIndex) {
      throw new RaitaLambdaError('pageIndex must be specified', 400);
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

    const defaultPageSize = MAXIMUM_LOG_PAGE_SIZE;
    const pageSize = Number(queryStringParameters?.pageSize ?? defaultPageSize);
    if (isNaN(pageSize) || pageSize > MAXIMUM_LOG_PAGE_SIZE) {
      throw new RaitaLambdaError('Invalid pageSize', 400);
    }
    const pageIndex = Number(queryStringParameters.pageIndex);
    if (isNaN(pageIndex)) {
      throw new RaitaLambdaError('Invalid pageIndex', 400);
    }

    const logResult = await getPostgresLogs(
      startTimestamp,
      endTimestamp,
      pageIndex,
      pageSize,
    );
    return getRaitaSuccessResponse(logResult);
  } catch (err: any) {
    log.error(err);
    return getRaitaLambdaErrorResponse(err);
  }
}
