import { TargetBaseProps } from 'aws-cdk-lib/aws-events-targets';

export const parsePrimitive = (
  key: string,
  data: string,
  target: 'integer' | 'float' | 'date',
) => {
  const parsers: Record<typeof target, (x: string) => number> = {
    integer: x => parseInt(x),
    float: x => parseFloat(x),
    date: x => new Date(x).valueOf(),
  };
  try {
    return { key, value: parsers[target](data) };
  } catch (error) {
    return { key: `nonparsed_${key}`, value: data };
  }
};
