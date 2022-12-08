/**
 * OpenSearch query builder for filters used in front-ends
 */
import { inspect } from 'util';
import * as R from 'rambda';

import { Entry, EntryType, ValueRel } from 'components/filters/selector';

const prefixMeta = (x: string) => `metadata.${x}`;

const log = (x: any) =>
  console.log(inspect(x, { colors: true, depth: Infinity, compact: false }));

/**
 *
 * _N.B.!_ This function makes no attempt at validating or transforming individual entries,
 *   but they are all assumed to have been validated and/or transformed prior to applying
 *   this function.
 *
 * @param fs
 * @returns
 */
export function makeQuery(fs: Entry[]) {
  const byType = R.groupBy(R.prop('type'), fs) as Record<EntryType, Entry[]>;
  // log(byType);

  // Make the range query part of this query
  /**
   * Prepare the range part of this query
   */
  const ranges = makeRangeQuery(byType.range || []);

  const match = makeMatchQuery(byType.match || [], { keyFn: prefixMeta });

  const q = [
    { range: ranges },
    { match: match.reduce((o, a) => R.mergeDeepRight(o, a), {}) },
  ];

  const r = q.reduce((o, a) => R.mergeDeepRight(o, a), {});

  // log(r);

  return r;
}

export {};

//

/**
 * @param x
 * @param opts
 * @returns
 */
export function makePagedQuery(x: any, opts: MakeQueryOpts) {
  return { from: 0, to: 0 };
}

/**
 * Turn a list of `Entry` objects into an OpenSearch `match` query object.
 *
 * @param fs
 * @param opts
 * @returns
 */
export function makeMatchQuery(fs: Entry[], opts: MakeQueryOpts) {
  const { keyFn } = opts;

  const qs = fs.map(entry => ({
    [keyFn(entry.field)]: entry.value,
  }));

  return qs;
}

/**
 * Not yet implemented
 *
 * @param fs
 * @param opts
 * @returns
 */
export function makeRangeQuery(fs: Entry[], opts: MakeQueryOpts) {
  const byField = R.groupBy(R.prop('field'), fs);

  const kvps = Object.entries(byField);

  const qq: [string, Record<ValueRel, string>][] = kvps.map(([k, v]) => [
    k,
    v.reduce((o, a) => R.merge(o, { [a.rel!]: a.value }), {}) as Record<
      ValueRel,
      string
    >,
  ]);

  const qq_ = R.fromPairs(qq);

  return qq_;
}

//

type MakeQueryOpts = {
  keyFn: (key: string) => string;
};

type RangeT = {};

type QueryType = 'match' | 'match_all';
