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
 * @param extraQueries
 * @param textToSearch
 * @returns
 */
export function makeQuery(
  fs: Entry[],
  opts?: Partial<QueryOpts>,
  /**
   * Crutch for allowing to unsafely poke filters that are included into the query.
   * Currently used for creating "subqueries", such that we can do an AND query,
   * that includes one or more filters that works as an OR query (example: report types)
   *
   * This can also be used in cases where other single-select fields should be turned
   * into multiple-choice fields, such that the query matches any one of the selections
   * instead of trying to AND them all (which wouldn't return anything).
   */
  extraQueries?: any[],
  textToSearch?: string,
) {
  const queryType = opts?.queryType || 'and';
  const pageOpts = opts?.paging;
  const keyFn = opts?.keyFn || prefixMeta;
  const matchAllOnEmpty = opts?.matchAllOnEmpty || true;

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
    ...(textToSearch ? [{ wildcard: { file_name: `*${textToSearch}*` } }] : []),
  ];

  const emptyQuery =
    qs.length === 0 && extraQueries?.length === 0 && !textToSearch;

  const qbody = emptyQuery
    ? { match_all: {} }
    : {
        bool: {
          [queryTypeMap[queryType]]: qs.concat(
            extraQueries ? extraQueries : [],
          ),
        },
      };

  const qʼ = {
    ...paging,
    query: qbody,
  };

  return qʼ;
}

//

/**
 * Takes a 1-based page number and page size, and returns a paging object containing
 * the proper offset to be used in an OpenSearch query.
 *
 * @param paging
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
  /** @deprecated */
  matchAllOnEmpty: boolean;
  keyFn: (key: string) => string;
};

//

type MakeQueryOpts = {
  keyFn: (key: string) => string;
};

type RangeT = {};

type QueryType = 'match' | 'match_all';

//

export function makeFromMulti(
  keys: string[],
  field: string,
  opts?: Partial<MakeQueryOpts>,
) {
  const keys_ = keys.filter(x => !R.isEmpty(x));

  // If we have no keys, just bail
  if (!keys_.length) return {};

  const keyFn = opts?.keyFn || prefixMeta;

  // Turn the keys into filter objects that we'll use to create the OR query
  const filters = keys.map(
    k => ({ field, type: 'match', rel: 'eq', value: k } as Entry),
  );

  // Create the query which can then be used whereever
  const query = {
    bool: {
      should: makeMatchQuery(filters, { keyFn }).map(match => ({ match })),
    },
  };

  return query;
}

//
