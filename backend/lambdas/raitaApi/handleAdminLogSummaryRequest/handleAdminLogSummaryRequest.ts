import { ALBEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { log } from '../../../utils/logger';
import { getUser, validateAdminUser } from '../../../utils/userService';
import {
  getRaitaLambdaErrorResponse,
  getRaitaSuccessResponse,
  RaitaLambdaError,
} from '../../utils';
import { getLogSummary } from '../../../utils/adminLog/pgLogReader';
import { format } from 'date-fns';
import { parseISO } from 'date-fns';
import { AdminLogSource } from '../../../utils/adminLog/types';
import { lambdaRequestTracker } from 'pino-lambda';

const MAXIMUM_SUMMARY_PAGE_SIZE = 200;

const withRequest = lambdaRequestTracker();

/**
 * Handle request to view admin log summary
 */
export async function handleAdminLogSummaryRequest(
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
      !queryStringParameters?.startDate ||
      !queryStringParameters?.endDate ||
      !queryStringParameters?.sources ||
      !queryStringParameters?.pageIndex
    ) {
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
    const startTimestamp = `${format(parsedStartDate, 'yyyy-MM-dd')}T00:00:00Z`;
    const endTimestamp = `${format(parsedEndDate, 'yyyy-MM-dd')}T23:59:59Z`;

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

    const defaultPageSize = MAXIMUM_SUMMARY_PAGE_SIZE;
    const pageSize = Number(queryStringParameters?.pageSize ?? defaultPageSize);
    if (isNaN(pageSize) || pageSize > MAXIMUM_SUMMARY_PAGE_SIZE) {
      throw new RaitaLambdaError('Invalid pageSize', 400);
    }
    const pageIndex = Number(queryStringParameters.pageIndex);
    if (isNaN(pageIndex)) {
      throw new RaitaLambdaError('Invalid pageIndex', 400);
    }
    const logResult = await getLogSummary(
      startTimestamp,
      endTimestamp,
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
