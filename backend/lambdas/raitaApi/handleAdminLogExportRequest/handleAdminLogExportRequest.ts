import { ALBEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { log } from '../../../utils/logger';
import { getUser, validateAdminUser } from '../../../utils/userService';
import {
  getRaitaLambdaErrorResponse,
  getRaitaSuccessResponse,
  RaitaLambdaError,
} from '../../utils';
import { format } from 'date-fns';
import { parseISO } from 'date-fns';
import { AdminLogSource } from '../../../utils/adminLog/types';
import { lambdaRequestTracker } from 'pino-lambda';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { AdminLogExportEvent } from '../fileGeneration/types';
import { getGetEnvWithPreassignedContext } from '../../../../utils';

const withRequest = lambdaRequestTracker();

function getLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext(
    'handleAdminLogExportGeneration',
  );
  return {
    generateExportFunction: getEnv('GENERATE_EXPORT_FUNCTION'),
    region: getEnv('REGION'),
  };
}

/**
 * Handle request to view admin log summary
 */
export async function handleAdminLogExportRequest(
  event: ALBEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> {
  withRequest(event, _context);
  const { queryStringParameters } = event;
  try {
    const user = await getUser(event);
    log.info({ user, queryStringParameters });
    await validateAdminUser(user);
    const { generateExportFunction, region } = getLambdaConfigOrFail();

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

    const now = new Date();
    const fileBaseName = `RAITA-admin-log-export-${format(
      now,
      'dd.MM.yyyy-HH-mm',
    )}`;
    const progressKey = `csv/progress/${fileBaseName}.json`;
    // TODO: admin log export in separate bucket?
    const resultFileKey = `admin/log/export/${fileBaseName}.csv`;
    const exportEvent: AdminLogExportEvent = {
      startTime: startTimestamp,
      endTime: endTimestamp,
      sources: parsedSources,
      progressKey,
      resultFileKey,
    };
    const payloadJson = JSON.stringify(exportEvent);
    const payload = new TextEncoder().encode(payloadJson);

    const lambdaClient = new LambdaClient({ region });

    // TODO: should there be a check here to see if data exists?

    const command = new InvokeCommand({
      FunctionName: generateExportFunction,
      Payload: payload,
      InvocationType: 'Event',
    });
    await lambdaClient.send(command);

    return getRaitaSuccessResponse({
      polling_key: progressKey,
    });
  } catch (err: any) {
    log.error(err);
    return getRaitaLambdaErrorResponse(err);
  }
}
