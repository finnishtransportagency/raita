import getConfig from '../config';
import { RaitaOpenSearchClient } from '../clients/openSearchClient';
import { logger } from '../utils/logger';
import { CdkCustomResourceEvent } from 'aws-lambda';

// TODO: Add better typing
export async function sendOpenSearchAPIRequest(
  event: CdkCustomResourceEvent,
  _context: any,
) {
  const requestType = event.RequestType;
  if (requestType === 'Create' || requestType === 'Update') {
    const openSearchDomain = process.env['OPENSEARCH_DOMAIN_ENDPOINT'];
    const region = process.env['REGION'];
    if (!openSearchDomain || !region) {
      throw new Error(
        `Missing env values, domain ${openSearchDomain}, region: ${region}`,
      );
    }
    const client = await new RaitaOpenSearchClient({
      openSearchDomain,
      region,
    }).getClient();
    const requestResponses = event.ResourceProperties.requests.map(
      async (request: any) => {
        logger.log({ request });
        const { body, method, path } = request;
        return client.transport.request({
          method,
          path,
          body,
        });
      },
    );
    await Promise.all(requestResponses)
      .then(() => {
        logger.log('All OpenSearch API requests processed.');
      })
      .catch(err => {
        logger.log(err);
        throw new Error(
          'An OpenSearch API request failed, see logs for details.',
        );
      });
  }
}
