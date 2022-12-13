import { IExtractionSpec, ParseValueResult } from '../../../types';
import { isSubmissionReport, KeyData } from '../../utils';
import { logParsingException } from '../../../utils/logger';
import { parsePrimitive } from './parsePrimitives';

/**
 * Extract meta data from the file path
 */
export const extractPathData = (
  keyData: KeyData,
  folderLabels: IExtractionSpec['folderTreeExtractionSpec'],
) => {
  const { path, fileSuffix, fileBaseName } = keyData;
  // Submission Report Excel files are located higher in the hierarchy than other files which always are at the lowest level,
  // as quick and dirty solution expectedPathLength for these Excel files is hard coded to 5 which corresponds to their location.
  // This is a rough implementation which can be replaced with more sofisticated one as the needs for
  // path data parsing come more clear (is is enough to configure this based on file suffix or if more detailed configration is needed),
  // more robust solution should be built on modifying the structure in extractionSpec parsing instructions. See Jira 242.
  const expectedPathLength = isSubmissionReport({ fileBaseName, fileSuffix })
    ? 5
    : Object.keys(folderLabels).length;
  if (path.length !== expectedPathLength) {
    logParsingException.warn(
      `Unexpected folder path length ${path.length} for path ${path}, expected ${expectedPathLength}. Folder path analysis not carried out`,
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
