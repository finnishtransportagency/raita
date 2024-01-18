import { createHash } from 'crypto';
import {
  IColonSeparatedKeyValuePairDefinition,
  IExtractionSpec,
} from '../../../types';
import { ParseValueResult } from '../../../types';
import { parsePrimitive } from './parsePrimitives';
import { regexCapturePatterns } from './regex';
import { fileSuffixesToIncludeInMetadataParsing } from '../../../../constants';
import { RaitaParseError } from '../../utils';
import { log } from '../../../utils/logger';
/**
 * Resolves whether content data parsing is needed for the file
 */
export const shouldParseContent = (suffix: string) =>
  suffix === fileSuffixesToIncludeInMetadataParsing.TXT_FILE;

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
      'VALUE_PARSE_ERROR',
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
export const calculateHash = (fileBody: string): string => {
  log.debug(`Calculating hash for ${fileBody}`);
  const hash = createHash('sha256');
  return hash.update(fileBody).digest('hex');
};
