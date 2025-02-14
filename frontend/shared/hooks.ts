import { useMutation } from '@tanstack/react-query';
import { DependencyList, useState } from 'react';
import { saveAs } from 'file-saver';

import { getFile, getProtoExternalFile } from 'shared/rest';

// #region Queries

export function useFileQuery(saveFile = true) {
  return useMutation((opts: UseFileQueryArgs) => {
    const { key, fileName } = opts;

    console.assert(
      key,
      'The given `key` for `useFileQuery` is invalid; %s',
      key,
    );

    return getFile(key).then(res => {
      if (saveFile) saveAs(res.url, fileName);
      return res;
    });
  });
}
export function useProtoExternalFileQuery(saveFile = true) {
  return useMutation((opts: UseFileQueryArgs) => {
    const { key, fileName } = opts;
    return getProtoExternalFile(key).then(res => {
      if (saveFile) saveAs(res.url, fileName);
      return res;
    });
  });
}

type UseFileQueryArgs = {
  key: string;
  fileName?: string;
};

// #endregion

//

export function useQueryBuilder(
  q: QueryBuilderArgs,
  opts: Partial<QueryBuilderOpts> = {},
  deps: DependencyList = [],
) {
  const hasTerms = !!q.terms;
  const hasDateRange = !!q.dateRange;
  const hasReportTypes = !!q.reportTypes.length;

  const qʼ = { query: {}, from: 0, size: opts.pageSize || 5 };

  return qʼ;
}

export type QueryBuilderFilters = {};
export type QueryBuilderPaging = { from: number; size: number };

export type QueryBuilderResult = QueryBuilderFilters & QueryBuilderPaging;

export type QueryBuilderOpts = {
  pageSize: number;
};

export type QueryBuilderArgs = {
  terms: {};
  dateRange: {};
  reportTypes: string[];
};

//

export function usePager(opts: UsePagerArgs) {
  const [state, setState] = useState<UsePagerState>({ page: 0 });
}

export type UsePagerArgs = {
  size: number;
  offset: number;
};

export type UsePagerState = {
  page: number;
};
