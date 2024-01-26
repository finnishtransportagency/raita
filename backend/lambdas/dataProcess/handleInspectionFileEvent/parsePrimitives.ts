import parse from 'date-fns/parse';
import { zonedTimeToUtc } from 'date-fns-tz';
import { format, isMatch } from 'date-fns';
import { log } from '../../../utils/logger';
import { DATA_TIME_ZONE } from '../../../../constants';

const parseDate = (date: string) => {
  // Try three different patterns, if all fail, let error bubble up
  const timeZone = DATA_TIME_ZONE;
  const dateTimeFormats = ['d/M/y h:m:s a', 'yyyyMMdd_HHmmss'];
  const dateTimesMatching = dateTimeFormats.filter(format =>
    isMatch(date, format),
  );
  if (dateTimesMatching.length) {
    const parsed = parse(date, dateTimesMatching[0], new Date()).toISOString();
    return zonedTimeToUtc(parsed, timeZone).toISOString();
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
    const parsed = parse(dateToParse, formatToTest, new Date()).toISOString();
    return zonedTimeToUtc(parsed, timeZone).toISOString();
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
    log.error(error);
    return { key: `nonparsed_${key}`, value: data };
  }
};
