import * as yauzl from 'yauzl';
import { S3 } from '@aws-sdk/client-s3';
import { isRaitaVideoFile, resolveEntries, uploadToS3 } from './utils';
import { EntryRecord, ExtractEntriesResult, ZipFileData } from './types';

/**
 * If there is a possibility that even single file has been succesfully uploaded
 * to S3 bucket the function will always resolve instead of rejecting even if an error occurs.
 * The only case where function rejects if an error occurs before commencing processing the file entries.
 */
export const processZipFile = ({
  filePath,
  targetBucket,
  s3,
  s3KeyPrefix,
  zipFileData,
}: {
  filePath: string;
  targetBucket: string;
  s3: S3;
  s3KeyPrefix: string;
  zipFileData: ZipFileData;
}) =>
  new Promise<ExtractEntriesResult>((resolve, reject) => {
    // The promise is resolved by calling the
    // closeProsess either when file reaches end or
    // if an error occurs
    const closeProcess = (
      entryPromises: Array<Promise<EntryRecord>>,
      streamError?: Error,
    ) => {
      resolveEntries(entryPromises)
        .then(entries => resolve({ entries, streamError }))
        .catch(err => reject(err));
    };

    yauzl.open(filePath, { lazyEntries: true }, (err, zipfile) => {
      // Prosessing of each entry adds a promise into the entryPromises array
      const entries: Array<Promise<EntryRecord>> = [];
      // If opening zip files fails, reject promise and return;
      if (err) {
        reject(err);
        return;
      }
      // Handler to run when zipfile is processed
      // Resolves the main zip file promise with payload of
      // file results all entries by resolving entry promises
      zipfile.on('end', () => {
        closeProcess(entries);
      });
      // Handler to run for eacn entry in the file
      zipfile.on('entry', entry => {
        if (/\/$/.test(entry.fileName)) {
          // Entry is directory, can be ignored
          zipfile.readEntry();
        } else {
          // Entry is a file
          // Inspect the enty file name to detect video files: video files are not extracted from the zip
          if (isRaitaVideoFile(entry.fileName)) {
            // Ignore the current video file entry and read next
            zipfile.readEntry();
          } else {
            // Generate key by joining the prefix to the path of the file inside zip
            // Key determines the path where file is stored in target bucket
            const key = `${s3KeyPrefix}/${entry.fileName.toString()}`;
            zipfile.openReadStream(entry, (err, readStream) => {
              // Returns a promise for entry which resolves when file is uploaded to S3 (or upload fails)
              const entryResult = new Promise<EntryRecord>(resolveEntry => {
                if (err) {
                  closeProcess(entries, err);
                }
                readStream.on('error', err => {
                  closeProcess(entries, err);
                });
                readStream.once('end', () => {
                  zipfile.readEntry();
                });
                // Get write stream and a promise which resolves as streaming the data to S3 is complete
                const { writeStream, uploadPromise } = uploadToS3({
                  targetBucket,
                  key,
                  s3,
                  zipFileData,
                });
                readStream.pipe(writeStream);
                uploadPromise
                  .then(() => {
                    // Upload succeeded, resolve with success
                    resolveEntry({ ...entry, status: 'success' });
                  })
                  .catch((err: unknown) => {
                    // Upload failed, resolve with error
                    resolveEntry({
                      ...entry,
                      status: 'failure',
                      failureCause: `Upload to S3 failed: ${
                        err instanceof Error ? err.message : err
                      }`,
                    });
                  });
              });
              // Add promise to array of entries
              entries.push(entryResult);
            });
          }
        }
      });
      zipfile.readEntry();
    });
  });
