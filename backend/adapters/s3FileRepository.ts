import { S3EventRecord } from 'aws-lambda';
import { S3 } from 'aws-sdk';
import { string } from 'zod';
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
    const filePromise = this.#s3
      .getObject({
        Bucket: bucket,
        Key: key,
      })
      .promise();
    const tagsPromise = this.#s3
      .getObjectTagging({
        Bucket: bucket,
        Key: key,
      })
      .promise();
    const [file, tagSet] = await Promise.all([filePromise, tagsPromise]);
    const tags = tagSet.TagSet.reduce((acc, cur) => {
      acc[cur.Key] = cur.Value;
      return acc;
    }, {} as Record<string, string>);
    return {
      fileBody: file.Body?.toString(),
      contentType: file.ContentType,
      tags,
    };
  };
}
