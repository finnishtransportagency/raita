import { ALBEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { randomUUID } from 'crypto';
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
import { uploadProgressData } from '../fileGeneration/utils';
import { InitialProgressData } from '../fileGeneration/constants';
import { S3Client } from '@aws-sdk/client-s3';
import { tz } from '@date-fns/tz';
import { DATA_TIME_ZONE } from '../../../../constants';

const withRequest = lambdaRequestTracker();

function getLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext('handleAdminLogExportRequest');
  return {
    generateExportFunction: getEnv('GENERATE_EXPORT_FUNCTION'),
    region: getEnv('REGION'),
    dataCollectionBucket: getEnv('DATA_COLLECTION_BUCKET'),
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
  const { body } = event;
  try {
    const user = await getUser(event);
    log.info({ user });
    await validateAdminUser(user);
    const { generateExportFunction, region, dataCollectionBucket } =
      getLambdaConfigOrFail();

    const parsedBody: {
      startDate: string;
      endDate: string;
      sources: string;
    } = JSON.parse(body ?? '{}');
    if (!parsedBody.startDate || !parsedBody.endDate || !parsedBody.sources) {
      throw new RaitaLambdaError(
        'startDate and endDate must be specified',
        400,
      );
    }
    // validate
    const parsedStartDate = parseISO(parsedBody?.startDate);
    if (isNaN(parsedStartDate.getTime())) {
      throw new RaitaLambdaError('Invalid startDate', 400);
    }
    const parsedEndDate = parseISO(parsedBody?.endDate);
    if (isNaN(parsedEndDate.getTime())) {
      throw new RaitaLambdaError('Invalid endDate', 400);
    }
    const startTimestamp = `${format(parsedStartDate, 'yyyy-MM-dd')}T00:00:00Z`;
    const endTimestamp = `${format(parsedEndDate, 'yyyy-MM-dd')}T23:59:59Z`;

    const sources = parsedBody.sources;
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
      { in: tz(DATA_TIME_ZONE) },
    )}`;
    const uuid = randomUUID();
    const pollingKey = `progress/${uuid}.json`;
    const resultFileKey = `admin/log/${uuid}/${fileBaseName}.csv`;
    const exportEvent: AdminLogExportEvent = {
      startTime: startTimestamp,
      endTime: endTimestamp,
      sources: parsedSources,
      progressKey: pollingKey,
      resultFileKey,
    };
    const payloadJson = JSON.stringify(exportEvent);
    const payload = new TextEncoder().encode(payloadJson);

    const s3Client = new S3Client({});

    const lambdaClient = new LambdaClient({ region });

    // TODO: should there be a check here to see if data exists?

    // upload indication of started process to data collection bucket
    await uploadProgressData(
      InitialProgressData,
      dataCollectionBucket,
      pollingKey,
      s3Client,
    );

    const command = new InvokeCommand({
      FunctionName: generateExportFunction,
      Payload: payload,
      InvocationType: 'Event',
    });
    await lambdaClient.send(command);

    return getRaitaSuccessResponse({
      polling_key: pollingKey,
    });
  } catch (err: any) {
    log.error(err);
    return getRaitaLambdaErrorResponse(err);
  }
}
