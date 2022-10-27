import { FileMetadataEntry } from '../types';
import { IMetadataStorageInterface } from '../types/portDataStorage';
import { RaitaOpenSearchClient } from '../clients/openSearchClient';

/**
 * OPEN: This could be make into a singleton but is is worth it?
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
    console.log('Persisting data to store');
    const additions = data.map(async entry => {
      const addDocresponse = client.index({
        index: this.#dataIndex,
        body: entry,
      });
      return addDocresponse;
    });
    await Promise.all(additions)
      .then(() => {
        console.log('Data persisted to open search.');
      })
      .catch(err => {
        throw err;
      });
  };

  // TODO: Provide best possible types
  queryOpenSearchMetadata = async (query: any) => {
    const client = await this.#openSearchClient.getClient();
    console.log('Starting os query.');
    const response = await client.search({
      index: this.#dataIndex,
      body: query,
    });
    console.log('Data queried from open search.');
    return response;
  };
}
