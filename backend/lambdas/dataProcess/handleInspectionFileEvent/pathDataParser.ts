import { IExtractionSpec, ParseValueResult } from '../../../types';
import { isSubmissionReport, KeyData, RaitaParseError } from '../../utils';
import { parsePrimitiveWithSubstitution } from './parsePrimitives';

/**
 * Extract meta data from the file path
 */
export const extractPathData = (keyData: KeyData, spec: IExtractionSpec) => {
  const { path } = keyData;
  const foundSpec = determineParsingSpecForPathParsing(keyData, spec);
  if (!foundSpec) {
    throw new RaitaParseError(
      `Unexpected folder path length ${path.length} for path ${path}. Folder path analysis not carried out`,
      'WRONG_FOLDER_PATH_LENGTH',
      keyData.fileName,
    );
  }
  const folderParsingSpec = foundSpec.spec;
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
/**
 * Determine which parsing spec to use for path parsing
 */
export const determineParsingSpecForPathParsing = (
  keyData: KeyData,
  spec: IExtractionSpec,
) => {
  const { fileSuffix, fileBaseName, path } = keyData;
  const testTrackExtraInfoMatch = 'TEST TRACK';
  // currently check based on path length
  // more complex checks could be needed if multiple specs have the same length
  const specs = spec.folderTreeExtractionSpecs;
  // Check only for specs with known names. New specs need to be added h ere
  switch (true) {
    case specs.find(s => s.name === 'virtualRun') &&
      path.length ===
        Object.keys(specs.find(s => s.name === 'virtualRun')!.spec).length:
    case isSubmissionReport({ fileBaseName, fileSuffix }) && path.length === 5:
      return specs.find(s => s.name === 'virtualRun')!;
    case specs.find(s => s.name === 'virtualRunWithoutDate') &&
      path.length ===
        Object.keys(specs.find(s => s.name === 'virtualRunWithoutDate')!.spec)
          .length:
      return specs.find(s => s.name === 'virtualRunWithoutDate')!;
    case specs.find(s => s.name === 'v1') &&
      path.length ===
        Object.keys(specs.find(s => s.name === 'v1')!.spec).length:
      return specs.find(s => s.name === 'v1')!;
    case specs.find(s => s.name === 'v1WithTestTrackExtraInfo') &&
      path.length ===
        Object.keys(
          specs.find(s => s.name === 'v1WithTestTrackExtraInfo')!.spec,
        ).length &&
      !!path[5].match(new RegExp(testTrackExtraInfoMatch)):
      // match zip files that include a top level directory with test track "extra information"
      return specs.find(s => s.name === 'v1WithTestTrackExtraInfo')!;

    default:
      return null;
  }
};
