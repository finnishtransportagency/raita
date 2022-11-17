import { FileMetadataEntry } from '.';

export interface IMetadataStorageInterface {
  saveFileMetadata: (data: Array<FileMetadataEntry>) => Promise<void>;
  queryOpenSearchMetadata: (query: any) => Promise<any>;
  getMetadataFields: () => Promise<any>;
  getReportTypes: () => Promise<any>;
  getFileTypes: () => Promise<any>;
}
