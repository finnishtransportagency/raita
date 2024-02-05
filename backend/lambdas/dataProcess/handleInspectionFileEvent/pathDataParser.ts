import { IExtractionSpec, ParseValueResult } from '../../../types';
import { isSubmissionReport, KeyData, RaitaParseError } from '../../utils';
import { parsePrimitiveWithSubstitution } from './parsePrimitives';

/**
 * Extract meta data from the file path
 */
export const extractPathData = (keyData: KeyData, spec: IExtractionSpec) => {
  const { path } = keyData;
  // For now, we have to offer support for both folder structures: Virtual run, and the old way.
  const folderParsingSpec = determineParsingSpec(keyData, spec);
  if (!folderParsingSpec) {
    throw new RaitaParseError(
      `Unexpected folder path length ${path.length} for path ${path}. Folder path analysis not carried out`,
      'WRONG_FOLDER_PATH_LENGTH',
      keyData.fileName,
    );
  }
  // Exclude the filename
  const folderNames = path.slice(0, -1);
  // TODO: Duplicates now implementation for file name parsing
  return folderNames.reduce<ParseValueResult>((acc, cur, index) => {
    // Line below relies on implicit casting number --> string. Note: Index is zero based, keys in dict start from 1
    const { name, parseAs } = folderParsingSpec[index + 1];
    if (name) {
      const { key, value } = parsePrimitiveWithSubstitution(
        name,
        cur,
        parseAs,
        spec.knownExceptions.substituteValues,
      );
      acc[key] = value;
    }
    return acc;
  }, {});
};

// Submission Report Excel files are located higher in the hierarchy than other files which always are at the lowest level,
// as quick and dirty solution expectedPathLength for these Excel files is hard coded to 5 which corresponds to their location.
// This is a rough implementation which can be replaced with more sofisticated one as the needs for
// path data parsing come more clear (is is enough to configure this based on file suffix or if more detailed configration is needed),
// more robust solution should be built on modifying the structure in extractionSpec parsing instructions. See Jira 242.
const determineParsingSpec = (keyData: KeyData, spec: IExtractionSpec) => {
  const { fileSuffix, fileBaseName, path } = keyData;
  switch (true) {
    case path.length === Object.keys(spec.vRunFolderTreeExtractionSpec).length:
    case isSubmissionReport({ fileBaseName, fileSuffix }) && path.length === 5:
      return spec.vRunFolderTreeExtractionSpec;
    case path.length === Object.keys(spec.folderTreeExtractionSpec).length:
      return spec.folderTreeExtractionSpec;
    default:
      return null;
  }
};
