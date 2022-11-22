import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import MetadataPort from '../../../ports/metadataPort';
import { logger } from '../../../utils/logger';
import {
  getOpenSearchLambdaConfigOrFail,
  getRaitaLambdaError,
} from '../../utils';

/**
 * Returns meta information about inspection report (meta) data stored in Raita database
 */
export async function handleMetaRequest(
  event: APIGatewayEvent,
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
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields,
        ...aggregations,
      }),
    };
  } catch (err: unknown) {
    logger.logError(err);
    return getRaitaLambdaError(err);
  }
}
