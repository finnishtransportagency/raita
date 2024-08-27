import saveAs from 'file-saver';
import { Dispatch, SetStateAction } from 'react';

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
export function noop(...args: any[]) {}
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

export const sizeformatter = (size: number | undefined, decimalPlaces = 2) => {
  if (size) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    let unit = 0;

    while (size >= 1024) {
      size /= 1024;
      unit += 1;
    }

    return `${size.toFixed(decimalPlaces)} ${units[unit]}`;
  }
};

export const takeOptionValues = (fs: HTMLCollectionOf<HTMLOptionElement>) =>
  Array.from(fs, opt => opt.value as string).filter(Boolean);

export const getKeyAggregations = (size: number | undefined) => {
  if (!size) return;
  return {
    keys: {
      terms: {
        field: 'key.keyword',
        size: size,
      },
    },
  };
};

export const handleZipDownload = (zipUrl: string | null) =>
  zipUrl ? saveAs(zipUrl) : null;

export const initialState: ZipState = {
  shouldPoll: false,
  pollingFileKey: undefined,
  zipUrl: undefined,
  error: undefined,
  isLoading: false,
};
export type ZipState = {
  shouldPoll: boolean;
  pollingFileKey?: string;
  zipUrl?: string;
  error?: string;
  isLoading: boolean;
};

export interface ZipContextType {
  state: ZipState;
  setState: Dispatch<SetStateAction<ZipState>>;
}
