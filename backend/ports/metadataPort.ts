import { IMetadataStorageInterface } from '../types/portDataStorage';
import { FileMetadataEntry } from '../types';
import { RaitaOpenSearchClient } from '../clients/openSearchClient';
import { OpenSearchRepository } from '../adapters/openSearch/openSearchRepository';
import { OpenSearchResponseParser } from '../adapters/openSearch/openSearchResponseParser';

export type IStorageBackend = {
  backend: 'openSearch';
  metadataIndex: string;
  region: string;
  openSearchDomain: string;
};

export default class MetadataPort implements IMetadataStorageInterface {
  #backend: IMetadataStorageInterface;

  constructor({
    backend,
    metadataIndex,
    region,
    openSearchDomain,
  }: IStorageBackend) {
    const backends: Record<
      IStorageBackend['backend'],
      () => IMetadataStorageInterface
    > = {
      openSearch: () => {
        return new OpenSearchRepository({
          dataIndex: metadataIndex,
          openSearchClient: new RaitaOpenSearchClient({
            region: region,
            openSearchDomain: openSearchDomain,
          }),
          responseParser: new OpenSearchResponseParser(),
        });
      },
    };
    this.#backend = backends[backend]();
  }

  saveFileMetadata = (data: FileMetadataEntry[]) => {
    return this.#backend.saveFileMetadata(data);
  };

  // NOTE: This is OpenSearchSpecific initial implementation that is coupled with using
  // OpenSearch as the underlying database. To replace with database agnostic method(s).
  // TODO: Provide best possible types
  queryOpenSearchMetadata = (query: any) => {
    return this.#backend.queryOpenSearchMetadata(query);
  };
  deleteByKeyPrefix = (prefix: string) => {
    return this.#backend.deleteByKeyPrefix(prefix);
  };
  getMetadataFields = () => {
    return this.#backend.getMetadataFields();
  };
  getMetadataAggregations = () => {
    return this.#backend.getMetadataAggregations();
  };

  getLatestEntryData = () => {
    return this.#backend.getLatestEntryData();
  };
}
