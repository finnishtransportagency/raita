import { ALBEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { getGetEnvWithPreassignedContext } from '../../../../utils';
import MetadataPort from '../../../ports/metadataPort';
import { log } from '../../../utils/logger';
import { getUser, validateReadUser } from '../../../utils/userService';
import {
  getRaitaLambdaErrorResponse,
  getRaitaSuccessResponse,
  RaitaLambdaError,
} from '../../utils';

function getOpenSearchLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext('Metadata parser lambda');
  return {
    openSearchDomain: getEnv('OPENSEARCH_DOMAIN'),
    region: getEnv('REGION'),
    metadataIndex: getEnv('METADATA_INDEX'),
  };
}

/**
 * Returns OpenSearch data based on request query.
 * Receives parameters in POST request body.
 */
export async function handleFilesRequest(
  event: ALBEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    const user = await getUser(event);
    await validateReadUser(user);
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
    log.info(user, `Querying for ${queryObject.query}`);
    const metadata = new MetadataPort({
      backend: 'openSearch',
      metadataIndex,
      region,
      openSearchDomain,
    });
    const result = await metadata.queryOpenSearchMetadata(queryObject);
    return getRaitaSuccessResponse({ ...result });
  } catch (err: any) {
    log.error(err);
    return getRaitaLambdaErrorResponse(err);
  }
}
