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
export async function handleParametersRequest(
  event: ALBEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    const user = await getUser(event);
    await validateReadUser(user);

    const parameters = {
      AMS: [
        {
          oikea_pystysuuntainen_kiihtyvyys_c1: { type: 'long' },
        },
        {
          vasen_pystysuuntainen_kiihtyvyys_c1: { type: 'long' },
        },
      ],
    };
    return getRaitaSuccessResponse({ parameters });
  } catch (err: any) {
    log.error(err);
    return getRaitaLambdaErrorResponse(err);
  }
}

/*


 */
