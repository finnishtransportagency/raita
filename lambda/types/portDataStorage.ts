import { FileMetadataEntry } from '.';

export interface IMetadataStorageInterface {
  saveFileMetadata: (data: Array<FileMetadataEntry>) => Promise<void>;
  saveMermecData: (indexName: string, data: Array<Object>) => Promise<void>;
}
