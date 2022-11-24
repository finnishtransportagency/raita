import * as yauzl from 'yauzl';
import { PutObjectCommand, S3 } from '@aws-sdk/client-s3';
import { streamToBuffer } from './utils';
import { Upload } from '@aws-sdk/lib-storage';
import { PassThrough } from 'stream';

interface EntryRecord {
  status: 'success' | 'failure';
  failureCause: 's3PutObjectFailure' | 'streamFailure';
  compressedSize: number;
  uncompressedSize: number;
}
interface ExtractEntriesResult {
  entries: {
    success: Array<EntryRecord>;
    failure: Array<EntryRecord>;
  };
  streamError?: Error;
}

/**
 * Resolves all entries and returns entries organised into
 * success and failure arrays
 */
const resolveEntries = async (entries: Array<Promise<EntryRecord>>) => {
  console.log('resolving entries');
  const data = await Promise.all(entries);
  console.log('all entries resolved.');
  return data.reduce(
    (acc, cur) => {
      acc[cur.status].push(cur);
      return acc;
    },
    { success: [], failure: [] } as ExtractEntriesResult['entries'],
  );
};

/**
 * If there is a possibility that even single file has been succesfully uploaded
 * to S3 bucket the function will always resolve instead of rejecting even if an error occurs.
 * The only case where function rejects if an error occurs before commencing processing the file entries.
 *
 * Impplemenataion based partially on
 * https://transang.me/modern-fetch-and-how-to-get-buffer-output-from-aws-sdk-v3-getobjectcommand/
 */
export const processZipFile = ({
  filePath,
  targetBucket,
  s3,
  system,
  campaign,
}: {
  filePath: string;
  targetBucket: string;
  s3: S3;
  system: string;
  campaign: string;
}) =>
  new Promise<ExtractEntriesResult>((resolve, reject) => {
    // The promise is resolved by calling the
    // closeProsess either when file reaches end or
    // if an error occurs
    const closeProcess = (
      entryPromises: Array<Promise<EntryRecord>>,
      streamError?: Error,
    ) => {
      console.log('closing the process');
      resolveEntries(entryPromises)
        .then(entries => resolve({ entries, streamError }))
        .catch(err => reject(err));
    };

    yauzl.open(filePath, { lazyEntries: true }, (err, zipfile) => {
      // Prosessing of each entry adds a promise into the entryPromises array
      const entries: Array<Promise<EntryRecord>> = [];
      let debug_uploaded = 0;
      let debug_entryReads = 0;

      if (err) {
        console.log('zip file open error.');
        reject(err);
      }
      // Handler to run when zipfile is processed
      // Resolves the main zip file promise with payload of
      // file results all entries by resolving entry promises
      zipfile.on('end', () => {
        console.log('zip file end');
        closeProcess(entries);
      });
      // Handler to run for eacn entry in the file
      zipfile.on('entry', entry => {
        if (/\/$/.test(entry.fileName)) {
          // Entry is directory, can be ignored
          zipfile.readEntry();
        } else {
          // Entry is a file
          const key = `${system}/${campaign}/${entry.fileName.toString()}`;
          zipfile.openReadStream(entry, (err, readStream) => {
            console.log(
              `Entry for read action: ${debug_entryReads}, ${key
                .split('/')
                .slice(-1)}`,
            );
            // Returns a promise which resolves when file is uploaded to S3 (or upload fails)
            const entryPromise = new Promise<EntryRecord>(resolveEntry => {
              if (err) {
                console.log('error opening read stream');
                closeProcess(entries, err);
              }
              readStream.on('error', err => {
                console.log('error in the stream');
                closeProcess(entries, err);
              });
              readStream.once('end', () => {
                debug_entryReads++;
                console.log(`times read entry initiated ${debug_entryReads}`);
                zipfile.readEntry();
              });

              // temp_Upload();

              const { writeStream, promise } = temp_streamToS3();
              readStream.pipe(writeStream);
              promise
                .then(() => {
                  debug_uploaded++;
                  // console.log(
                  //   `Uploaded: ${debug_uploaded}, ${key.split('/').slice(-1)}`,
                  // );
                  resolveEntry({ ...entry, status: 'success' });
                })
                .catch(err => {
                  console.log('Entry write to S3 failed.');
                  resolveEntry({
                    ...entry,
                    status: 'failure',
                    failureCause: 's3PutObjectFailure',
                  });
                });

              function temp_streamToS3() {
                const passThrough = new PassThrough();
                const upload = new Upload({
                  client: s3,
                  params: {
                    Bucket: targetBucket,
                    Key: key,
                    Body: readStream,
                  },
                });
                return {
                  writeStream: passThrough,
                  promise: upload.done(),
                };
              }

              // Temporary test functions with unruly external dependencies
              function temp_Upload() {
                const upload = new Upload({
                  client: s3,
                  params: {
                    Bucket: targetBucket,
                    Key: key,
                    Body: readStream,
                  },
                });
                upload
                  .done()
                  .then(() => {
                    debug_uploaded++;
                    console.log(`Uploaded: ${debug_uploaded}`);
                    resolveEntry({ ...entry, status: 'success' });
                  })
                  .catch(err => {
                    console.log('Entry write to S3 failed.');
                    resolveEntry({
                      ...entry,
                      status: 'failure',
                      failureCause: 's3PutObjectFailure',
                    });
                  });
              }

              // https://docs.aws.amazon.com/AmazonS3/latest/userguide/example_s3_PutObject_section.html
              function temp_PutObjectCommand() {
                const command = new PutObjectCommand({
                  Bucket: targetBucket,
                  Key: key,
                  Body: readStream,
                });
                s3.send(command)
                  .then(() => {
                    console.log('Entry write to S3 succeeded.');
                    resolveEntry({ ...entry, status: 'success' });
                  })
                  .catch(err => {
                    console.log('Entry write to S3 failed.');
                    resolveEntry({
                      ...entry,
                      status: 'failure',
                      failureCause: 's3PutObjectFailure',
                    });
                  });
              }

              // Buffering approach, fails for large files not fitting into Buffer
              const temp_Buffered = () => {
                streamToBuffer(readStream).then(data => {
                  const command = new PutObjectCommand({
                    Bucket: targetBucket,
                    Key: key,
                    Body: data,
                  });
                  s3.send(command)
                    .then(() => {
                      resolveEntry({ ...entry, status: 'success' });
                    })
                    .catch(err => {
                      resolveEntry({
                        ...entry,
                        status: 'failure',
                        failureCause: 's3PutObjectFailure',
                      });
                    })
                    .catch(() => {
                      resolveEntry({
                        ...entry,
                        status: 'failure',
                        failureCause: 'streamFailure',
                      });
                    });
                });
              };
            });
            // Add promise to array to
            entries.push(entryPromise);
          });
        }
      });
      debug_entryReads++;
      console.log(`times read entry initiated ${debug_entryReads}`);
      zipfile.readEntry();
    });
  });
