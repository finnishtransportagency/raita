import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { S3 } from 'aws-sdk';
import { getEnvOrFail, getGetEnvWithPreassignedContext } from '../../../utils';
import MetadataPort from '../../ports/metadataPort';
import { logger } from '../../utils/logger';
import { RaitaLambdaException } from '../utils';

function getLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext('Metadata parser lambda');
  return {
    openSearchDomain: getEnv('OPENSEARCH_DOMAIN'),
    region: getEnv('REGION'),
    metadataIndex: getEnv('METADATA_INDEX'),
  };
}

/**
 * Returns OpenSearch data based on request query
 * Currently takes input in the POST request body
 * NOTE: Preliminary implementation
 */
export async function handleOpenSearchQuery(
  event: APIGatewayEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> {
  const { body } = event;
  try {
    const { openSearchDomain, region, metadataIndex } = getLambdaConfigOrFail();
    const requestBody = body && JSON.parse(body);
    console.log(event);
    console.log(`this is the event ${event}`);
    console.log(`this is the event body ${event.body}`);
    if (!requestBody?.query) {
      logger.log(body);
      throw new Error('No query in the request.');
    }

    const metadata = new MetadataPort({
      backend: 'openSearch',
      metadataIndex,
      region,
      openSearchDomain,
    });

    const result = await metadata.queryOpenSearchMetadata(requestBody);

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
    const errorMessage =
      ((err instanceof Error || err instanceof RaitaLambdaException) &&
        err.message) ||
      (typeof err === 'string' && err) ||
      'An error occurred.';
    return {
      statusCode:
        (err instanceof RaitaLambdaException && err.statusCode) || 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: errorMessage }, null, 2),
    };
  }
}
