import { EMPTY_FILE_INDICATOR } from '../../../../constants';
import {
  IExtractionSpec,
  IExtractionSpecLabels,
  ParseValueResult,
} from '../../../types';
import {
  isKnownSuffix,
  isSubmissionReport,
  KeyData,
  RaitaParseError,
} from '../../utils';
import { log, logParsingException } from '../../../utils/logger';
import { parsePrimitive } from './parsePrimitives';

export const parseFileNameParts = (
  labels: IExtractionSpecLabels,
  fileBaseNameParts: Array<string>,
) =>
  fileBaseNameParts.reduce<ParseValueResult>((acc, cur, index) => {
    // Handle the empty file indicator as special case.
    // Implementation depends on this incicator being in the end of the string.
    if (cur === EMPTY_FILE_INDICATOR) {
      acc['isEmpty'] = true;
      return acc;
    }
    // Line below relies on implicit casting number --> string. Note: Index is zero based, keys in dict start from 1
    const { name, parseAs } = labels[index + 1];
    if (name) {
      const { key, value } = parseAs
        ? parsePrimitive(name, cur, parseAs)
        : { key: name, value: cur };
      acc[key] = value;
    }
    return acc;
  }, {});

export const validateGenericFileNameStructureOrFail = (
  fileName: string,
  labels: IExtractionSpecLabels,
  fileBaseNameParts: Array<string>,
) => {
  const lastFileBaseNamePart = fileBaseNameParts[fileBaseNameParts.length - 1];
  const labelCount = Object.keys(labels).length;
  // The file name may have empty file indicator in the end, increasing expected
  // part count by one
  const expectedFileNamePartCount =
    lastFileBaseNamePart === EMPTY_FILE_INDICATOR ? labelCount + 1 : labelCount;
  if (fileBaseNameParts.length !== expectedFileNamePartCount) {
    throw new RaitaParseError(
      `Unexpected number of file name segments in ${fileName}. Expected ${expectedFileNamePartCount}, received ${fileBaseNameParts.length}.`,
      'WRONG_NUMBER_OF_FILE_NAME_SEGMENTS',
      fileName,
    );
  }
};

const parseSubmissionReportExcelFileNameData = (
  labels: IExtractionSpecLabels,
  fileBaseNameParts: Array<string>,
) => {
  // Only process two first segments of file name, ignore others
  return parseFileNameParts(labels, fileBaseNameParts.slice(0, 2));
};

const parseGenericFileNameData = (
  fileName: string,
  labels: IExtractionSpecLabels,
  fileBaseNameParts: Array<string>,
) => {
  validateGenericFileNameStructureOrFail(fileName, labels, fileBaseNameParts);
  return parseFileNameParts(labels, fileBaseNameParts);
};

export const extractFileNameData = (
  keyData: KeyData,
  fileNamePartLabels: IExtractionSpec['fileNameExtractionSpec'],
) => {
  try {
    const { fileName, fileBaseName, fileSuffix } = keyData;
    if (!fileBaseName || !fileSuffix) {
      throw new RaitaParseError(
        `Unexpected file name structure: ${fileName}`,
        'WRONG_FILE_NAME_STRUCTURE',
        fileName,
      );
    }
    if (!isKnownSuffix(fileSuffix)) {
      throw new RaitaParseError(
        `Unexpected suffix in file name: ${fileName}`,
        'WRONG_FILE_TYPE',
        fileName,
      );
    }
    // File name segments are separated by underscore
    const fileBaseNameParts = fileBaseName.split('_');
    // Get labels based on the file suffix from extractionSpec
    const labels = fileNamePartLabels[fileSuffix];
    // Submission Report Excel file name parsing is special case, some name segments need to be ignored
    const fileNameMetadata = isSubmissionReport({ fileBaseName, fileSuffix })
      ? parseSubmissionReportExcelFileNameData(labels, fileBaseNameParts)
      : parseGenericFileNameData(fileName, labels, fileBaseNameParts);
    return {
      file_type: fileSuffix,
      ...fileNameMetadata,
    };
  } catch (error) {
    // Currently just log file name parsing errors.
    if (error instanceof RaitaParseError) {
      logParsingException.warn(
        { errorType: error.errorType, fileName: error.fileName },
        `${error.message}. File name extraction skipped.`,
      );
      return {};
    }
    log.error(error);
    throw error;
  }
};
