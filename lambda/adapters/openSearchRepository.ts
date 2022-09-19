import { FileMetadataEntry } from '../types';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import createAwsOpensearchConnector from 'aws-opensearch-connector';
import { Client } from '@opensearch-project/opensearch';
import { IMetadataStorageInterface } from '../types/portDataStorage';
import { logger } from '../utils/logger';

/**
 * OPEN: This could be make into a singleton but is there point?
 */
export class OpenSearchRepository implements IMetadataStorageInterface {
  #client: Client;
  #dataIndex: string;
  #openSearchDomain: string;
  #region: string;

  constructor({
    dataIndex,
    openSearchDomain,
    region,
  }: {
    dataIndex: string;
    openSearchDomain: string;
    region: string;
  }) {
    this.#dataIndex = dataIndex;
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

  #getClient = async (): Promise<Client> => {
    return this.#client ?? (await this.#initClient());
  };

  saveFileMetadata = async (data: Array<FileMetadataEntry>) => {
    const client = await this.#getClient();
    // Add entries to the index.
    const addPromises = data.map(async entry => {
      const addDocresponse = client.index({
        index: this.#dataIndex,
        body: entry,
      });
      return addDocresponse;
    });
    await Promise.all(addPromises)
      .then(data => {
        logger.log(data);
      })
      .catch(err => {
        logger.log(err);
        throw err;
      });
  };
}
