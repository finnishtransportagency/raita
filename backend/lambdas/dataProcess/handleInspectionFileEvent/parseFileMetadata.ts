import { Readable } from 'stream';
import { IExtractionSpec, ParseValueResult } from '../../../types';
import { log, logParsingException } from '../../../utils/logger';
import { KeyData, RaitaParseError } from '../../utils';
import { parseFileContent } from './contentDataParser';
import { extractFileNameData } from './fileNameDataParser';
import { extractPathData } from './pathDataParser';
import { DBConnection } from '../csvCommon/db/dbUtil';

export async function parseFileMetadata({
  keyData,
  fileStream,
  spec,
  doCSVParsing,
  dbConnection,
  reportId,
  invocationId,
}: {
  keyData: KeyData;
  fileStream: Readable | undefined;
  spec: IExtractionSpec;
  doCSVParsing: boolean;
  dbConnection: DBConnection | undefined;
  reportId: number;
  invocationId: string;
}): Promise<{
  metadata: any;
  errors: boolean;
}> {
  let errorsFound = false;
  let fileNameData: any = {};
  try {
    fileNameData = extractFileNameData(keyData, spec);
  } catch (error: any) {
    errorsFound = true;
    if (error instanceof RaitaParseError) {
      logParsingException.error(
        { errorType: error.errorType, fileName: error.fileName },
        `${error.message}. File name extraction skipped.`,
      );
    } else {
      log.error(error);
    }
  }
  let pathData: any = {};
  try {
    pathData = extractPathData(keyData, spec);
  } catch (error: any) {
    errorsFound = true;
    if (error instanceof RaitaParseError) {
      logParsingException.error(
        { errorType: error.errorType, fileName: error.fileName },
        `${error.message}. Path extraction skipped.`,
      );
    } else {
      log.error(error);
    }
  }
  let fileContentData: any = {};
  try {
    if (fileStream) {
      const contentResult = await parseFileContent(
        spec,
        keyData,
        fileStream,
        dbConnection,
        doCSVParsing,
        reportId,
        invocationId,
      );
      fileContentData = contentResult.contentData;
    } else {
      throw new RaitaParseError(
        'No fileStream',
        'FILE_READ_ERROR',
        keyData.fileName,
      );
    }
  } catch (error: any) {
    errorsFound = true;
    if (error instanceof RaitaParseError) {
      logParsingException.error(
        { errorType: error.errorType, fileName: error.fileName },
        `${error.message}. File content extraction skipped.`,
      );
    } else {
      log.error(error);
    }
  }
  const generatedMetadata = generateMetadata(spec);
  const allMetadata = {
    ...pathData,
    ...fileContentData,
    ...fileNameData,
    ...generatedMetadata,
  };

  // find any key that is marked at non parsed
  const nonParsedKeys = Object.keys(allMetadata).filter(key =>
    key.match(/^nonparsed_/),
  );
  if (nonParsedKeys.length) {
    errorsFound = true;
  }
  return {
    metadata: allMetadata,
    errors: errorsFound,
  };
}

/**
 * For any metadata that is generated rather than parsed from file
 */
export function generateMetadata(spec: IExtractionSpec) {
  const now = new Date().toISOString();
  return {
    parser_version: spec.parserVersion,
    parsed_at_datetime: now,
    metadata_changed_at_datetime: now,
  };
}
