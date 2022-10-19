import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import MetadataPort from '../../ports/metadataPort';
import { logger } from '../../utils/logger';
import {
  getOpenSearchLambdaConfigOrFail,
  getRaitaLambdaError,
  RaitaLambdaError,
} from '../utils';

/**
 * DRAFT IMPLEMENTATION
 * Returns OpenSearch data based on request query. Currently takes input in the POST request body.
 */
export async function handleOpenSearchQuery(
  event: APIGatewayEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    const { openSearchDomain, region, metadataIndex } =
      getOpenSearchLambdaConfigOrFail();
    // TODO: Add better type check (zod) if endpoint is used permanently
    const queryObject = event.body && JSON.parse(event.body);
    if (!queryObject) {
      throw new RaitaLambdaError('Request does not contain query data.', 400);
    }
    if (!queryObject.query) {
      throw new RaitaLambdaError(
        'Request does not contain required query property.',
        400,
      );
    }
    const metadata = new MetadataPort({
      backend: 'openSearch',
      metadataIndex,
      region,
      openSearchDomain,
    });
    const result = await metadata.queryOpenSearchMetadata(queryObject);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        {
          result,
        },
        null,
        2,
      ),
    };
  } catch (err: unknown) {
    logger.logError(err);
    return getRaitaLambdaError(err);
  }
}
