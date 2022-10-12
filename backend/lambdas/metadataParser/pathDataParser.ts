import { IExtractionSpec, ParseValueResult } from '../../types';
import { logger } from '../../utils/logger';
import { parsePrimitive } from './parsePrimitives';

/**
 * Extract meta data from the file path
 */
export const extractPathData = (
  path: Array<string>,
  folderLabels: IExtractionSpec['folderTreeExtractionSpec'],
) => {
  const expectedPathLength = Object.keys(folderLabels).length;
  if (path.length !== expectedPathLength) {
    logger.logParsingException(
      `Unexpected folder path length for path ${path}. Folder path analysis not carried out`,
    );
    return {};
  }
  // Exclude the filename
  const folderNames = path.slice(0, -1);
  // TODO: Duplicates now implementation for file name parsing
  return folderNames.reduce<ParseValueResult>((acc, cur, index) => {
    // Line below relies on implicit casting number --> string. Note: Index is zero based, keys in dict start from 1
    const { name, parseAs } = folderLabels[index + 1];
    if (name) {
      const { key, value } = parseAs
        ? parsePrimitive(name, cur, parseAs)
        : { key: name, value: cur };
      acc[key] = value;
    }
    return acc;
  }, {});
};
