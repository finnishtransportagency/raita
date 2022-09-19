import { ParseValueResult } from '../types';
import { logger } from '../utils/logger';

/**
 * Extract meta data from the file path
 */
export const extractPathData = (
  path: Array<string>,
  folderLabels: Record<string, string>,
) => {
  // Exclude the filename
  const folderNames = path.slice(0, -1);
  // If validation becomes more complex, extract into validation function
  if (folderNames.length < 6 || folderNames.length > 7) {
    logger.log(
      'Unexpected folder path length. Folder path analysis not carried out.',
    );
    return {};
  }
  return folderNames.reduce<ParseValueResult>((acc, cur, index) => {
    // Line below relies on implicit casting number --> string. Note: Index is zero based, keys in dict start from 1
    const keyLabel = folderLabels[index + 1];
    if (keyLabel) {
      acc[keyLabel] = cur;
    }
    return acc;
  }, {});
};
