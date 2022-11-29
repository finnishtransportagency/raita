import { FileMetadataEntry } from '.';

export interface IMetadataStorageInterface {
  saveFileMetadata: (data: Array<FileMetadataEntry>) => Promise<void>;
  queryOpenSearchMetadata: (query: any) => Promise<any>;
  getMetadataFields: () => Promise<Array<Record<string, { type: string }>>>;
  getMetadataAggregations: () => Promise<{
    reportTypes: Array<{ reportType: string; count: number }>;
    fileTypes: Array<{ fileType: string; count: number }>;
    systems: Array<{ value: string; count: number }>;
    trackNumbers: Array<{ value: string; count: number }>;
    trackParts: Array<{ value: string; count: number }>;
  }>;
}
