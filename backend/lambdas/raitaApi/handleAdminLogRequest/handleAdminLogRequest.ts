import { ALBEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { log } from '../../../utils/logger';
import { getUser, validateAdminUser } from '../../../utils/userService';
import {
  getRaitaLambdaErrorResponse,
  getRaitaSuccessResponse,
  RaitaLambdaError,
} from '../../utils';
import { getSingleEventLogs } from '../../../utils/adminLog/pgLogReader';
import { parseISO } from 'date-fns';
import { AdminLogSource } from '../../../utils/adminLog/types';
import { lambdaRequestTracker } from 'pino-lambda';

/**
 * Size in rows
 */
const MAXIMUM_LOG_PAGE_SIZE = 1000;

const withRequest = lambdaRequestTracker();

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
  withRequest(event, _context);
  const { queryStringParameters } = event;
  try {
    const user = await getUser(event);
    log.info({ user, queryStringParameters });
    await validateAdminUser(user);
    if (
      !queryStringParameters?.invocationId ||
      !queryStringParameters?.date ||
      !queryStringParameters.sources ||
      !queryStringParameters.pageIndex
    ) {
      throw new RaitaLambdaError(
        'invocationId, date and sources must be specified',
        400,
      );
    }
    const parsedDate = parseISO(queryStringParameters.date);
    if (isNaN(parsedDate.getTime())) {
      throw new RaitaLambdaError('Invalid parsedDate', 400);
    }
    const invocationId = decodeURIComponent(queryStringParameters.invocationId);
    const sources = queryStringParameters.sources;
    const splitSources = sources.split(',');
    let parsedSources: AdminLogSource[];
    if (
      splitSources.filter(source =>
        [
          'delete-process',
          'data-inspection',
          'data-reception',
          'data-csv',
          'conversion-process',
        ].includes(source),
      ).length === splitSources.length
    ) {
      parsedSources = splitSources as AdminLogSource[];
    } else {
      throw new RaitaLambdaError('Invalid sources', 400);
    }

    const defaultPageSize = MAXIMUM_LOG_PAGE_SIZE;
    const pageSize = Number(queryStringParameters?.pageSize ?? defaultPageSize);
    if (isNaN(pageSize) || pageSize > MAXIMUM_LOG_PAGE_SIZE) {
      throw new RaitaLambdaError('Invalid pageSize', 400);
    }
    const pageIndex = Number(queryStringParameters.pageIndex);
    if (isNaN(pageIndex)) {
      throw new RaitaLambdaError('Invalid pageIndex', 400);
    }

    const logResult = await getSingleEventLogs(
      parsedDate,
      invocationId,
      parsedSources,
      pageSize,
      pageIndex,
    );
    return getRaitaSuccessResponse(logResult);
  } catch (err: any) {
    log.error(err);
    return getRaitaLambdaErrorResponse(err);
  }
}
