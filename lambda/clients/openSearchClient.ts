import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { Client } from '@opensearch-project/opensearch';
import createAwsOpensearchConnector from 'aws-opensearch-connector';

export class RaitaOpenSearchClient {
  #client: Client;
  #openSearchDomain: string;
  #region: string;

  constructor({
    openSearchDomain,
    region,
  }: {
    openSearchDomain: string;
    region: string;
  }) {
    this.#openSearchDomain = openSearchDomain;
    this.#region = region;
  }

  #initClient = async () => {
    // TODO: Figure out defaultProvider usage
    const awsCredentials = await defaultProvider()();
    const connector = createAwsOpensearchConnector({
      credentials: awsCredentials,
      region: this.#region,
      getCredentials: function (cb: () => void) {
        return cb();
      },
    });
    const client = new Client({
      ...connector,
      node: `https://${this.#openSearchDomain}`,
    });
    this.#client = client;
    return this.#client;
  };

  public getClient = async (): Promise<Client> => {
    return this.#client ?? (await this.#initClient());
  };
}
