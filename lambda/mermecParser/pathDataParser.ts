import { IExtractionSpec, ParseValueResult } from '../types';
import { logger } from '../utils/logger';
import { parsePrimitive } from '../utils/parsePrimitives';

/**
 * Extract meta data from the file path
 */
export const extractPathData = (
  path: Array<string>,
  folderLabels: IExtractionSpec['folderTreeExtractionSpec'],
) => {
  // Exclude the filename
  const folderNames = path.slice(0, -1);
  // If validation becomes more complex, extract into validation function
  // TODO: Temporary check for the path parts, update for real setup
  if (folderNames.length < 6 || folderNames.length > 7) {
    logger.log(
      'Unexpected folder path length. Folder path analysis not carried out.',
    );
    return {};
  }

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
