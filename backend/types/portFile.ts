import { S3EventRecord } from 'aws-lambda';
import { IFileResult, IFileStreamResult } from './index';

export interface IFileInterface {
  getFile: (
    eventRecord: S3EventRecord,
    includeTags: boolean,
  ) => Promise<IFileResult>;
  getFileStream: (
    eventRecord: S3EventRecord,
    includeTags: boolean,
  ) => Promise<IFileStreamResult>;
}
