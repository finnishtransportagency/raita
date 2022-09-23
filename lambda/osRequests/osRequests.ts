import getConfig from '../config';
import { RaitaOpenSearchClient } from '../clients/openSearchClient';
import { logger } from '../utils/logger';
import { CdkCustomResourceEvent } from 'aws-lambda';

// TODO: Add better typing
export async function sendOpenSearchAPIRequest(
  event: CdkCustomResourceEvent,
  _context: any,
) {
  logger.log(event);
  const requestType = event.RequestType;
  if (requestType === 'Create' || requestType === 'Update') {
    const config = getConfig();
    const client = await new RaitaOpenSearchClient({
      openSearchDomain: config.openSearchDomain,
      region: config.region,
    }).getClient();
    logger.log('got client');
    const requestResponses = event.ResourceProperties.requests.map(
      async (request: any) => {
        logger.log({ request });
        const { body, method, path } = request;
        return client.transport.request({
          method,
          path,
          body,
        });
        // .then(res => console.log(res));
        // logger.log(res);
        // logger.log('heps');
        // return res;
      },
    );
    await Promise.all(requestResponses)
      .then(() => {
        logger.log('All OpenSearch API requests processed.');
      })
      .catch(err => {
        logger.log(err);
        console.log(err);
        throw new Error(
          'An OpenSearch API request failed, see logs for details.',
        );
      });
  }
}
