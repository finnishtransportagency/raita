import { S3 } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { getConfig } from './config';
import { processZipFile } from './processZipFile';
import { ZIP_SUFFIX } from './constants';
import * as fs from 'fs';
import { isPathTuple } from './types';
import {
  decodeS3EventPropertyString,
  getKeyConstituents,
  logMessages,
  RaitaZipError,
} from './utils';

start();

async function start() {
  const { bucket, key, targetBucket } = getConfig();
  const startMessage = `Zip extraction from bucket: ${bucket} to ${targetBucket} started for ${key}`;
  // TODO: Temporary logging
  console.log(startMessage);
  try {
    const { path, fileSuffix } = getKeyConstituents(
      decodeS3EventPropertyString(key),
    );
    if (fileSuffix !== ZIP_SUFFIX) {
      throw new RaitaZipError('incorrectSuffix');
    }
    if (!isPathTuple(path)) {
      throw new RaitaZipError('incorrectPath');
    }
    const [system, _year, campaign] = path;
    const s3 = new S3({});
    const getObjectResult = await s3.getObject({
      Bucket: bucket,
      Key: key,
    });
    const readStream = getObjectResult.Body as Readable;
    const ZIP_FILE_PATH = '/tmp/file.zip';
    const writeStream = fs.createWriteStream(ZIP_FILE_PATH);
    writeStream.on('error', (err: unknown) => {
      throw err;
    });
    writeStream.on('finish', () => {
      processZipFile({
        filePath: ZIP_FILE_PATH,
        targetBucket,
        s3,
        system,
        campaign,
      })
        .then(data => {
          const { entries, streamError } = data;
          // TODO: Temporary logging
          console.log(logMessages['resultMessage'](entries));
          if (streamError) {
            // The process succeeded possibly partially. Currently only logs error, does not throw.
            // TODO: Temporary logging
            console.log(logMessages['streamErrorMessage'](streamError));
          }
        })
        .catch(err => {
          // Catches zip opening errors
          throw err;
        });
    });
    readStream.pipe(writeStream);
  } catch (err) {
    // TODO: Temporary logging
    console.log(err);
    // TODO: Possible recovery actions apart from logging
  }
}
