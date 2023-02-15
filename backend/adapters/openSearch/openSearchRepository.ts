import { FileMetadataEntry } from '../../types';
import { Client } from '@opensearch-project/opensearch';
import { IMetadataStorageInterface } from '../../types/portDataStorage';
import { RaitaOpenSearchClient } from '../../clients/openSearchClient';
import { OpenSearchResponseParser } from './openSearchResponseParser';
import { log } from '../../utils/logger';

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

  getExistingDoc = async (client: Client, key: string) => {
    try {
      const existingDoc = await client.search({
        index: this.#dataIndex,
        body: {
          query: {
            match: {
              key: {
                query: key,
              },
            },
          },
        },
      });
      // Opensearch query can return results that it thinks are relevant, but the one with the
      // most relevance score is the first on the list. Extra check for safety, to be sure that we actually
      // are handling the file that we queried for.
      return existingDoc.body.hits.total.value > 0 &&
        existingDoc.body.hits.hits[0].key === key
        ? existingDoc.body.hits.hits[0]
        : null;
    } catch (error) {
      log.error(
        `Error while searching for existing doc: ${error}, if no index yet, it will be created`,
      );
      return null;
    }
  };

  addDoc = async (client: Client, entry: FileMetadataEntry) => {
    return client.index({
      index: this.#dataIndex,
      body: entry,
    });
  };

  updateDoc = async (client: Client, id: string, entry: FileMetadataEntry) => {
    return client.update({
      index: this.#dataIndex,
      id,
      body: {
        doc: entry,
      },
    });
  };

  upsertDocument = async (entry: FileMetadataEntry) => {
    const client = await this.#openSearchClient.getClient();
    const { key, hash } = entry;
    const existingDoc = await this.getExistingDoc(client, key);
    if (!existingDoc) {
      return this.addDoc(client, entry);
    }
    return hash !== existingDoc._source.hash
      ? this.updateDoc(client, existingDoc._id, entry)
      : null;
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
