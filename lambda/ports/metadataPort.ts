import { IMetadataStorageInterface } from '../types/portDataStorage';
import { FileMetadataEntry } from '../types';
import { RaitaOpenSearchClient } from '../clients/openSearchClient';
import { OpenSearchRepository } from '../adapters/openSearchRepository';

export type IStorageBackend = 'openSearch';

export default class MetadataPort implements IMetadataStorageInterface {
  #backend: IMetadataStorageInterface;

  constructor({ storageBackend }: { storageBackend: IStorageBackend }) {
    const openSearchDomain = process.env['OPENSEARCH_DOMAIN'];
    const region = process.env['REGION'];
    const metadataIndex = process.env['METADATA_INDEX'];
    if (!openSearchDomain || !region || !metadataIndex) {
      throw new Error(
        `Missing env values, domain ${openSearchDomain}, region: ${region}, metadata index: ${metadataIndex}`,
      );
    }
    const backends: Record<IStorageBackend, () => IMetadataStorageInterface> = {
      // OPEN: Figure out if better way of accessing the region would be Stack.of(this).region approach
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
    this.#backend = backends[storageBackend]();
  }

  saveFileMetadata = (data: FileMetadataEntry[]) => {
    return this.#backend.saveFileMetadata(data);
  };
}
