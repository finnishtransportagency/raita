export * from './specification';
export * from './portDataStorage';
export * from './portFile';
export * from './portSpecification';

export type ParseValueResult = Record<string, string | number | boolean>;

export interface FileMetadataEntry {
  fileName: string;
  bucket: string;
  arn: string;
  metadata: ParseValueResult;
}

export interface IFileResult {
  fileBody: string | undefined;
  contentType: string | undefined;
}
