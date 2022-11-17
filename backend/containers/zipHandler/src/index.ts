import * as yauzl from 'yauzl';

import { PutObjectCommand, S3 } from '@aws-sdk/client-s3';
import { Readable, Stream } from 'stream';
import { streamToBuffer } from './utils';

start();

/**
 * https://transang.me/modern-fetch-and-how-to-get-buffer-output-from-aws-sdk-v3-getobjectcommand/
 */

async function start() {
  const bucket = process.env['S3_SOURCE_BUCKET'];
  const key = process.env['S3_SOURCE_KEY'];
  const targetBucket = process.env['S3_TARGET_BUCKET'];
  console.log('ECS task launched succesfully');
  console.log(`Bucket: ${bucket}`);
  console.log(`Target bucket: ${targetBucket}`);
  console.log(`Key: ${key}`);

  const s3 = new S3({});
  const getObjectResult = await s3.getObject({
    Bucket: bucket,
    Key: key,
  });

  // Buffer the whole file in memory (using node version < 17.5.0)
  const bodyBuffer = await streamToBuffer(getObjectResult.Body as Readable);

  const results: Array<Promise<void>> = [];

  if (getObjectResult.Body) {
    yauzl.fromBuffer(bodyBuffer, { lazyEntries: true }, (err, zipfile) => {
      console.log('Got zip file. ');
      if (err) throw err;
      zipfile.readEntry();
      zipfile.on('entry', entry => {
        if (/\/$/.test(entry.fileName)) {
          // Directory file names end with '/'.
          // Note that entries for directories themselves are optional.
          // An entry's fileName implicitly requires its parent directories to exist.
          zipfile.readEntry();
        } else {
          // file entry
          const prom = new Promise<void>((resolve, reject) => {
            zipfile.openReadStream(entry, async (err, readStream) => {
              if (err) throw err;
              readStream.on('end', function () {
                resolve();
                zipfile.readEntry();
              });
              readStream.on('error', () => {
                reject();
              });
              const command = new PutObjectCommand({
                Bucket: targetBucket,
                Key: entry.fileName.toString?.(),
                Body: await streamToBuffer(readStream),
                Metadata: {},
                // TO CHECK: Setting content type explicitly may not be necessary
                // ContentType: mime.lookup(entryName) || undefined,
              });
              const data = await s3.send(command);
              console.log(`File name: ${entry.fileName}`);
              console.log(
                `File file name to string: ${entry.fileName.toString?.()}`,
              );
              results.push(prom);
            });
          });
        }
      });
    });
  }
  console.log(`Before promise all.`);
  Promise.all(results);
  console.log(`${results.length} files extracted from zip archive.`);
}
