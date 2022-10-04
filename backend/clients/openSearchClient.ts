import { FileMetadataEntry } from '../types';
import { Client } from '@opensearch-project/opensearch';
import { IMetadataStorageInterface } from '../types/portDataStorage';
import { logger } from '../utils/logger';
import { RaitaOpenSearchClient } from '../clients/openSearchClient';

/**
 * OPEN: This could be make into a singleton but is there point?
 */
export class OpenSearchRepository implements IMetadataStorageInterface {
  #dataIndex: string;
  #openSearchClient: RaitaOpenSearchClient;

  constructor({
    dataIndex,
    openSearchClient,
  }: {
    dataIndex: string;
    openSearchClient: RaitaOpenSearchClient;
  }) {
    this.#dataIndex = dataIndex;
    this.#openSearchClient = openSearchClient;
  }

  saveFileMetadata = async (data: Array<FileMetadataEntry>) => {
    const client = await this.#openSearchClient.getClient();
    // Add entries to the index.
    const additions = data.map(async entry => {
      const addDocresponse = client.index({
        index: this.#dataIndex,
        body: entry,
      });
      return addDocresponse;
    });
    await Promise.all(additions)
      .then(data => {
        logger.log(data);
      })
      .catch(err => {
        logger.log(err);
        throw err;
      });
  };
}
