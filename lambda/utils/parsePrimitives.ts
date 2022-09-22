import parse from 'date-fns/parse';

export const parsePrimitive = (
  key: string,
  data: string,
  target: 'integer' | 'float' | 'date',
) => {
  const parsers: Record<typeof target, (x: string) => number | string> = {
    integer: x => parseInt(x),
    float: x => parseFloat(x),
    date: x => parse(x, 'M/d/y h:m:s a', new Date()).toISOString(),
  };
  try {
    return { key, value: parsers[target](data) };
  } catch (error) {
    return { key: `nonparsed_${key}`, value: data };
  }
};
