import { Readable } from 'stream';

export * from './specification';
export * from './portFile';
export * from './portSpecification';

export type ParseValueResult = Record<string, string | number | boolean | null>;

export interface FileMetadataEntry {
  file_name: string;
  key: string;
  size: number;
  bucket_name: string;
  bucket_arn: string;
  metadata: ParseValueResult;
  hash: string;
  reportId?: number | undefined;
  errors: boolean;
  options: {
    skip_hash_check?: boolean;
    require_newer_parser_version?: boolean;
  };
}
export type S3CustomMetadataFields = {
  'skip-hash-check'?: '1' | '0';
  'require-newer-parser-version'?: '1' | '0';
  'invocation-id'?: string;
  'skip-geoviite-conversion'?: '1' | '0'; // only matters for csv files
};
export interface IFileResult {
  fileBody: string | undefined;
  contentType: string | undefined;
  tags: Record<string, string>;
}
export interface IFileStreamResult {
  fileStream: Readable | undefined;
  contentType: string | undefined;
  tags: Record<string, string>;
  metaData: S3CustomMetadataFields;
}
