import {
  IColonSeparatedKeyValuePairDefinition,
  IExtractionSpec,
} from '../types';
import { ParseValueResult } from '../types';
import { parsePrimitive } from '../utils/parsePrimitives';
import { regexCapturePatterns } from '../utils/regex';

export const isContentExtractionRequired = ({
  fileName,
  contentType,
  includeSpec,
}: {
  fileName: string;
  contentType: string | undefined;
  includeSpec: IExtractionSpec['include'];
}) =>
  (contentType && includeSpec.includeContentTypes.includes(contentType)) ||
  includeSpec.includeFileNames.includes(fileName);

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
    throw new Error(
      `Parsing failed for the term: ${propertyKey}: ${
        err instanceof Error ? err.message : err
      }`,
    );
  }
};

export const extractFileContentData = (
  spec: IExtractionSpec,
  fileBody: string | undefined,
) =>
  !fileBody
    ? {}
    : spec.fileContentExtractionSpec
        .map(extractSpecItem => extractValue(extractSpecItem, fileBody))
        .reduce<ParseValueResult>((acc, cur) => {
          if (cur) {
            acc[cur.key] = cur.value;
          }
          return acc;
        }, {});
