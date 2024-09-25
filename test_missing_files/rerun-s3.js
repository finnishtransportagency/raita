const {
  S3Client,
  HeadObjectCommand,
  CopyObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCopyCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} = require('@aws-sdk/client-s3');
const { readFileSync } = require('fs');

// import {
//   S3Client,
//   _Object,
//   CopyObjectCommandInput,
//   HeadObjectCommand,
//   HeadObjectCommandOutput,
//   CopyObjectCommand,
//   CreateMultipartUploadCommand,
//   UploadPartCopyCommand,
//   CompleteMultipartUploadCommand,
//   AbortMultipartUploadCommand,
// } from '@aws-sdk/client-s3';

/**
 * This script will copy each object given by input file in place, starting the data process
 * required env vars: AWS_PROFILE, S3_BUCKET, INPUT_FILE
 */

const s3Client = new S3Client({
  region: 'eu-west-1',
});

const bucket = process.env['S3_BUCKET'];
if (!bucket) {
  throw new Error('Missing S3_BUCKET');
}
const fileName = process.env['INPUT_FILE'];
if (!fileName) {
  throw new Error('Missing INPUT_FILE');
}

const setTimeoutPromise = delay =>
  new Promise((resolve, reject) => {
    setTimeout(() => resolve(null), delay);
  });

async function copyObjects(bucket, keys) {
  try {
    const waitPerRequest = 10;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const getObjectCommand = new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      const response = await s3Client.send(getObjectCommand);
      await copyFileInPlace(s3Client, response, {
        Bucket: bucket,
        CopySource: encodeURIComponent(`${bucket}/${key}`),
        Key: key,
        MetadataDirective: 'COPY',
      });
      // wait between each request to not hit s3 ratelimits
      await setTimeoutPromise(waitPerRequest);
    }
  } catch (err) {
    console.log({ err, msg: 'Error caught' });
    throw new Error(`Error copying from bucket ${bucket}: ${err.message}`);
  }
}

/**
 * Copy file in place, changing metadata
 * Use multipart upload for large enough files
 */
async function copyFileInPlace(s3Client, existingObject, input) {
  const objectSize = existingObject.ContentLength;
  if (!objectSize) {
    throw new Error('No objectSize?');
  }
  const sizeLimit = 1024 * 1024 * 100; // 100MB
  const useMultipart = objectSize > sizeLimit;
  if (!useMultipart) {
    const command = new CopyObjectCommand(input);
    return s3Client.send(command);
  }
  const partSize = sizeLimit;

  let uploadId;
  try {
    const multipartUpload = await s3Client.send(
      new CreateMultipartUploadCommand({
        Bucket: input.Bucket,
        Key: input.Key,
      }),
    );
    const partPromises = [];
    uploadId = multipartUpload.UploadId;
    const partCount = Math.ceil(objectSize / partSize);
    for (let i = 0; i < partCount; i++) {
      const start = i * partSize;
      const end = Math.min(start + partSize - 1, objectSize - 1);
      const copyInput = {
        ...input,
        PartNumber: i + 1,
        UploadId: uploadId,
        CopySourceRange: `bytes=${start}-${end}`,
      };
      partPromises.push(s3Client.send(new UploadPartCopyCommand(copyInput)));
    }
    const partResults = await Promise.all(partPromises);
    return await s3Client.send(
      new CompleteMultipartUploadCommand({
        Bucket: input.Bucket,
        Key: input.Key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: partResults.map((res, i) => ({
            ETag: res.CopyPartResult?.ETag,
            PartNumber: i + 1,
          })),
        },
      }),
    );
  } catch (error) {
    console.log({ msg: 'Error in multipart copy, aborting', error });
    if (uploadId) {
      const abortCommand = new AbortMultipartUploadCommand({
        Bucket: input.Bucket,
        Key: input.Key,
        UploadId: uploadId,
      });
      await s3Client.send(abortCommand);
    }
    throw new Error('Error in multipart copy');
  }
}

try {
  const data = readFileSync(fileName, 'utf8');
  // TODO: might be problematic with large amount of keys?
  const keys = data.split('\n').filter(k => !!k);
  // console.log(keys);
  copyObjects(bucket, keys).then(() => {
    console.log(`done`);
  });
} catch (err) {
  console.error(err);
}
