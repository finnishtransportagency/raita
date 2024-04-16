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
import { parsePrimitiveWithSubstitution } from './parsePrimitives';
import {log} from "../../../utils/logger";

export const parseFileNameParts = (
  labels: IExtractionSpecLabels,
  fileBaseNameParts: Array<string>,
  substituteValues: IExtractionSpec['knownExceptions']['substituteValues'],
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
      const { key, value } = parsePrimitiveWithSubstitution(
        name,
        cur,
        parseAs,
        substituteValues,
      );
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
  substituteValues: IExtractionSpec['knownExceptions']['substituteValues'],
) => {
  // Only process two first segments of file name, ignore others
  return parseFileNameParts(
    labels,
    fileBaseNameParts.slice(0, 2),
    substituteValues,
  );
};

const parseGenericFileNameData = (
  fileName: string,
  labels: IExtractionSpecLabels,
  fileBaseNameParts: Array<string>,
  substituteValues: IExtractionSpec['knownExceptions']['substituteValues'],
) => {
  validateGenericFileNameStructureOrFail(fileName, labels, fileBaseNameParts);
  return parseFileNameParts(labels, fileBaseNameParts, substituteValues);
};

/**
 * Return meta or throw on parsing error
 */
export const extractFileNameData = (
  keyData: KeyData,
  spec: IExtractionSpec,
) => {
  console.log("HELLO1 ");
  console.log(keyData);
  console.log(spec);
  const fileNamePartLabels = spec.fileNameExtractionSpec;
  const fileNameExceptions = spec.knownExceptions.fileNameExtractionSpec;
  const removePrefix = fileNameExceptions.removePrefix;
  const substituteValues = spec.knownExceptions.substituteValues;
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
  // if a prefix listed in removePrefix is found, remove it from filename before further parsing
  let strippedFileName = fileBaseName;
  if (removePrefix) {
    // assume only one prefix can match
    const foundPrefix = removePrefix.find(prefix =>
      fileBaseName.match(new RegExp(`^${removePrefix}`)),
    );
    if (foundPrefix) {
      strippedFileName = fileBaseName.slice(foundPrefix.length);
    }
  }

  // File name segments are separated by underscore
  let fileBaseNameParts = strippedFileName.split('_');
  // Underscore is used as a separator for data fields in name. Check for and handle any known values containing underscore
  let foundWithUnderscore: { value: string; name: string } | undefined =
    undefined;
  if (
    fileNameExceptions &&
    fileNameExceptions.containsUnderscore &&
    fileNameExceptions.containsUnderscore.length
  ) {
    foundWithUnderscore = fileNameExceptions.containsUnderscore.find(
      exception => strippedFileName.includes(exception.value),
    );
    if (foundWithUnderscore) {
      const [before, after] = strippedFileName.split(foundWithUnderscore.value);
      const valuesBefore = before.split('_').filter(v => v.length);
      const valuesAfter = after.split('_').filter(v => v.length);
      fileBaseNameParts = [
        ...valuesBefore,
        foundWithUnderscore.value,
        ...valuesAfter,
      ];
    }
  }
  // Get labels based on the file suffix from extractionSpec
  const labelsList = fileNamePartLabels[fileSuffix];
  // try different possible specs
  for (let i = 0; i < labelsList.length; i++) {
    const labels = labelsList[i];
    try {
      // try parsing and return immediately if successful
      // Submission Report Excel file name parsing is special case, some name segments need to be ignored
      const fileNameMetadata = isSubmissionReport({
        fileBaseName: strippedFileName,
        fileSuffix,
      })
        ? parseSubmissionReportExcelFileNameData(
            labels,
            fileBaseNameParts,
            substituteValues,
          )
        : parseGenericFileNameData(
            fileName,
            labels,
            fileBaseNameParts,
            substituteValues,
          );
      if (
        foundWithUnderscore &&
        fileNameMetadata[foundWithUnderscore.name] !== foundWithUnderscore.value
      ) {
        // underscore value found in the wrong place
        throw new RaitaParseError(
          `Found known value with underscore ${foundWithUnderscore.value} in the wrong slot`,
          'VALUE_IN_WRONG_SLOT',
        );
      }
      log.info("HELLO " + fileNameMetadata);
      log.info(fileNameMetadata);

      return {
        file_type: fileSuffix,
        ...fileNameMetadata,
      };
    } catch (error) {
      // filename did not match spec, try next
      continue;
    }
  }
  // no spec matched
  const expectedLengths = labelsList
    .map(labels => Object.keys(labels).length)
    .join(', ');
  throw new RaitaParseError(
    `Number of filename segments did not match any parsing spec. Amount of segments received: ${fileBaseNameParts.length} but expected one of: ${expectedLengths}`,
    'WRONG_NUMBER_OF_FILE_NAME_SEGMENTS',
  );
};
