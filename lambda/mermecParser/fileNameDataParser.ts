import { IExtractionSpec, ParseValueResult } from '../types';
import { logger } from '../utils/logger';
import { parsePrimitive } from '../utils/parsePrimitives';

export const extractFileNameData = (
  fileName: string,
  fileNamePartLabels: IExtractionSpec['fileNameExtractionSpec'],
) => {
  const [baseName, suffix] = fileName.split('.');
  // Validations to separate function...
  // Note: Would be safer to analyze the length but this should suffice.
  if (!baseName || !suffix || !['csv', 'txt'].includes(suffix)) {
    logger.log(
      'Unexpected file name structure. File name analysis not carried out.',
    );
    return {};
  }
  if (!(suffix === 'csv' || suffix === 'txt')) {
    logger.log('Unexpected file suffix. File name analysis not carried out.');
    return {};
  }
  return baseName.split('_').reduce<ParseValueResult>((acc, cur, index) => {
    // Line below relies on implicit casting number --> string. Note: Index is zero based, keys in dict start from 1
    const { name, parseAs } = fileNamePartLabels[suffix][index + 1];
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
