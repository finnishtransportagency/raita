import parse from 'date-fns/parse';
import { zonedTimeToUtc } from 'date-fns-tz';
import { format } from 'date-fns';
import { log } from '../../../utils/logger';
import { DATA_TIME_ZONE } from '../../../../constants';

const parseDate = (date: string) => {
  // Try three different patterns, if all fail, let error bubble up
  const timeZone = DATA_TIME_ZONE;
  try {
    const parsed = parse(date, 'd/M/y h:m:s a', new Date()).toISOString();
    return zonedTimeToUtc(parsed, timeZone).toISOString();
  } catch (error) {
    try {
      const parsed = parse(date, 'yyyyMMdd_HHmmss', new Date()).toISOString();
      return zonedTimeToUtc(parsed, timeZone).toISOString();
    } catch (error) {
      // only date part: don't account for timezone and set time to 00:00
      const parsed = parse(date, 'yyyyMMdd', new Date());
      return `${format(parsed, 'yyyy-MM-dd')}T00:00:00.000Z`;
    }
  }
};

export const parsePrimitive = (
  key: string,
  data: string,
  target: 'integer' | 'float' | 'date',
) => {
  const parsers: Record<typeof target, (x: string) => number | string> = {
    integer: x => parseInt(x),
    float: x => parseFloat(x),
    date: parseDate,
  };
  try {
    return { key, value: parsers[target](data) };
  } catch (error) {
    log.error(error);
    return { key: `nonparsed_${key}`, value: data };
  }
};
