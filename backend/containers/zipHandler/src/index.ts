import { S3 } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { streamToBuffer } from './utils';
import { getConfig } from './config';
import { processZipFile } from './processZipFile';

start();

async function start() {
  const { bucket, key, targetBucket } = getConfig();
  // Temporary logging
  console.log(
    `Zip extraction from bucket: ${bucket} to ${targetBucket} started for ${key}`,
  );
  try {
    const s3 = new S3({});
    const getObjectResult = await s3.getObject({
      Bucket: bucket,
      Key: key,
    });

    // TODO: Add logic to ignore non-zip files (by suffix)
    // TODO: Add logic to ignore files outside Meeri, Emma, Elli folders

    // Buffer the whole file in memory
    const bodyBuffer = await streamToBuffer(getObjectResult.Body as Readable);
    const { entries, streamError } = await processZipFile(
      bodyBuffer,
      targetBucket,
      s3,
    );
    // Temporary logging
    console.log(`${entries.success.length} files extracted from zip archive.
        ${entries.failure.length} files failed in the process.
        Total compressed size of extracted files ${entries.success.reduce(
          (acc, cur) => acc + cur.compressedSize,
          0,
        )}
        `);
    if (streamError) {
      console.log('Zip extraction failed due to zip error', streamError);
    }
  } catch (error) {
    // TODO: Proper error handling
    console.log(error);
  }
}
