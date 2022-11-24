import * as yauzl from 'yauzl';
import { PutObjectCommand, S3 } from '@aws-sdk/client-s3';
import { streamToBuffer } from './utils';
import stream from 'stream';
import { Upload } from '@aws-sdk/lib-storage';

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

const resolveEntries = async (entryPromises: Array<Promise<EntryRecord>>) => {
  const data = await Promise.all(entryPromises);
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
      const entryPromises: Array<Promise<EntryRecord>> = [];
      if (err) {
        console.log('zip file open error.');
        reject(err);
      }
      // Handler to run when zipfile is processed
      // Resolves the main zip file promise with payload of
      // file results all entries by resolving entry promises
      zipfile.on('end', () => {
        console.log('zip file end');
        closeProcess(entryPromises);
      });
      zipfile.on('entry', entry => {
        if (/\/$/.test(entry.fileName)) {
          // entry is directory
          zipfile.readEntry();
        } else {
          // entry is a file
          zipfile.openReadStream(entry, async (err, readStream) => {
            const entryPromise = new Promise<EntryRecord>(resolveEntry => {
              if (err) {
                console.log('error opening read stream');
                closeProcess(entryPromises, err);
              }
              readStream.on('error', err => {
                console.log('error in the stream');
                closeProcess(entryPromises, err);
              });
              readStream.on('end', () => {
                console.log('entry end');
                zipfile.readEntry();
              });

              const upload = new Upload({
                client: new S3({}),
                params: {
                  Bucket: targetBucket,
                  Key: `${system}/${campaign}/${entry.fileName.toString()}`,
                  Body: readStream,
                },
              });

              upload
                .done()
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

              // https://docs.aws.amazon.com/AmazonS3/latest/userguide/example_s3_PutObject_section.html
              // const command1 = new PutObjectCommand({
              //   Bucket: targetBucket,
              //   Key: `${system}/${campaign}/${entry.fileName.toString()}`,
              //   Body: readStream,
              //   // TO CHECK: Setting content type explicitly may not be necessary
              //   // ContentType: mime.lookup(entryName) || undefined,
              // });
              // s3.send(command1)
              //   .then(() => {
              //     console.log('Entry write to S3 succeeded.');
              //     resolveEntry({ ...entry, status: 'success' });
              //   })
              //   .catch(err => {
              //     console.log('Entry write to S3 failed.');
              //     resolveEntry({
              //       ...entry,
              //       status: 'failure',
              //       failureCause: 's3PutObjectFailure',
              //     });
              //   })
              //   .catch(() => {
              //     console.log('Stream failed.');
              //     resolveEntry({
              //       ...entry,
              //       status: 'failure',
              //       failureCause: 'streamFailure',
              //     });
              //   });

              // Buffering approach, fails for large files not fitting into Buffer
              // streamToBuffer(readStream).then(data => {
              //   const command = new PutObjectCommand({
              //     Bucket: targetBucket,
              //     Key: `${system}/${campaign}/${entry.fileName.toString()}`,
              //     Body: data,
              //     // TO CHECK: Setting content type explicitly may not be necessary
              //     // ContentType: mime.lookup(entryName) || undefined,
              //   });
              //   s3.send(command)
              //     .then(() => {
              //       resolveEntry({ ...entry, status: 'success' });
              //     })
              //     .catch(err => {
              //       resolveEntry({
              //         ...entry,
              //         status: 'failure',
              //         failureCause: 's3PutObjectFailure',
              //       });
              //     })
              //     .catch(() => {
              //       resolveEntry({
              //         ...entry,
              //         status: 'failure',
              //         failureCause: 'streamFailure',
              //       });
              //     });
              // });
            });
            entryPromises.push(entryPromise);
          });
        }
      });
      zipfile.readEntry();
    });
  });
