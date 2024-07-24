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
import { IAdminLogger, PostgresLogger } from './adminLog/postgresLogger';

const adminLogger: IAdminLogger = new PostgresLogger();

start();

async function start() {
  const { bucket, key, targetBucket } = getConfig();
  const startMessage = `Zip extraction from bucket: ${bucket} to ${targetBucket} started for ${key}`;
  // TODO: Temporary logging
  log.info(startMessage);
  try {
    const zipKey = decodeS3EventPropertyString(key);
    const { path, keyWithoutSuffix, fileSuffix, fileName } = getKeyData(zipKey);
    const invocationId = zipKey;
    await adminLogger.init('data-reception', invocationId);
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
    const fileMetadata = getObjectResult.Metadata ?? {};
    // pass on relevant metadata fields from zip file to extracted files
    const newFileMetadata: { [key: string]: string } = {};
    if (fileMetadata['skip-hash-check']) {
      newFileMetadata['skip-hash-check'] = fileMetadata['skip-hash-check'];
    }
    if (fileMetadata['require-newer-parser-version']) {
      newFileMetadata['require-newer-parser-version'] =
        fileMetadata['require-newer-parser-version'];
    }
    newFileMetadata['invocation-id'] = encodeURIComponent(invocationId); // pass same invocationId to extracted files for logging
    // Timestamp is needed to tie the extracted files and meta data entries into the zip
    // file they were extracted from. The LastModified here should always equal to the moment
    // when zip was uploaded to the S3 bucket. As a backup, a secondary processing date is provided.
    const zipFileData: ZipFileData = getObjectResult.LastModified
      ? {
          timeStamp: getObjectResult.LastModified.toISOString(),
          timeStampType: 'zipLastModified',
          fileName,
          metadata: newFileMetadata,
        }
      : {
          timeStamp: new Date().toISOString(),
          timeStampType: 'zipProcessed',
          fileName,
          metadata: newFileMetadata,
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
        .then(async data => {
          const { entries, streamError } = data;
          // TODO: Temporary logging
          log.info(logMessages['resultMessage'](entries));
          if (streamError) {
            // The process succeeded possibly partially. Currently only logs error, does not throw.
            // TODO: Temporary logging
            log.error(logMessages['streamErrorMessage'](streamError));
            await adminLogger.error('Tiedostojen purkamisessa tapahtui virhe');
          }
          if (entries.error.length) {
            log.error(entries.error);
          }
          const totalCount =
            entries.success.length +
            entries.skipped.length +
            entries.error.length;
          let logMessage = `Tiedostoja yhteensä: ${totalCount}`;
          if (entries.success.length) {
            logMessage += `\nPurettu onnistuneesti: ${entries.success.length}`;
          }
          if (entries.skipped.length) {
            logMessage += `\nPurkaminen ohitettu: ${entries.skipped.length}`;
          }
          if (entries.error.length) {
            logMessage += `\nVirhe purkamisessa: ${entries.error.length}`;
          }
          if (entries.error.length) {
            await adminLogger.error(logMessage);
          } else {
            await adminLogger.info(logMessage);
          }
          if (
            entries.skipped.length &&
            !entries.success.length &&
            !entries.error.length
            // all files skipped
          ) {
            await adminLogger.init('data-inspection', invocationId);
            // add one inspection message to show that no files were parsed on purpose
            await adminLogger.warn(
              'Kaikki tiedostot ohitettu, ei käsiteltävää',
            );
          }
          // exit forcefully because sometimes the process would not exit. TODO: find out why
          log.info('exiting');
          process.exit(0);
        })
        .catch(err => {
          // Catches zip opening errors
          throw err;
        });
    });
    readStream.pipe(writeStream);
  } catch (err: any) {
    // TODO: Temporary logging
    await adminLogger.error('Tiedostojen purkamisessa tapahtui virhe');
    log.error(err);
    // TODO: Possible recovery actions apart from logging
  }
}
