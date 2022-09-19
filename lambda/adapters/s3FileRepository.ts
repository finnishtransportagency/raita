import { S3EventRecord } from 'aws-lambda';
import { S3 } from 'aws-sdk';
import { IFileResult } from '../types';
import { IFileInterface } from '../types/portFile';

export class S3FileRepository implements IFileInterface {
  #s3: S3;

  constructor() {
    this.#s3 = new S3();
  }

  getFile = async (eventRecord: S3EventRecord): Promise<IFileResult> => {
    const bucket = eventRecord.s3.bucket.name;
    const key = decodeURIComponent(
      eventRecord.s3.object.key.replace(/\+/g, ' '),
    );
    const file = await this.#s3
      .getObject({
        Bucket: bucket,
        Key: key,
      })
      .promise();
    return {
      fileBody: file.Body?.toString(),
      contentType: file.ContentType,
    };
  };
}
