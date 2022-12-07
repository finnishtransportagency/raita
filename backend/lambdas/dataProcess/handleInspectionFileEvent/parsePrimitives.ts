import parse from 'date-fns/parse';
import { log } from '../../../utils/logger';

export const parsePrimitive = (
  key: string,
  data: string,
  target: 'integer' | 'float' | 'date',
) => {
  const parsers: Record<typeof target, (x: string) => number | string> = {
    integer: x => parseInt(x),
    float: x => parseFloat(x),
    date: x => {
      // Try three different patterns, if all fail, let error bubble up
      try {
        return parse(x, 'd/M/y h:m:s a', new Date()).toISOString();
      } catch (error) {
        try {
          return parse(x, 'yyyyMMdd_hhmmss', new Date()).toISOString();
        } catch (error) {
          return parse(x, 'yyyyMMdd', new Date()).toISOString();
        }
      }
    },
  };
  try {
    return { key, value: parsers[target](data) };
  } catch (error) {
    log.error(error);
    return { key: `nonparsed_${key}`, value: data };
  }
};
