import { S3EventRecord } from 'aws-lambda';
import { IFileStreamResult } from '../types';
import { IFileInterface } from '../types/portFile';
import {
  GetObjectCommand,
  GetObjectTaggingCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

export class S3FileRepository implements IFileInterface {
  #s3: S3Client;

  constructor() {
    this.#s3 = new S3Client();
  }

  getFileStream = async (
    eventRecord: S3EventRecord,
  ): Promise<IFileStreamResult> => {
    const bucket = eventRecord.s3.bucket.name;
    const key = decodeURIComponent(
      eventRecord.s3.object.key.replace(/\+/g, ' '),
    );
    // get metadata separately with head request because fileStream only contains file body

    const file = await this.#s3.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );

    if (!file.Body) {
      throw new Error('Error getting file stream');
    }
    const fileStream: Readable = file.Body as Readable;

    const metadata = file.Metadata ?? {};
    const contentType: string | undefined = file.ContentType;

    const tagsPromise = this.#s3.send(
      new GetObjectTaggingCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
    const tagSet = await tagsPromise;

    const tags =
      tagSet && tagSet.TagSet
        ? tagSet.TagSet.reduce(
            (acc, cur) => {
              if (cur.Key) {
                acc[cur.Key] = cur.Value ?? '';
              }
              return acc;
            },
            {} as Record<string, string>,
          )
        : {};
    return {
      fileStream,
      contentType,
      tags,
      metaData: metadata,
    };
  };
}
