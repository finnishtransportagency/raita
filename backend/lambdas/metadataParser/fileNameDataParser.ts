import { IExtractionSpec, ParseValueResult } from '../../types';
import { logger } from '../../utils/logger';
import { parsePrimitive } from './parsePrimitives';

// TODO: Remove this typeguard by improving types
function suffixIsKnown (arg: string): arg is 'csv'|'txt'|'pdf' {
  return [ 'pdf', 'txt', 'csv'].includes(arg)
}

export const extractFileNameData = (
  fileName: string,
  fileNamePartLabels: IExtractionSpec['fileNameExtractionSpec'],
) => {
  const fileNameParts = fileName.split('.');
  if (fileNameParts.length !== 2) {
    logger.logParsingException(`Unexpected filename: ${fileName}`);
    return {};
  }
  const [baseName, suffix] = fileNameParts;

  // TODO: Improve typing by removing casting
  const knownSuffixes = Object.keys(fileNamePartLabels) as ;

  if (!suffixIsKnown(suffix)) {
    logger.logParsingException(`Unexpected suffix in file: ${fileName}`);
    return {};
  }

  const labels = fileNamePartLabels[suffix];

  const fileBaseNameParts = baseName.split('_')
  const expectedFileNameLength = Object.keys(labels).length

  if (fileBaseNameParts.length !== expectedFileNameLength) {
    logger.logParsingException(
      `Unexpected number of parts in file name. Expected ${expectedFileNameLength} but got ${fileBaseNameParts.length} for file ${fileName}. File name analysis not carried out.`,
    );
    return {};
  }
  return fileBaseNameParts.reduce<ParseValueResult>((acc, cur, index) => {
    // Line below relies on implicit casting number --> string. Note: Index is zero based, keys in dict start from 1
    const { name, parseAs } = labels[index + 1];
    if (name) {
      const { key, value } = parseAs
        ? parsePrimitive(name, cur, parseAs)
        : { key: name, value: cur };
      // TODO: AWS has replaced spaces in folder names with + character. To decide whether these should be
      // replaced back to spaces.
      acc[key] = value;
    }
    return acc;
  }, {});
};
