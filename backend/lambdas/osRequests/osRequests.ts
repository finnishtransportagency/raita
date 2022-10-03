import { RaitaOpenSearchClient } from '../../clients/openSearchClient';
import { logger } from '../../utils/logger';
import { CdkCustomResourceEvent } from 'aws-lambda';
import { z } from 'zod';

const SendOpenSearchAPIRequestConfig = z.object({
  openSearchDomain: z.string(),
  region: z.string(),
});

function getLambdaConfigOrFail() {
  const config = {
    openSearchDomain: process.env['OPENSEARCH_DOMAIN_ENDPOINT'],
    region: process.env['REGION'],
  };
  return SendOpenSearchAPIRequestConfig.parse(config);
}

// TODO: Add better typing
export async function sendOpenSearchAPIRequest(
  event: CdkCustomResourceEvent,
  _context: any,
) {
  const { openSearchDomain, region } = getLambdaConfigOrFail();
  const requestType = event.RequestType;
  if (requestType === 'Create' || requestType === 'Update') {
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
