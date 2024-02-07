import { createHash } from 'crypto';
import { PassThrough, Readable } from 'stream';
import cloneable from 'cloneable-readable';
import {
  IColonSeparatedKeyValuePairDefinition,
  IExtractionSpec,
} from '../../../types';
import { ParseValueResult } from '../../../types';
import { parsePrimitive } from './parsePrimitives';
import { regexCapturePatterns } from './regex';
import { fileSuffixesToIncludeInMetadataParsing } from '../../../../constants';
import { KeyData, RaitaParseError } from '../../utils';
import { log } from '../../../utils/logger';
import { parseCSVFileStream } from './csvDataParser/csvDataParser';

/**
 * Resolves whether content data parsing is needed for the file
 */
export const shouldParseContent = (suffix: string) =>
  suffix === fileSuffixesToIncludeInMetadataParsing.TXT_FILE;

const extractValue = (
  extractSpec: IColonSeparatedKeyValuePairDefinition,
  fileBody: string,
) => {
  const { propertyKey, pattern, parseAs } = extractSpec;
  // If more than one possible pattern, add logic here for passing
  // arguments to the function generating regex.
  const regr = regexCapturePatterns[pattern.predefinedPatternId](
    pattern.searchKey,
  );
  try {
    const res = regr.exec(fileBody);
    const val = res?.[1];
    if (val) {
      return parseAs
        ? parsePrimitive(propertyKey, val, parseAs)
        : { key: propertyKey, value: val };
    }
    return null;
  } catch (err) {
    throw new RaitaParseError(
      `Parsing failed for the term: ${propertyKey}: ${
        err instanceof Error ? err.message : err
      }`,
      'VALUE_PARSE_ERROR',
    );
  }
};

export const extractFileContentData = (
  spec: IExtractionSpec,
  fileBody: string,
) =>
  spec.fileContentExtractionSpec
    .map(extractSpecItem => extractValue(extractSpecItem, fileBody))
    .reduce<ParseValueResult>((acc, cur) => {
      if (cur) {
        acc[cur.key] = cur.value;
      }
      return acc;
    }, {});

/**
 * Read entire file to memory and parse with extractFileContentData
 */
export const extractFileContentDataFromStream = (
  spec: IExtractionSpec,
  fileStream: Readable,
): Promise<ParseValueResult> => {
  return new Promise((resolve, reject) => {
    const chunks: string[] = [];
    fileStream.setEncoding('utf8');
    fileStream.on('readable', () => {
      // read whole stream to string
      // note: dangerously assume here that file is small enough to fit to memory
      // will cause problems if files are big
      let chunk: string; // encoding set, this will be string
      while (null !== (chunk = fileStream.read())) {
        chunks.push(chunk);
      }
    });
    fileStream.on('end', () => {
      const fileBody = chunks.join('');
      resolve(extractFileContentData(spec, fileBody));
    });
  });
};

/**
 * Returns hex encoded hash calculated from a readable stream
 */
const calculateHashFromStream = (fileStream: Readable): Promise<string> => {
  const hashStream = createHash('sha256');
  fileStream.pipe(hashStream);
  return new Promise((resolve, reject) => {
    hashStream.on('readable', () => {
      const hashData = hashStream.read();
      if (hashData) {
        resolve(hashData.toString('hex'));
      } else {
        reject('Error calculating hash');
      }
    });
  });
};

export const parseFileContent = async (
  spec: IExtractionSpec,
  keyData: KeyData,
  fileStream: Readable,
): Promise<{ contentData: ParseValueResult; hash: string }> => {
  let contentPromise: Promise<ParseValueResult>;
  let csvPromise: Promise<string>;
  // Pipe the fileStream to multiple streams for consumption: hash calculation and file content parsing
  const originalStream = cloneable(fileStream);
  originalStream.pause();
  const hashPromise = calculateHashFromStream(originalStream);
  if (keyData.fileSuffix === fileSuffixesToIncludeInMetadataParsing.CSV_FILE) {
    log.info('csv parse file: ' + keyData.fileBaseName);
    const fileStreamToParse = originalStream.clone();
    csvPromise = parseCSVFileStream(
      keyData,
      fileStreamToParse,
      null,
    );
    log.info('csv parsing result: ' + csvPromise);
  } else {
    csvPromise = Promise.resolve("");
  }

  if (shouldParseContent(keyData.fileSuffix)) {
    const fileStreamToParse = originalStream.clone();
    contentPromise = extractFileContentDataFromStream(spec, fileStreamToParse);
  } else {
    contentPromise = Promise.resolve({});
  }
  originalStream.resume();
  const [hash, contentData] = await Promise.all([hashPromise, contentPromise, csvPromise]);
  return {
    contentData,
    hash,
  };
};
