import * as fs from 'fs';
import { S3 } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { getConfig } from './config';
import { processZipFile } from './processZipFile';
import {
  decodeS3EventPropertyString,
  getKeyData,
  logMessages,
  RaitaZipError,
} from './utils';
import { isZipPath, ZipFileData } from './types';
import { ZIP_SUFFIX } from './constants';
import { log } from './logger';

start();

async function start() {
  const { bucket, key, targetBucket } = getConfig();
  const startMessage = `Zip extraction from bucket: ${bucket} to ${targetBucket} started for ${key}`;
  // TODO: Temporary logging
  log.debug(startMessage);
  try {
    const zipKey = decodeS3EventPropertyString(key);
    const { path, keyWithoutSuffix, fileSuffix, fileBaseName } =
      getKeyData(zipKey);
    if (fileSuffix !== ZIP_SUFFIX) {
      throw new RaitaZipError('incorrectSuffix');
    }
    // Note: Adherence to zip path type is also checked in lambda
    if (!isZipPath(path)) {
      throw new RaitaZipError('incorrectPath');
    }
    const s3 = new S3({});
    const getObjectResult = await s3.getObject({
      Bucket: bucket,
      Key: key,
    });

    // Timestamp is needed to tie the extracted files and meta data entries into the zip
    // file they were extracted from. The LastModified here should always equal to the moment
    // when zip was uploaded to the S3 bucket. As a backup, a secondary processing date is provided.
    const zipFileData: ZipFileData = getObjectResult.LastModified
      ? {
          timeStamp: getObjectResult.LastModified.toISOString(),
          timeStampType: 'zipLastModified',
          fileName: fileBaseName,
        }
      : {
          timeStamp: new Date().toISOString(),
          timeStampType: 'zipProcessed',
          fileName: fileBaseName,
        };

    const readStream = getObjectResult.Body as Readable;
    const ZIP_FILE_ON_DISK_PATH = '/tmp/file.zip';
    const writeStream = fs.createWriteStream(ZIP_FILE_ON_DISK_PATH);
    writeStream.on('error', (err: unknown) => {
      throw err;
    });
    writeStream.on('finish', () => {
      processZipFile({
        filePath: ZIP_FILE_ON_DISK_PATH,
        targetBucket,
        s3,
        s3KeyPrefix: keyWithoutSuffix,
        zipFileData,
      })
        .then(data => {
          const { entries, streamError } = data;
          // TODO: Temporary logging
          log.debug(logMessages['resultMessage'](entries));
          if (streamError) {
            // The process succeeded possibly partially. Currently only logs error, does not throw.
            // TODO: Temporary logging
            log.error(logMessages['streamErrorMessage'](streamError));
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
    log.error(err);
    // TODO: Possible recovery actions apart from logging
  }
}
