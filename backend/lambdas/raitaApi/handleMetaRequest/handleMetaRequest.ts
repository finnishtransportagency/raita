import { ALBEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import MetadataPort from '../../../ports/metadataPort';
import { log } from '../../../utils/logger';
import { getUser, validateReadUser } from '../../../utils/userService';
import {
  getOpenSearchLambdaConfigOrFail,
  getRaitaLambdaErrorResponse,
  getRaitaSuccessResponse,
} from '../../utils';
import { lambdaRequestTracker } from 'pino-lambda';

const withRequest = lambdaRequestTracker();

/**
 * Returns meta information about inspection report (meta) data stored in Raita database
 */
export async function handleMetaRequest(
  event: ALBEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> {
  withRequest(event, _context);
  try {
    const user = await getUser(event);
    await validateReadUser(user);
    log.info(user, 'Return meta information');
    const { openSearchDomain, region, metadataIndex } =
      getOpenSearchLambdaConfigOrFail();
    const metadataPort = new MetadataPort({
      backend: 'openSearch',
      metadataIndex,
      region,
      openSearchDomain,
    });
    const [fields, aggregations, latestEntryData] = await Promise.all([
      metadataPort.getMetadataFields(),
      metadataPort.getMetadataAggregations(),
      metadataPort.getLatestEntryData(),
    ]);
    return getRaitaSuccessResponse({
      fields,
      ...aggregations,
      ...latestEntryData,
    });
  } catch (err: any) {
    log.error(err);
    return getRaitaLambdaErrorResponse(err);
  }
}
