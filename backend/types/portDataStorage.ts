import { FileMetadataEntry } from '.';

export interface IMetadataStorageInterface {
  saveFileMetadata: (data: Array<FileMetadataEntry>) => Promise<void>;
  queryOpenSearchMetadata: (query: any) => Promise<{
    total: number;
    totalSize: number;
    keys: string[];
    hits: Array<{
      score: number | undefined;
      source: {
        key: string;
        file_name: string;
        size: number;
        metadata: Record<string, any>;
      };
    }>;
  }>;
  getMetadataFields: () => Promise<Array<Record<string, { type: string }>>>;
  getMetadataAggregations: () => Promise<{
    reportTypes: Array<{ reportType: string; count: number }>;
    fileTypes: Array<{ fileType: string; count: number }>;
    systems: Array<{ value: string; count: number }>;
    trackNumbers: Array<{ value: string; count: number }>;
    trackParts: Array<{ value: string; count: number }>;
    tilirataosanumerot: Array<{ value: string; count: number }>;
  }>;
  getLatestEntryData: () => Promise<any>;
}
