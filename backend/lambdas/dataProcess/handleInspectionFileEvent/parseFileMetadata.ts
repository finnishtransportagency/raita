import {
  IExtractionSpec,
  IFileStreamResult,
  ParseValueResult,
} from '../../../types';
import { log, logParsingException } from '../../../utils/logger';
import { KeyData, RaitaParseError } from '../../utils';
import { parseFileContent } from './contentDataParser';
import { extractFileNameData } from './fileNameDataParser';
import { extractPathData } from './pathDataParser';

export async function parseFileMetadata({
  keyData,
  file,
  spec,
}: {
  keyData: KeyData;
  file: IFileStreamResult;
  spec: IExtractionSpec;
}): Promise<{ metadata: ParseValueResult; hash: string; errors: boolean; reportId: number; }> {
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
  let hash = '';
  let reportId: number = -1;
  try {
    if (file.fileStream) {
      const contentResult = await parseFileContent(
        spec,
        keyData,
        file.fileStream,
      );
      fileContentData = contentResult.contentData;
      hash = contentResult.hash;
      reportId = contentResult.reportId;
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


  log.info("HELLO pathData");
  log.info(pathData);


  log.info("HELLO fileContentData");
  log.info(fileContentData);


  log.info("HELLO fileNameData");
  log.info(fileNameData);


  log.info("HELLO generatedMetadata");
  log.info(generatedMetadata);


  log.info("HELLO allMetadata");
  log.info(allMetadata);

  // find any key that is marked at non parsed
  const nonParsedKeys = Object.keys(allMetadata).filter(key =>
    key.match(/^nonparsed_/),
  );
  if (nonParsedKeys.length) {
    errorsFound = true;
  }
  return {
    metadata: allMetadata,
    hash,
    errors: errorsFound,
    reportId,
  };
}

/**
 * For any metadata that is generated rather than parsed from file
 */
export function generateMetadata(spec: IExtractionSpec) {
  return {
    parser_version: spec.parserVersion,
    parsed_at_datetime: new Date().toISOString(),
  };
}
