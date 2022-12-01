import { IExtractionSpec, ParseValueResult } from '../../../types';
import { log, logParsingException } from '../../../utils/logger';
import { RaitaParseError } from '../../utils';
import { parsePrimitive } from './parsePrimitives';

// TODO: Remove this typeguard by improving types
function suffixIsKnown(arg: string): arg is 'csv' | 'txt' | 'pdf' {
  return ['pdf', 'txt', 'csv'].includes(arg);
}

const EMPTY_FILE_INDICATOR = 'EMPTY';

export const extractFileNameData = (
  fileName: string,
  fileNamePartLabels: IExtractionSpec['fileNameExtractionSpec'],
) => {
  try {
    const fileNameParts = fileName.split('.');
    if (fileNameParts.length !== 2) {
      throw new RaitaParseError(`Unexpected file name structure: ${fileName}`);
    }
    const [baseName, suffix] = fileNameParts;
    if (!suffixIsKnown(suffix)) {
      throw new RaitaParseError(`Unexpected suffix in file name: ${fileName}`);
    }
    const labels = fileNamePartLabels[suffix];
    const fileBaseNameParts = baseName.split('_');
    const lastFileBaseNamePart =
      fileBaseNameParts[fileBaseNameParts.length - 1];
    const labelCount = Object.keys(labels).length;
    // The file name may have empty file indicator in the end, increasing expected
    // part count by one
    const expectedFileNamePartCount =
      lastFileBaseNamePart === EMPTY_FILE_INDICATOR
        ? labelCount + 1
        : labelCount;
    if (fileBaseNameParts.length !== expectedFileNamePartCount) {
      throw new RaitaParseError(
        `Unexpected number of file name segments in ${fileName}. Expected ${expectedFileNamePartCount}, received ${fileBaseNameParts.length}.`,
      );
    }
    const specBasedMetadata = fileBaseNameParts.reduce<ParseValueResult>(
      (acc, cur, index) => {
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
      },
      {},
    );
    return {
      file_type: suffix,
      ...specBasedMetadata,
    };
  } catch (error) {
    // Currently just log file name parsing errors.
    if (error instanceof RaitaParseError) {
      logParsingException.warn(
        `${error.message}. File name extraction skipped.`,
      );
      return {};
    }
    log.error(error);
    throw error;
  }
};
