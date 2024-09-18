const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

// import {
//   S3Client,
//   ListObjectsV2Command,
//   ListObjectsV2CommandInput,
//   _Object,
// } from '@aws-sdk/client-s3';

/**
 * This script will fetch all object keys from an s3 bucket and write them to STDOUT
 * required end vars: AWS_PROFILE, S3_BUCKET
 */

const s3Client = new S3Client({
  region: 'eu-west-1',
});

const bucket = process.env['S3_BUCKET'];
if (!bucket) {
  throw new Error('Missing S3_BUCKET');
}

async function getAllObjects(bucket, prefix = '') {
  try {
    let fetchMore = true;
    let continuationToken = undefined;
    // note: listObjectsV2 only returns 1000 keys at a time
    let count = 0;
    while (fetchMore) {
      const params = {
        Bucket: bucket,
        Prefix: prefix,
      };
      if (continuationToken) {
        params.ContinuationToken = continuationToken;
      }
      const listCommand = new ListObjectsV2Command(params);
      const listResponse = await s3Client.send(listCommand);
      if (!listResponse) {
        throw new Error('Error with listObjects');
      }
      const objects = listResponse.Contents ?? [];
      if (!objects.length) {
        console.log(`No objects found in ${bucket} with prefix ${prefix}`);
        return 0;
      }
      count += objects.length;
      const keys = objects.map(object => object.Key);
      if (listResponse.IsTruncated) {
        continuationToken = listResponse.NextContinuationToken;
      } else {
        fetchMore = false;
      }
      keys.forEach(key => {
        console.log(key);
      });
    }
    // TODO: using single copy requests might not work if file count is too high?
    return count;
  } catch (err) {
    console.log({ err, msg: 'Error caught' });
    throw new Error(`Error copying from bucket ${bucket}: ${err.message}`);
  }
}

getAllObjects(bucket).then(count => {
  // console.log(`done, count: ${count}`);
});
