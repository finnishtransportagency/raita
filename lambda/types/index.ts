import { S3 } from 'aws-sdk';

export * from './specification';
export * from './portDataStorage';
export * from './portFile';
export * from './portSpecification';

export type ParseValueResult = Record<string, string | number>;

export interface FileMetadataEntry {
  fileName: string;
  bucket: string;
  arn: string;
  metadata: ParseValueResult;
}

export interface IFileResult {
  body: S3.Body | undefined;
  fileBody: string | undefined;
  contentType: string | undefined;
}
