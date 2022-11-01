import {
  IColonSeparatedKeyValuePairDefinition,
  IExtractionSpec,
} from '../../../types';
import { ParseValueResult } from '../../../types';
import { parsePrimitive } from './parsePrimitives';
import { regexCapturePatterns } from './regex';
import { fileSuffixesToIncudeInMetadataParsing } from '../../../../constants';
import { RaitaParseError } from '../../utils';
import { createHash } from 'crypto';
/**
 * Resolves whether content data parsing is needed for the file
 */
export const shouldParseContent = ({ fileName }: { fileName: string }) => {
  const suffix = fileName.substring(
    fileName.lastIndexOf('.') + 1,
    fileName.length,
  );
  return suffix === fileSuffixesToIncudeInMetadataParsing.TXT_FILE;
};

/**
 * Resolves whether hash should be calculated for the file contents
 * The logic for now is the same as for when content needs to be parsed
 * If the logic between these two cases differ in future, implement hash calculation
 * specific logic below
 */
export const shouldCalculateHash = shouldParseContent;

const extractValue = (
  extractSpec: IColonSeparatedKeyValuePairDefinition,
  fileBody: string,
) => {
  const { propertyKey, pattern, parseAs } = extractSpec;
  // If more than one possible pattern, add logic here for passing
  // arguments to the function generating regex.
  const regr = regexCapturePatterns[pattern.predefinedPatternId](
    pattern.searchKey,
  );
  try {
    const res = regr.exec(fileBody);
    const val = res?.[1];
    if (val) {
      return parseAs
        ? parsePrimitive(propertyKey, val, parseAs)
        : { key: propertyKey, value: val };
    }
    return null;
  } catch (err) {
    throw new RaitaParseError(
      `Parsing failed for the term: ${propertyKey}: ${
        err instanceof Error ? err.message : err
      }`,
    );
  }
};

export const extractFileContentData = (
  spec: IExtractionSpec,
  fileBody: string,
) =>
  spec.fileContentExtractionSpec
    .map(extractSpecItem => extractValue(extractSpecItem, fileBody))
    .reduce<ParseValueResult>((acc, cur) => {
      if (cur) {
        acc[cur.key] = cur.value;
      }
      return acc;
    }, {});

/**
 * Returns hex encoded hash for given file input
 */
export const calculateHash = (fileBody: string): ParseValueResult => {
  const hash = createHash('sha256');
  return { hash: hash.update(fileBody).digest('hex') };
};
