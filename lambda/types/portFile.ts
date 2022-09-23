import { S3EventRecord } from 'aws-lambda';
import { IFileResult } from './index';

export interface IFileInterface {
  getFile: (eventRecord: S3EventRecord) => Promise<IFileResult>;
}

// export interface IFilePortInterface {
//   getFile: () => Promise<{ fileBody: string; contentType: string }>;
// }
