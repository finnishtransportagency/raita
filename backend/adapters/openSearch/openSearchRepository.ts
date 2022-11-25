import { FileMetadataEntry } from '../../types';
import { IMetadataStorageInterface } from '../../types/portDataStorage';
import { RaitaOpenSearchClient } from '../../clients/openSearchClient';
import { OpenSearchResponseParser } from './openSearchResponseParser';

export class OpenSearchRepository implements IMetadataStorageInterface {
  #dataIndex: string;
  #openSearchClient: RaitaOpenSearchClient;
  #responseParser: OpenSearchResponseParser;

  constructor({
    dataIndex,
    openSearchClient,
    responseParser,
  }: {
    dataIndex: string;
    openSearchClient: RaitaOpenSearchClient;
    responseParser: OpenSearchResponseParser;
  }) {
    this.#dataIndex = dataIndex;
    this.#openSearchClient = openSearchClient;
    this.#responseParser = responseParser;
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

  getMetadataFields = async () => {
    const client = await this.#openSearchClient.getClient();
    const response = await client.indices.getMapping({
      index: this.#dataIndex,
    });
    return this.#responseParser.parseMetadataFields(response, this.#dataIndex);
  };

  getMetadataAggregations = async () => {
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
          systems: {
            terms: {
              field: 'metadata.system.keyword',
            },
          },
          track_numbers: {
            terms: {
              field: 'metadata.track_number.keyword',
            },
          },
          track_parts: {
            terms: {
              field: 'metadata.track_part.keyword',
            },
          },
        },
      },
    });
    return this.#responseParser.parseAggregations(response);
  };
}
