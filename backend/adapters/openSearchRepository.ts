import { FileMetadataEntry } from '../types';
import { IMetadataStorageInterface } from '../types/portDataStorage';
import { RaitaOpenSearchClient } from '../clients/openSearchClient';

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
    await Promise.all(additions).catch(err => {
      throw err;
    });
  };

  // TODO: Provide best possible types
  queryOpenSearchMetadata = async (query: any) => {
    const client = await this.#openSearchClient.getClient();
    const response = await client.search({
      index: this.#dataIndex,
      body: query,
    });
    return response;
  };

  // TODO: Provide best possible types
  getMetadataFields = async () => {
    const client = await this.#openSearchClient.getClient();
    const response = await client.indices.getMapping({
      index: this.#dataIndex,
    });
    return response;
  };

  getReportTypes = async () => {
    const client = await this.#openSearchClient.getClient();
    const response = await client.search({
      index: this.#dataIndex,
      body: {
        size: 0,
        aggs: {
          report_types: {
            terms: {
              field: 'metadata.report_type.keyword',
            },
          },
          file_types: {
            terms: {
              field: 'metadata.file_type.keyword',
            },
          },
        },
      },
    });
    return response;
  };

  getFileTypes = async () => {
    const client = await this.#openSearchClient.getClient();
    const response = await client.search({
      index: this.#dataIndex,
      body: {
        size: 0,
        aggs: {
          report_types: {
            terms: {
              field: 'metadata.report_type.keyword',
            },
          },
          file_types: {
            terms: {
              field: 'metadata.file_type.keyword',
            },
          },
        },
      },
    });
    return response;
  };
}
