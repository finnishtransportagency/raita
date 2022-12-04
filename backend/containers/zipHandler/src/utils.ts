import { S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { PassThrough } from 'stream';
import mime from 'mime-types';
import { EntryRecord, ExtractEntriesResult, ZipFileData } from './types';
import {
  RAITA_DATA_VIDEO_FOLDERS,
  RAITA_DATA_VIDEO_SUFFIXES,
  RaitaSourceSystem,
  raitaSourceSystems,
} from './constants';

// Duplicates BEGIN: Functions duplicating logic from main code base
export const getKeyConstituents = (key: string) => {
  const path = key.split('/');
  const fileName = path[path.length - 1];
  const [fileBaseName, fileSuffix] = fileName.split('.');
  const [keyWithoutSuffix] = key.split('.');
  return { path, fileName, fileBaseName, fileSuffix, keyWithoutSuffix };
};

export const decodeS3EventPropertyString = (s: string) => s.replace(/\+/g, ' ');

export function isRaitaSourceSystem(arg: string): arg is RaitaSourceSystem {
  return Object.values(raitaSourceSystems).includes(arg as RaitaSourceSystem);
}
// Duplicates END

/**
 * Resolves all entries and returns entries organised into
 * success and failure arrays
 */
export const resolveEntries = async (entries: Array<Promise<EntryRecord>>) => {
  const data = await Promise.all(entries);
  return data.reduce(
    (acc, cur) => {
      acc[cur.status].push(cur);
      return acc;
    },
    { success: [], error: [] } as ExtractEntriesResult['entries'],
  );
};

/**
 * Determines the mime type based on file suffix.
 */
export const uploadToS3 = ({
  targetBucket,
  key,
  s3,
  zipFileData,
}: {
  targetBucket: string;
  key: string;
  s3: S3;
  zipFileData: ZipFileData;
}) => {
  const { fileName } = getKeyConstituents(key);
  const passThrough = new PassThrough();
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: targetBucket,
      Key: key,
      Body: passThrough,
      ContentType: mime.lookup(fileName) || undefined,
      Tagging: `ZipTimeStamp=${zipFileData.timeStamp}&ZipTimeStampType=${zipFileData.timeStampType}&ZipFileName=${zipFileData.fileName}`,
    },
  });
  return {
    writeStream: passThrough,
    uploadPromise: upload.done(),
  };
};

const compressedSize = (entries: ExtractEntriesResult['entries']) =>
  entries.success.reduce((acc, cur) => acc + cur.compressedSize, 0);

/**
 * Return true is the file is detected as video file
 */
export const isRaitaVideoFile = (fileName: string) => {
  const { path, fileSuffix } = getKeyConstituents(fileName);
  return (
    RAITA_DATA_VIDEO_SUFFIXES.some(suffix => suffix === fileSuffix) ||
    RAITA_DATA_VIDEO_FOLDERS.some(folder => path.includes(folder))
  );
};

export const logMessages = {
  resultMessage: (entries: ExtractEntriesResult['entries']) =>
    `${
      entries.success.length
    } files succesfully extracted from zip. Total compressed size of extracted files ${compressedSize(
      entries,
    )}. ${entries.error.length} files failed in the process ${entries.error
      .map(entry => `${entry.fileName}: ${entry.errorDescription}`)
      .join(', ')} `,
  streamErrorMessage: (streamError: unknown) =>
    `ERROR: Zip extraction did not succeed until end, extraction failed due to zip error: ${streamError}`,
};

export class RaitaZipError extends Error {
  static raitaZipErrorMessages = {
    incorrectSuffix: 'Non zip file detected (based on file suffix).',
    incorrectPath:
      'Zip file path does not meet expected stucture: \
    System / Year / Campaign / Date / File name \
    where System is one of the following: Meeri, Emma, Elli',
  } as const;

  constructor(zipError: keyof typeof RaitaZipError['raitaZipErrorMessages']) {
    const message = RaitaZipError.raitaZipErrorMessages[zipError];
    super(message);
  }
}
