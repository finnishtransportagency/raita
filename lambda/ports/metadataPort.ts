import { IMetadataStorageInterface } from '../types/portDataStorage';
import { FileMetadataEntry } from '../types';
import getConfig from '../config';
import { RaitaOpenSearchClient } from '../clients/openSearchClient';
import { OpenSearchRepository } from '../adapters/openSearchRepository';

export type IStorageBackend = 'openSearch';

export default class MetadataPort implements IMetadataStorageInterface {
  #backend: IMetadataStorageInterface;

  constructor({ storageBackend }: { storageBackend: IStorageBackend }) {
    const config = getConfig();
    const backends: Record<IStorageBackend, () => IMetadataStorageInterface> = {
      // OPEN: Figure out if better way of accessing the region would be Stack.of(this).region approach
      openSearch: () => {
        return new OpenSearchRepository({
          dataIndex: config.openSearchMetadataIndex,
          openSearchClient: new RaitaOpenSearchClient({
            region: config.region,
            openSearchDomain: config.openSearchDomainName,
          }),
        });
      },
    };
    this.#backend = backends[storageBackend]();
  }

  saveFileMetadata = (data: FileMetadataEntry[]) => {
    return this.#backend.saveFileMetadata(data);
  };
}
