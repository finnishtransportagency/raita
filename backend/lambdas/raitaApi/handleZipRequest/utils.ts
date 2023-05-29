import {
  GetObjectCommand,
  PutObjectCommand,
  PutObjectCommandOutput,
  S3Client,
} from '@aws-sdk/client-s3';
import { S3 } from 'aws-sdk';
import { failedProgressData } from './constants';
import { Readable, PassThrough } from 'stream';
import { Upload } from '@aws-sdk/lib-storage';

export function createLazyDownloadStreamFrom(
  bucket: string,
  key: string,
  s3Client: S3Client,
): Readable {
  let streamCreated = false;
  // create a dummy stream to pass on
  const stream = new PassThrough();
  // only when someone first connects to this stream do we fetch the object and feed the data through the dummy stream
  stream.on('newListener', async event => {
    if (!streamCreated && event == 'data') {
      await initDownloadStream(bucket, key, stream, s3Client);
      streamCreated = true;
    }
  });

  return stream;
}

export async function uploadZip(
  bucket: string,
  key: string,
  stream: Readable,
  s3Client: S3Client,
): Promise<void> {
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: bucket,
      Key: key,
      // we pipe to a passthrough to handle the case that the stream isn't initialized yet
      Body: stream.pipe(new PassThrough()),
      ContentType: 'application/zip',
    },
  });
  await upload.done();
}

export async function uploadProgressData(
  progressData: CompressionProgress,
  bucket: string,
  key: string,
  s3Client: S3Client,
): Promise<void | PutObjectCommandOutput> {
  const params = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: JSON.stringify(progressData),
  });
  return s3Client.send(params);
}

export async function uploadDeHydratedToS3(
  bucket: string,
  key: string,
  s3Client: S3Client,
  payload: string,
) {
  const params = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: payload,
  });
  return s3Client.send(params);
}

export async function getJsonObjectFromS3(bucket: string, key: string, s3: S3) {
  const command = {
    Bucket: bucket,
    Key: key,
  };
  const data = await s3.getObject(command).promise();
  return data?.Body ? JSON.parse(data.Body.toString()) : null;
}

export async function updateProgressFailed(
  bucket: string,
  key: string,
  s3Client: S3Client,
) {
  return uploadProgressData(failedProgressData, bucket, key, s3Client);
}

export function validateInputs(keys: string[], pollingFileKey: string) {
  if (!keys.length) throw new Error('No file keys to handle');
  if (!pollingFileKey.length)
    throw new Error('The key of the polling file cannot be empty');
}

async function initDownloadStream(
  bucket: string,
  key: string,
  stream: PassThrough,
  s3Client: S3Client,
) {
  try {
    const { Body: body } = await s3Client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    // we need to type narrow here since Body can be one of many things
    if (!body) {
      stream.emit(
        'error',
        new Error(
          `got an undefined body from s3 when getting object ${bucket}/${key}`,
        ),
      );
    } else if (!('on' in body)) {
      stream.emit(
        'error',
        new Error(
          `got a ReadableStream<any> (a stream used by browser fetch) or Blob from s3 when getting object ${bucket}/${key} instead of Readable`,
        ),
      );
    } else {
      body.on('error', err => stream.emit('error', err)).pipe(stream);
    }
  } catch (e) {
    stream.emit('error', e);
  }
}

export interface CompressionProgress {
  status: ProgressStatus;
  progressPercentage: number;
  url?: string | undefined;
}

export interface ZipRequestBody {
  keys: string[];
  pollingFileKey: string;
  dehydrated?: boolean | undefined;
}

export enum ProgressStatus {
  SUCCESS = 'SUCCESS',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
}
