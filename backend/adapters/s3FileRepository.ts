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
    const tags = tagSet.TagSet.reduce(
      (acc, cur) => {
        acc[cur.Key] = cur.Value;
        return acc;
      },
      {} as Record<string, string>,
    );
    return {
      fileBody: file.Body?.toString(),
      contentType: file.ContentType,
      tags,
    };
  };

  getFileStream = async (
    eventRecord: S3EventRecord,
    includeTags: boolean,
  ): Promise<IFileStreamResult> => {
    try {
      const bucket = eventRecord.s3.bucket.name;
      log.info('bucket' + bucket);
      const key = decodeURIComponent(
        eventRecord.s3.object.key.replace(/\+/g, ' '),
      );
      log.info('key' + key);
      const fileStream = this.#s3
        .getObject({
          Bucket: bucket,
          Key: key,
        })
        .createReadStream();
      log.info('fileStream' + fileStream);

      let tags = {};

      if (includeTags) {
        const tagsPromise = this.#s3
          .getObjectTagging({
            Bucket: bucket,
            Key: key,
          })
          .promise();
        log.info('tagsPromise' + tagsPromise);
        const tagSet = await tagsPromise;
        log.info('tagSet' + tagSet);

        tags = tagSet.TagSet.reduce(
          (acc, cur) => {
            acc[cur.Key] = cur.Value;
            return acc;
          },
          {} as Record<string, string>,
        );
        log.info('tags' + tags);
      }
      return {
        fileStream,
        tags,
      };
    } catch (error) {
      log.error(error);
      return {
        fileStream: undefined,
        tags: { hello: 'wolrd' },
      };
    }
  };
}
