import { IMetadataStorageInterface } from '../types/portDataStorage';
import { FileMetadataEntry } from '../types';
import { RaitaOpenSearchClient } from '../clients/openSearchClient';
import { OpenSearchRepository } from '../adapters/openSearchRepository';

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
        });
      },
    };
    this.#backend = backends[backend]();
  }

  saveFileMetadata = (data: FileMetadataEntry[]) => {
    return this.#backend.saveFileMetadata(data);
  };

  // NOTE: This is OpenSearchSpecific initial implementation that is coupled with using
  // OpenSearch as the underlying database. To replace with database agnostic methods(s).
  // TODO: Provide best possible types
  queryOpenSearchMetadata = (query: any) => {
    return this.#backend.queryOpenSearchMetadata(query);
  };
}
