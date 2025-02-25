import * as CSV from 'csv-string';
import {
  CsvRow,
  FileGenerationProgress,
  MultipartUploadResultWithPartNumber,
} from './types';
import { log } from '../../../utils/logger';
import { PassThrough, Readable } from 'stream';
import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  PutObjectCommand,
  PutObjectCommandOutput,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { asyncWait } from '../../../utils/common';

const separator = ';';

export const objectToCsvHeader = (row: CsvRow) => {
  const csvHeader = row.map(column => column.header);
  return CSV.stringify(csvHeader, separator);
};

export const objectToCsvBody = (rows: CsvRow[]) => {
  const bodyRows = rows.map(row => row.map(column => column.value));
  if (!bodyRows || bodyRows.length === 0) {
    log.error(bodyRows);
  }
  const res = CSV.stringify(bodyRows, separator);
  if (!res) {
    log.error({ res }, 'empty csv body');
  }
  return res;
};

// Function to prepend BOM to the stream
export function prependBOMToStream(readableStream: Readable) {
  const BOM = '\uFEFF';
  const bomStream = new PassThrough();
  bomStream.write(BOM); // Write BOM at the beginning
  readableStream.pipe(bomStream); // Pipe the original stream after BOM
  return bomStream;
}

export const uploadReadableToS3 = async (
  stream: Readable,
  targetBucket: string,
  targetKey: string,
  s3Client: S3Client,
) => {
  const partPromises: Promise<MultipartUploadResultWithPartNumber>[] = [];
  let partNumber = 1; // this should only be modified from one read function call at a time

  const chunkSize = 10 << 20; // 10 MB
  let multipartUploadId: string | undefined = undefined;
  let streamEnded = false;

  let reading = false;

  /**
   * Handle read and upload
   */
  const read = async () => {
    while (true) {
      const firstChunk = partNumber === 1;
      const data = stream.read(chunkSize);
      if (data === null) {
        if (streamEnded) {
          log.info('Stream end');
          break;
        }
        // log.info('Data null but stream not over');
        await asyncWait(10);
        continue;
      }
      if (firstChunk) {
        const multipartUpload = await s3Client.send(
          new CreateMultipartUploadCommand({
            Bucket: targetBucket,
            Key: targetKey,
          }),
        );
        multipartUploadId = multipartUpload.UploadId;
      }
      const uploadCommand = new UploadPartCommand({
        Bucket: targetBucket,
        Key: targetKey,
        PartNumber: partNumber,
        UploadId: multipartUploadId,
        Body: data,
      });
      // TODO update upload progress percentage? is it useful?
      const res = s3Client.send(uploadCommand);
      const resultWithNumber: MultipartUploadResultWithPartNumber = {
        uploadPartCommandOutput: await res,
        partNumber,
      };
      partNumber += 1;
      partPromises.push(Promise.resolve(resultWithNumber));
    }
    const partResults = await Promise.all(partPromises);
    return await s3Client.send(
      new CompleteMultipartUploadCommand({
        Bucket: targetBucket,
        Key: targetKey,
        UploadId: multipartUploadId,
        MultipartUpload: {
          Parts: partResults.map((res, i) => ({
            ETag: res.uploadPartCommandOutput.ETag,
            PartNumber: res.partNumber,
          })),
        },
      }),
    );
  };

  stream.on('end', async () => {
    // tell read function loop that stream is over
    // TODO: this seems a bit fragile
    streamEnded = true;
  });
  return new Promise((resolve, reject) => {
    stream.on('readable', async () => {
      // there can be multiple readable events, but the easiest way is to have read loop running continuously until env event
      // log.info('readable');
      if (!reading) {
        reading = true;
        await read();
        resolve(true);
      }
    });
  });
};

export async function uploadProgressData(
  progressData: FileGenerationProgress,
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
