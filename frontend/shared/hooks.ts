import { useMutation, useQuery } from '@tanstack/react-query';
import { DependencyList } from 'react';
import * as R from 'rambda';
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
    return apiClient
      .post<{ result: { body: SearchResponse<IDocument> } }>('/files', query)
      .then(R.prop('data'))
      .then(R.tap(x => console.log({ x })));
  });
}

export function useFileQuery(saveFile = true) {
  return useMutation((opts: UseFileQueryArgs) => {
    const { key, fileName } = opts;
    return getFile(key).then(res => {
      if (saveFile) saveAs(res.url, key);
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

//

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
