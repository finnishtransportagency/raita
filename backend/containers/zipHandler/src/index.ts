import { S3 } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import {
  decodeS3EventPropertyString,
  isRaitaSourceSystem,
  streamToBuffer,
} from './utils';
import { getConfig } from './config';
import { processZipFile } from './processZipFile';
import { ZIP_SUFFIX } from './constants';
import * as fs from 'fs';

start();

// Expected structure for zip file path parts is designated in the PathType type
// If the path parts are not following, processing the file will lead into data inconsistencies
// Only tuple length and source system are validated
type PathTuple = [
  system: 'Meeri' | 'Emma' | 'Elli',
  year: string,
  campaign: string,
  date: string,
  fileName: string,
];

function isPathTuple(arg: Array<string>): arg is PathTuple {
  const [system] = arg;
  return arg.length === 5 && !!system && isRaitaSourceSystem(system);
}

async function start() {
  const { bucket, key, targetBucket } = getConfig();
  // Temporary logging
  console.log(
    `Zip extraction from bucket: ${bucket} to ${targetBucket} started for ${key}`,
  );
  try {
    const path = decodeS3EventPropertyString(key).split('/');
    console.log(path);
    const fileName = path[path.length - 1];
    const [_baseName, suffix] = fileName.split('.');
    if (suffix !== ZIP_SUFFIX) {
      throw new Error('Non zip file detected (based on file suffix).');
    }
    if (!isPathTuple(path)) {
      throw new Error(
        'Zip file path does not meet expected stucture: System / Year / Campaign / Date / File name where System is one of the following: Meeri, Emma, Elli',
      );
    }
    const [system, _year, campaign] = path;
    const s3 = new S3({});
    const getObjectResult = await s3.getObject({
      Bucket: bucket,
      Key: key,
    });

    console.log('got object result');

    // Buffer the whole file in memory
    // const bodyBuffer = await streamToBuffer(getObjectResult.Body as Readable);

    try {
      const dir = fs.readdirSync('/');
      console.log('managed to read the root');
      console.log(dir);
      fs.writeFileSync('./test.txt', 'this is some text');
      console.log('managed to write a file');
    } catch (error) {
      console.log(error);
    }

    const ZIP_FILE_PATH = './file.zip';
    const writeStream = fs.createWriteStream(ZIP_FILE_PATH);
    const readableBody = getObjectResult.Body as Readable;

    writeStream.on('error', (err: unknown) => {
      console.log('write stream failed,');
      throw err;
    });
    writeStream.on('end', () => {
      console.log('data written succesfully to disk.');
      processZipFile({
        filePath: ZIP_FILE_PATH,
        targetBucket,
        s3,
        system,
        campaign,
      })
        .then(data => {
          const { entries, streamError } = data;
          console.log(`${
            entries.success.length
          } files extracted from zip archive.
        ${entries.failure.length} files failed in the process.
        Total compressed size of extracted files ${entries.success.reduce(
          (acc, cur) => acc + cur.compressedSize,
          0,
        )}
        `);
          if (streamError) {
            console.log('Zip extraction failed due to zip error', streamError);
          }
        })
        .catch(err => {
          throw err;
        });
    });

    readableBody.pipe(writeStream);

    // const { entries, streamError } = await processZipFile({
    //   bodyBuffer,
    //   targetBucket,
    //   s3,
    //   system,
    //   campaign,
    // });
    // // Temporary logging
  } catch (error) {
    // TODO: Add Proper error handling
    console.log(error);
  }
}
