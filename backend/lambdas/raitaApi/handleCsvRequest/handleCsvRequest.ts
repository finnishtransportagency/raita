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

/**
 * TODO
 */
export async function handleCsvRequest(
  event: ALBEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    const user = await getUser(event);
    await validateReadUser(user);
    // TODO: Add better type check (zod) if endpoint is used permanently
    const queryObject = event.body && JSON.parse(event.body);
    // log.info(user, `Querying for ${queryObject.query}`);

    // query inputs
    // metadata location, time, other

    // inside data: more location? parameters

    // result: csv tiedosto?

    return getRaitaSuccessResponse({});
  } catch (err: any) {
    log.error(err);
    return getRaitaLambdaErrorResponse(err);
  }
}

/*


 */
