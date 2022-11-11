export * from './specification';
export * from './portDataStorage';
export * from './portFile';
export * from './portSpecification';

export type ParseValueResult = Record<string, string | number | boolean>;

export interface FileMetadataEntry {
  file_name: string;
  key: string;
  size: number;
  bucket_name: string;
  bucket_arn: string;
  metadata: ParseValueResult;
  hash: string | undefined;
}

export interface IFileResult {
  fileBody: string | undefined;
  contentType: string | undefined;
}
