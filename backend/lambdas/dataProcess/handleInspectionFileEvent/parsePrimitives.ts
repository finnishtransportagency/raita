import { parse } from 'date-fns';
import { tz } from '@date-fns/tz';
import { format, isMatch } from 'date-fns';
import { logParsingException } from '../../../utils/logger';
import { DATA_TIME_ZONE } from '../../../../constants';
import { IExtractionSpec } from '../../../types';

const parseDate = (date: string) => {
  // Try three different patterns, if all fail, let error bubble up
  const timeZone = DATA_TIME_ZONE;
  const dateTimeFormats = ['d/M/y h:m:s a', 'yyyyMMdd_HHmmss'];
  const dateTimesMatching = dateTimeFormats.filter(format =>
    isMatch(date, format),
  );
  if (dateTimesMatching.length) {
    const tzDate = parse(date, dateTimesMatching[0], new Date(), {
      in: tz(timeZone),
    });
    // note TZDate.toISOString() outputs the internal timezone instead of UTC
    return new Date(tzDate.toISOString()).toISOString();
  }
  const dateOnlyFormats = ['yyyyMMdd'];
  const datesOnlyMatching = dateOnlyFormats.filter(format =>
    isMatch(date, format),
  );
  if (datesOnlyMatching.length) {
    // only date part: don't account for timezone and set time to 00:00
    const parsed = parse(date, datesOnlyMatching[0], new Date());
    return `${format(parsed, 'yyyy-MM-dd')}T00:00:00.000Z`;
  }
  // known exception: try if input contains multiple valid dates in format 'd/M/y h:m:s a' and try to parse the first one
  const formatToTest = 'd/M/y h:m:s a';
  const split = date.split(' ');
  const partsPerDate = 3;
  const dateCount = Math.floor(split.length / partsPerDate);
  if (dateCount * 3 !== split.length) {
    throw new Error(`Date in invalid format: ${date}`);
  }
  const indices = [...Array(dateCount).keys()];
  const validDates = indices.filter(i => {
    const startI = 3 * i;
    const possibleDate = `${split[startI]} ${split[startI + 1]} ${
      split[startI + 2]
    }`;
    return isMatch(possibleDate, formatToTest);
  });
  if (validDates.length === dateCount) {
    const dateToParse = split.slice(0, 3).join(' ');
    const tzDate = parse(dateToParse, formatToTest, new Date(), {
      in: tz(timeZone),
    });
    // note TZDate.toISOString() outputs the internal timezone instead of UTC
    return new Date(tzDate.toISOString()).toISOString();
  }
  throw new Error(`Date in invalid format: ${date}`);
};

export const parsePrimitive = (
  key: string,
  data: string,
  target: 'integer' | 'float' | 'date',
) => {
  const parsers: Record<typeof target, (x: string) => number | string> = {
    integer: x => parseInt(x),
    float: x => parseFloat(x),
    date: x => parseDate(x),
  };
  try {
    return { key, value: parsers[target](data) };
  } catch (error: any) {
    logParsingException.error(
      { errorType: 'VALUE_PARSE_ERROR' },
      `Parsing failed for the term: ${key}: ${
        error instanceof Error ? error.message : error
      }`,
    );
    return { key: `nonparsed_${key}`, value: data };
  }
};

/**
 * Parse value and possibly substitute it with another value if match for both key and value is found in spec.knownExceptions.substituteValues
 */
export const parsePrimitiveWithSubstitution = (
  key: string,
  data: string,
  target: 'integer' | 'float' | 'date' | undefined, // if undefined, leave as string
  substituteValues: IExtractionSpec['knownExceptions']['substituteValues'],
) => {
  let substituted = data;
  const substitutionMatch = substituteValues.filter(
    substitution => key === substitution.key && data === substitution.oldValue,
  );
  if (substitutionMatch.length) {
    substituted = substitutionMatch[0].newValue;
  }

  const result = target
    ? parsePrimitive(key, substituted, target)
    : { key: key, value: substituted };

  return result;
};
