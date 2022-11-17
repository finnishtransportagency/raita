import yauzl from 'yauzl';

import { PutObjectCommand, S3 } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

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

  const stream = getObjectResult.Body as Readable;

  // Buffer the whole file in memory (using node version < 17.5.0)
  const bodyBuffer = new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.once('end', () => resolve(Buffer.concat(chunks)));
    stream.once('error', reject);
  });

  const results: Array<any> = [];

  if (getObjectResult.Body) {
    yauzl.fromBuffer(
      await bodyBuffer,
      { lazyEntries: true },
      (err, zipfile) => {
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
            zipfile.openReadStream(entry, async (err, readStream) => {
              if (err) throw err;
              readStream.on('end', function () {
                zipfile.readEntry();
              });
              const command = new PutObjectCommand({
                Bucket: targetBucket,
                Key: entry.fileName,
                Body: entry,
                // TO CHECK: Setting content type explicitly may not be necessary
                // ContentType: mime.lookup(entryName) || undefined,
              });
              results.push(await s3.send(command));
              // readStream.pipe(somewhere);
            });
          }
        });
      },
    );
  }

  console.log(`${results.length} files extracted from zip archive.`);
}
