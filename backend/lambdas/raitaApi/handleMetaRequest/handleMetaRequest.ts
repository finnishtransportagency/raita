import { ALBEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import MetadataPort from '../../../ports/metadataPort';
import { log } from '../../../utils/logger';
import { getUser, validateReadUser } from '../../../utils/userService';
import {
  getOpenSearchLambdaConfigOrFail,
  getRaitaLambdaErrorResponse,
  getRaitaSuccessResponse,
} from '../../utils';

/**
 * Returns meta information about inspection report (meta) data stored in Raita database
 */
export async function handleMetaRequest(
  event: ALBEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> {
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
    const [fields, aggregations] = await Promise.all([
      metadataPort.getMetadataFields(),
      metadataPort.getMetadataAggregations(),
      metadataPort.getLatestEntryData(),
    ]);
    log.info('Got metadata');
    log.info(fields);
    log.info(aggregations);
    return getRaitaSuccessResponse({
      fields,
      ...aggregations,
    });
  } catch (err: unknown) {
    log.error(err);
    return getRaitaLambdaErrorResponse(err);
  }
}
