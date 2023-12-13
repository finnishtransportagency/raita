import { IExtractionSpec, IFileResult, ParseValueResult } from '../../../types';
import { log, logParsingException } from '../../../utils/logger';
import { KeyData, RaitaParseError } from '../../utils';
import {
  calculateHash,
  extractFileContentData,
  shouldParseContent,
} from './contentDataParser';
import { extractFileNameData } from './fileNameDataParser';
import { extractPathData } from './pathDataParser';

export async function parseFileMetadata({
  keyData,
  file,
  spec,
}: {
  keyData: KeyData;
  file: IFileResult;
  spec: IExtractionSpec;
}): Promise<{ metadata: ParseValueResult; hash: string; errors: boolean }> {
  const { fileBody } = file;
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
  try {
    fileContentData =
      shouldParseContent(keyData.fileSuffix) && fileBody
        ? extractFileContentData(spec, fileBody)
        : {};
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
  const hash = calculateHash(fileBody ?? '');
  return {
    metadata: {
      ...pathData,
      ...fileContentData,
      ...fileNameData,
    },
    hash,
    errors: errorsFound,
  };
}
