import { S3EventRecord } from 'aws-lambda';
import { S3 } from 'aws-sdk';
import { IFileResult, IFileStreamResult } from '../types';
import { IFileInterface } from '../types/portFile';
import { log } from '../utils/logger';

export class S3FileRepository implements IFileInterface {
  #s3: S3;

  constructor() {
    this.#s3 = new S3();
  }

  getFile = async (
    eventRecord: S3EventRecord,
    includeTags: boolean,
  ): Promise<IFileResult> => {
    const bucket = eventRecord.s3.bucket.name;
    const key = decodeURIComponent(
      eventRecord.s3.object.key.replace(/\+/g, ' '),
    );

    log.info('getfile: ' + bucket + key);
    try {
      const filePromise = this.#s3
        .getObject({
          Bucket: bucket,
          Key: key,
        })
        .promise();

      log.info('filePromise: ' + filePromise);
      const file = await filePromise;
      log.info('file: ' + file);
      let tags = {};

      if (includeTags) {
        const tagsPromise = this.#s3
          .getObjectTagging({
            Bucket: bucket,
            Key: key,
          })
          .promise();
        const tagSet = await tagsPromise;
        tags = tagSet.TagSet.reduce(
          (acc, cur) => {
            acc[cur.Key] = cur.Value;
            return acc;
          },
          {} as Record<string, string>,
        );
      }

      return {
        fileBody: file.Body?.toString(),
        contentType: file.ContentType,
        tags,
      };
    } catch (error) {
      log.error('error getting file: ' + error);
      return {
        fileBody: undefined,
        contentType: undefined,
        tags: {},
      };
    }
  };

  getFileStream = async (
    eventRecord: S3EventRecord,
    includeTags: boolean,
  ): Promise<IFileStreamResult> => {
    const bucket = eventRecord.s3.bucket.name;
    const key = decodeURIComponent(
      eventRecord.s3.object.key.replace(/\+/g, ' '),
    );
    // get metadata separately with head request because fileStream only contains file body
    const headPromise = this.#s3
      .headObject({
        Bucket: bucket,
        Key: key,
      })
      .promise();
    const fileStream = this.#s3
      .getObject({
        Bucket: bucket,
        Key: key,
      })
      .createReadStream();
    let tags = {};


    //csv bucket event handler stalled here; so added boolean includeTags. TODO make smarter
    if (includeTags) {
      const tagsPromise = this.#s3
        .getObjectTagging({
          Bucket: bucket,
          Key: key,
        })
        .promise();
      const tagSet = await tagsPromise;
      tags = tagSet.TagSet.reduce(
        (acc, cur) => {
          acc[cur.Key] = cur.Value;
          return acc;
        },
        {} as Record<string, string>,
      );
    }
    const headResponse = await headPromise;
    return {
      fileStream,
      contentType: headResponse.ContentType,
      tags,
      metaData: headResponse.Metadata ?? {},
    };
  };
}
