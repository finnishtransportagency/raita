export function fst<T1, T2>([a, b]: [T1, T2]) {
  return a;
}

export function snd<T1, T2>([a, b]: [T1, T2]) {
  return b;
}

export const prefix = (p: string, x: string) => [p, x].join('');

/**
 * Basic no-op, shorthand for getting an undefined value.
 */
export function noop() {}
export { noop as toUndefined };

/**
 * Utility for turning a `key` and `value` into an object used for matching said
 * key to value in OpenSearch.
 *
 * Allows optional transformer function for `key`.
 *
 * @param key
 * @param value
 * @param keyFn
 * @returns
 */
export const toSearchQueryTerm = (
  key: string,
  value: string,
  keyFn?: (x: string) => string,
) => ({
  match: {
    [keyFn ? keyFn(key) : key]: value,
  },
});
