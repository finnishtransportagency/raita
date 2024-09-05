import { S3EventRecord } from 'aws-lambda';
import { IFileResult, IFileStreamResult } from './index';

export interface IFileInterface {
  getFileStream: (eventRecord: S3EventRecord) => Promise<IFileStreamResult>;
}
