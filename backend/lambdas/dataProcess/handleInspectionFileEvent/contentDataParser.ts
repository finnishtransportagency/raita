import { createHash } from 'crypto';
import { PassThrough, Readable } from 'stream';
import cloneable from 'cloneable-readable';
import {
  IColonSeparatedKeyValuePairDefinition,
  IExtractionSpec,
} from '../../../types';
import { ParseValueResult } from '../../../types';
import { parsePrimitiveWithSubstitution } from './parsePrimitives';
import { regexCapturePatterns } from './regex';
import {
  ENVIRONMENTS,
  fileSuffixesToIncludeInMetadataParsing,
} from '../../../../constants';
import { KeyData } from '../../utils';
import { log } from '../../../utils/logger';
import { chopCSVFileStream } from './csvDataChopper/csvDataChopper';
import { DBConnection } from '../csvCommon/db/dbUtil';

/**
 * Resolves whether content data parsing is needed for the file
 */
export const shouldParseContent = (suffix: string) =>
  suffix === fileSuffixesToIncludeInMetadataParsing.TXT_FILE;

const extractValue = (
  extractSpec: IColonSeparatedKeyValuePairDefinition,
  fileBody: string,
  substituteValues: IExtractionSpec['knownExceptions']['substituteValues'],
) => {
  const { propertyKey, pattern, parseAs } = extractSpec;
  // If more than one possible pattern, add logic here for passing
  // arguments to the function generating regex.
  const regr = regexCapturePatterns[pattern.predefinedPatternId](
    pattern.searchKey,
  );
  try {
    const res = regr.exec(fileBody);
    if (!res) {
      return null;
    }
    const found = res[0];
    const val = res[1];
    if (found) {
      return parsePrimitiveWithSubstitution(
        propertyKey,
        val,
        parseAs,
        substituteValues,
      );
    }
    return null;
  } catch (error: any) {
    log.error(error);
    return null;
  }
};

export const extractFileContentData = (
  spec: IExtractionSpec,
  fileBody: string,
) =>
  spec.fileContentExtractionSpec
    .map(extractSpecItem =>
      extractValue(
        extractSpecItem,
        fileBody,
        spec.knownExceptions.substituteValues,
      ),
    )
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

export const parseFileContent = async (
  spec: IExtractionSpec,
  keyData: KeyData,
  fileStream: Readable,
  dbConnection: DBConnection | undefined,
  doCSVParsing: boolean,
  reportId: number,
): Promise<{
  contentData: ParseValueResult;
}> => {
  let contentPromise: Promise<ParseValueResult>;
  let csvPromise: Promise<boolean | undefined>;
  // Pipe the fileStream to multiple streams for consumption: hash calculation and file content parsing
  const originalStream = cloneable(fileStream);
  originalStream.pause();
  if (doCSVParsing) {
    if (
      keyData.fileSuffix === fileSuffixesToIncludeInMetadataParsing.CSV_FILE
    ) {
      log.info('chop csv file: ' + keyData.fileBaseName);
      const fileStreamToParse = originalStream.clone();
      if (dbConnection) {
        csvPromise = chopCSVFileStream(
          keyData,
          fileStreamToParse,
          dbConnection,
          reportId,
        );
        log.info('csv parsing result: ' + csvPromise);
      } else {
        log.error(
          'content parsing with called csv enabled and without dbconnection',
        );
        csvPromise = Promise.resolve(undefined);
      }
    } else {
      csvPromise = Promise.resolve(undefined);
    }
  } else {
    log.warn('CSV parsing blocked in prod');
    csvPromise = Promise.resolve(undefined);
  }

  if (shouldParseContent(keyData.fileSuffix)) {
    const fileStreamToParse = originalStream.clone();
    contentPromise = extractFileContentDataFromStream(spec, fileStreamToParse);
  } else {
    contentPromise = Promise.resolve({});
  }
  originalStream.resume();
  const [contentData, csvSuccess] = await Promise.all([
    contentPromise,
    csvPromise,
  ]);
  return {
    contentData,
  };
};
