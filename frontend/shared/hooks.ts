import * as R from 'rambda';
import { useMutation, useQuery } from '@tanstack/react-query';
import { DependencyList, useState } from 'react';
import {
  MsearchBody,
  SearchResponse,
} from '@opensearch-project/opensearch/api/types';
import { saveAs } from 'file-saver';

import { getMeta, apiClient, getFile } from 'shared/rest';
import { IDocument } from 'shared/types';

// #region Queries

export function useMetadataQuery() {
  return useQuery(['meta'], () =>
    getMeta().then(({ fields, reportTypes }) => {
      return {
        fields: fields.reduce((o, x) => R.merge(o, x), {}),
        reportTypes,
      };
    }),
  );
}
// #endregion
// #region Mutations

/**
 * Create a React Query mutation for performing searches on the API
 * @returns
 */
export function useSearch() {
  return useMutation((query: MsearchBody) => {
    console.assert(query, 'Given search query is invalid; %o', { query });

    return apiClient
      .post<{ result: { body: SearchResponse<IDocument> } }>('/files', query)
      .then(R.prop('data'));
  });
}

export function useFileQuery(saveFile = true) {
  return useMutation((opts: UseFileQueryArgs) => {
    const { key, fileName } = opts;
    console.assert(
      key,
      'The given `key` fpr `useFileQuery` is invalid; %s',
      key,
    );

    return getFile(key).then(res => {
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