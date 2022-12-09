import * as F from 'fast-check';

import { Entry } from 'components/filters/selector';
import {
  makeQuery,
  makeMatchQuery,
  makePagedQuery,
  makeRangeQuery,
} from '../query-builder';

const arb = {
  Entry: F.record({
    field: F.string(),
    value: F.string(),
    type: F.constant('range'),
    rel: F.constantFrom('gt', 'gte', 'lt', 'lte'),
  }),
};

describe('make queries', () => {
  test('makeQuery', () => {
    const fs: Entry[] = [
      { field: 'foo', value: '0', type: 'match' },
      { field: 'bar', value: '1', type: 'match' },
      { field: 'date', value: '1000000', type: 'range', rel: 'gte' },
      { field: 'date', value: '2000000', type: 'range', rel: 'lte' },
      { field: 'by_number', value: '123', type: 'match', rel: 'eq' },
    ];

    const paging = {
      curPage: 1,
      size: 10,
    };

    expect(makeQuery(fs, { keyFn: a => a })).toEqual({
      query: {
        bool: {
          must: [
            { match: { foo: '0' } },
            { match: { bar: '1' } },
            { match: { by_number: '123' } },
            { range: { date: { gte: '1000000', lte: '2000000' } } },
          ],
        },
      },
    });

    expect(makeQuery(fs, { paging })).toEqual({
      from: 0,
      size: 10,
      query: {
        bool: {
          must: [
            { match: { 'metadata.foo': '0' } },
            { match: { 'metadata.bar': '1' } },
            { match: { 'metadata.by_number': '123' } },
            {
              range: {
                'metadata.date': {
                  gte: '1000000',
                  lte: '2000000',
                },
              },
            },
          ],
        },
      },
    });
  });
});

describe('match queries', () => {
  it('should gracefully handle empty queries', () => {
    expect(makeMatchQuery([])).toEqual([]);
  });

  it('should allow to specify a function to transform keys being matched', () => {
    const f1: Entry = { field: 'foo', value: '0', type: 'match' };

    const q1 = makeMatchQuery([f1]);
    const q2 = makeMatchQuery([f1], { keyFn: a => a.toUpperCase() });

    expect(q1).toEqual([{ foo: '0' }]);
    expect(q2).toEqual([{ FOO: '0' }]);
  });
});

describe('ranged queries', () => {
  it('should gracefully handle empty queries', () => {
    expect(makeRangeQuery([])).toEqual([]);
  });

  it('should return a single object for two overlapping queries', () => {
    const f1: Entry = { field: 'foo', value: '0', type: 'range', rel: 'gte' };
    const f2: Entry = { field: 'foo', value: '5', type: 'range', rel: 'lte' };
    /**
     * @input [{ field: 'abc', value: '123', rel: 'gte' }, { field: 'abc', value: '234', rel: 'lte' }]
     * @output { abc: { gte: '123', lte: '234' } }
     *
     * @link https://opensearch.org/docs/2.4/opensearch/query-dsl/term/#range-query
     */
    const q = makeRangeQuery([f1, f2]);
    expect(q).toEqual([{ foo: { gte: '0', lte: '5' } }]);
  });

  it('should handle multiple ranged queries', () => {
    const r1: [Entry, Entry] = [
      { field: 'foo', value: '0', type: 'range', rel: 'gte' },
      { field: 'foo', value: '5', type: 'range', rel: 'lte' },
    ];
    const r2: [Entry, Entry] = [
      { field: 'bar', value: '10', type: 'range', rel: 'gte' },
      { field: 'bar', value: '20', type: 'range', rel: 'lte' },
    ];

    const q = makeRangeQuery([...r1, ...r2], { keyFn: a => a.toUpperCase() });

    expect(q).toEqual([
      { FOO: { gte: '0', lte: '5' } },
      { BAR: { gte: '10', lte: '20' } },
    ]);
  });
});

describe('paged queries', () => {
  it('should create a paged query object', () => {
    const p1 = { curPage: 1, size: 10 };
    const p2 = { curPage: 12, size: 12 };

    const r1 = makePagedQuery(p1);
    const r2 = makePagedQuery(p2);

    const e1 = { from: 0, size: 10 };
    const e2 = { from: p2.size * (p2.curPage - 1), size: p2.size };

    expect(r1).toEqual(e1);
    expect(r2).toEqual(e2);
  });
});
