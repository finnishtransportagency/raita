import { FileMetadataEntry } from '../../types';
import { Client } from '@opensearch-project/opensearch';
import { IMetadataStorageInterface } from '../../types/portDataStorage';
import { RaitaOpenSearchClient } from '../../clients/openSearchClient';
import { OpenSearchResponseParser } from './openSearchResponseParser';
import { log } from '../../utils/logger';
import { wrapRetryOnTooManyRequests } from './util';
import { compareVersionStrings } from '../../utils/compareVersionStrings';

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

  searchExisting = async (client: Client, entry: FileMetadataEntry) => {
    const existing = await client.search({
      index: this.#dataIndex,
      body: {
        query: {
          bool: {
            must: [
              {
                match: {
                  'file_name.keyword': entry.file_name,
                },
              },
              {
                match: {
                  'key.keyword': entry.key,
                },
              },
            ],
          },
        },
      },
    });
    return existing.body.hits;
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
    // TODO: define these in config
    const initialRetryWait = 2000;
    const maxRetryWait = 8001;

    const client = await this.#openSearchClient.getClient();
    const { key, hash } = entry;
    let exists;
    try {
      exists = await wrapRetryOnTooManyRequests(
        () => this.searchExisting(client, entry),
        initialRetryWait,
        maxRetryWait,
      );
    } catch (error) {
      log.error({
        message:
          'Error while searching for existing doc, Index creation will be attempted',
        errorObject: error,
      });
      exists = null;
    }
    const skipHashCheck = entry.options.skip_hash_check;
    // Double check, as opensearch can sometimes give "relevant" results even
    // if they are not complete matches. This way we can be sure to only
    // update documents that we are supposed to.
    const docToUpdate =
      exists && exists.hits.find((doc: any) => doc._source.key === key);
    if (!exists || !docToUpdate) {
      return await wrapRetryOnTooManyRequests(
        () => this.addDoc(client, entry),
        initialRetryWait,
        maxRetryWait,
      );
    }
    const hashMatch = hash === docToUpdate._source.hash;
    if (skipHashCheck || !hashMatch) {
      const requireNewerParserVersion =
        entry.options.require_newer_parser_version;
      if (requireNewerParserVersion) {
        const existingVersion = docToUpdate._source.metadata.parser_version;
        const newVersion = entry.metadata.parser_version;
        if (
          compareVersionStrings(newVersion as any as string, existingVersion) <=
          0
        ) {
          // new is smaller or equal => do nothing
          return;
        }
      }
      if (hashMatch) {
        // updating existing file: don't update parsed_at_datetime
        const oldParsedAt =
          docToUpdate._source.metadata.parsed_at_datetime || null;
        entry.metadata.parsed_at_datetime = oldParsedAt;
      }
      return await wrapRetryOnTooManyRequests(
        () => this.updateDoc(client, docToUpdate._id, entry),
        initialRetryWait,
        maxRetryWait,
      );
    }
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
          tilirataosanumerot: {
            terms: {
              field: 'metadata.tilirataosanumero.keyword',
              size: 1000,
            },
          },
        },
      },
    });
    return this.#responseParser.parseAggregations(response);
  };

  getLatestEntryData = async () => {
    const client = await this.#openSearchClient.getClient();
    const response = await client.search({
      index: this.#dataIndex,
      body: {
        aggs: {
          latest_inspection_date: {
            max: {
              field: 'metadata.inspection_date',
            },
          },
          //zip_reception__date on tekstikenttä joten siitä ei max-aggregaatio onnistu
          /* ,      "latest_zip_date": {
            max: {
              field: "metadata.zip_reception__date.keyword",
            }
          }*/
        },
      },
    });
    return this.#responseParser.parseLatestEntryAggregation(response);
  };

  deleteByKeyPrefix = async (prefix: string) => {
    const client = await this.#openSearchClient.getClient();
    const queryBody = {
      query: { prefix: { 'key.keyword': prefix } },
    };
    const response = await client.deleteByQuery({
      index: this.#dataIndex,
      body: queryBody,
    });
    return this.#responseParser.parseDeleteByKeyPrefix(response);
  };
}
