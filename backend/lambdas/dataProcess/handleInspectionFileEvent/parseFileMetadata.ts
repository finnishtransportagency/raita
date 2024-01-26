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
}): Promise<{ metadata: ParseValueResult; hash: string; errors: boolean }> {
  let errorsFound = false;
  let fileNameData: any = {};
  try {
    fileNameData = extractFileNameData(
      keyData,
      spec.fileNameExtractionSpec,
      spec.knownExceptions.fileNameExtractionSpec,
    );
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
  try {
    if (file.fileStream) {
      const contentResult = await parseFileContent(
        spec,
        keyData,
        file.fileStream,
      );
      fileContentData = contentResult.contentData;
      hash = contentResult.hash;
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
  const generatedMetadata = generateMetadata();
  return {
    metadata: {
      ...pathData,
      ...fileContentData,
      ...fileNameData,
      ...generatedMetadata,
    },
    hash,
    errors: errorsFound,
  };
}

/**
 * For any metadata that is generated rather than parsed from file
 */
function generateMetadata() {
  return {
    parsed_at_datetime: new Date().toISOString(),
  };
}
