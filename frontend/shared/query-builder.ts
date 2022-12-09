/**
 * OpenSearch query builder for filters used in front-ends
 */
import { inspect } from 'util';
import * as R from 'rambda';

import { Entry, EntryType, ValueRel } from 'components/filters/selector';

const prefixMeta = (x: string) => `metadata.${x}`;

/* istanbul ignore next */
const log = (x: any) =>
  console.log(inspect(x, { colors: true, depth: Infinity, compact: false }));

//

/**
 * Create a complete, usable OpenSearch query object, also including paging, ranges and matches.
 *
 * _N.B.!_ This function makes no attempt at validating or transforming individual entries,
 *   but they are all assumed to have been validated and/or transformed prior to applying
 *   this function.
 *
 * @param fs
 * @param opts
 * @returns
 */
export function makeQuery(fs: Entry[], opts?: Partial<QueryOpts>) {
  const queryType = opts?.queryType || 'and';
  const pageOpts = opts?.paging;
  const keyFn = opts?.keyFn || prefixMeta;

  const queryTypeMap = {
    and: 'must',
    or: 'should',
  } as const;

  const byType = R.groupBy(R.prop('type'), fs) as Record<EntryType, Entry[]>;

  const ranges = makeRangeQuery(byType.range || [], { keyFn });
  const match = makeMatchQuery(byType.match || [], { keyFn });
  const paging = pageOpts ? makePagedQuery(pageOpts) : {};

  // This is the part that goes into the bool query (no paging here!)
  const qs = [
    ...match.map(e => ({ match: e })),
    ...ranges.map(e => ({ range: e })),
  ];

  const qʼ = {
    ...paging,
    query: {
      bool: {
        [queryTypeMap[queryType]]: qs,
      },
    },
  };

  return qʼ;
}

//

/**
 * @param x
 * @param opts
 * @returns
 */
export function makePagedQuery(paging: PagingOpts, opts?: MakeQueryOpts) {
  const from = paging.size * (paging.curPage - 1);
  const size = paging.size;

  return { from, size };
}

/**
 * Turn a list of `Entry` objects into an OpenSearch `match` query object.
 *
 * @param fs
 * @param opts
 * @returns
 */
export function makeMatchQuery(fs: Entry[], opts?: Partial<MakeQueryOpts>) {
  const keyFn = opts?.keyFn || R.identity;

  const qs = fs.map(entry => ({
    [keyFn(entry.field)]: entry.value,
  }));

  return qs;
}

/**
 * @param fs
 * @param opts
 * @returns
 */
export function makeRangeQuery(fs: Entry[], opts?: Partial<MakeQueryOpts>) {
  const keyFn = opts?.keyFn || R.identity;

  const byField = R.groupBy(R.prop('field'), fs);

  const kvps = Object.entries(byField);

  const qq: [string, Record<ValueRel, string>][] = kvps.map(([k, v]) => [
    k,
    v.reduce((o, a) => R.merge(o, { [a.rel!]: a.value }), {}) as Record<
      ValueRel,
      string
    >,
  ]);

  const result = qq.map(p => ({ [keyFn(p[0])]: p[1] }));

  return result;
}

//

type PagingOpts = {
  curPage: number;
  size: number;
};

type QueryOpts = {
  queryType: 'and' | 'or';
  paging: PagingOpts;
  keyFn: (key: string) => string;
};

//

type MakeQueryOpts = {
  keyFn: (key: string) => string;
};

type RangeT = {};

type QueryType = 'match' | 'match_all';
