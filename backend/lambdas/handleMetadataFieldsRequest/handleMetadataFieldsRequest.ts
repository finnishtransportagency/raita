import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import MetadataPort from '../../ports/metadataPort';
import { logger } from '../../utils/logger';
import { getRaitaLambdaError } from '../utils';

/**
 * DRAFT IMPLEMENTATION
 * Returns meta data fields that are available in the data base
 */
export async function handleMetadataFieldsRequest(
  event: APIGatewayEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    const { openSearchDomain, region, metadataIndex } =
      getOpenSearchLambdaConfigOrFail();
    const metadata = new MetadataPort({
      backend: 'openSearch',
      metadataIndex,
      region,
      openSearchDomain,
    });
    const result = await metadata.getMetadataIndexFields();
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
function getOpenSearchLambdaConfigOrFail(): {
  openSearchDomain: any;
  region: any;
  metadataIndex: any;
} {
  throw new Error('Function not implemented.');
}
