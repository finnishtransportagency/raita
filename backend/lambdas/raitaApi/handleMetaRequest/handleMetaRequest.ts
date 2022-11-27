import { ALBEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import MetadataPort from '../../../ports/metadataPort';
import { logger } from '../../../utils/logger';
import {
  getOpenSearchLambdaConfigOrFail,
  getRaitaLambdaErrorResponse,
  getRaitaSuccessResponse,
} from '../../utils';

/**
 * Returns meta information about inspection report (meta) data stored in Raita database
 */
export async function handleMetaRequest(
  _event: ALBEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> {
  try {
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
    ]);
    return getRaitaSuccessResponse({
      fields,
      ...aggregations,
    });
  } catch (err: unknown) {
    logger.logError(err);
    return getRaitaLambdaErrorResponse(err);
  }
}
