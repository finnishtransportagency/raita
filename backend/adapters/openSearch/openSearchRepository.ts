import { FileMetadataEntry } from '../../types';
import { Client } from '@opensearch-project/opensearch';
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

  getExistingDoc = async (client: Client, file_name: string) => {
    console.log(`Searching for existing doc with filename: ${file_name}`)
    const existingDoc = await client.search({
      index: this.#dataIndex,
      body: {
        query: {
          match: {
            file_name: {
              query: file_name,
            },
          },
        },
      },
    });

    console.log(`Existing doc: ${existingDoc}`)
    return existingDoc.body.hits.total > 0
      ? existingDoc.body.hits.hits[0]
      : undefined;
  };

  addDoc = async (client: Client, entry: FileMetadataEntry) => {
    console.log(`Adding doc: ${entry.file_name}`);
    return client.index({
      index: this.#dataIndex,
      body: entry,
    });
  };

  updateDoc = async (client: Client, id: string, entry: FileMetadataEntry) => {
    console.log(`Trying to update doc: ${id}`);
    return client.update({
      index: this.#dataIndex,
      id,
      body: entry,
    });
  };

  upsertDocument = async (entry: FileMetadataEntry) => {
    const client = await this.#openSearchClient.getClient();
    const { file_name, hash } = entry;

    const existingDoc = await this.getExistingDoc(client, file_name);

    if (!existingDoc) {
      console.log('Existing doc not found');
      return this.addDoc(client, entry);
    }
    console.log('Existing doc found');
    return hash !== existingDoc._source.hash
      ? this.updateDoc(client, existingDoc._id, entry)
      : Promise.resolve();
  };

  saveFileMetadata = async (data: Array<FileMetadataEntry>) => {
    const additions = data.map(async entry => {
      return this.upsertDocument(entry);
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
    return this.#responseParser.parseSearchResponse(response);
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
              size: 1000,
            },
          },
          file_types: {
            terms: {
              field: 'metadata.file_type.keyword',
              size: 1000,
            },
          },
          systems: {
            terms: {
              field: 'metadata.system.keyword',
              size: 1000,
            },
          },
          track_numbers: {
            terms: {
              field: 'metadata.track_number.keyword',
              size: 1000,
            },
          },
          track_parts: {
            terms: {
              field: 'metadata.track_part.keyword',
              size: 1000,
            },
          },
        },
      },
    });
    return this.#responseParser.parseAggregations(response);
  };
}
