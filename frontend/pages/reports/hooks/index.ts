import { useMutation, useQuery } from '@tanstack/react-query';

import { webClient } from 'shared/rest';
import { IDocument, Rest } from 'shared/types';
import { prop } from 'rambda';
import {
  MsearchBody,
  SearchResponse,
} from '@opensearch-project/opensearch/api/types';
import { TypeAggs } from 'pages/api/report-types';
import { useMemo } from 'react';

// #region Queries

export function useFieldQuery() {
  return useQuery(['fields'], () =>
    webClient
      .get<Rest.Fields>('/fields')
      .then(data => (console.log(data.data) as any) || data)
      .then(prop('data')),
  );
}

export function useReportTypeQuery() {
  const res = useQuery(['report-types'], () =>
    webClient.get<TypeAggs>('/report-types').then(prop('data')),
  );

  const items = res.data?.aggregations.types.buckets;

  return useMemo(
    () => items?.map(it => ({ key: it.key, count: it.doc_count })),
    [items],
  );
}

// #endregion
// #region Mutations

export function useSearch() {
  return useMutation((query: MsearchBody) => {
    return webClient
      .post<SearchResponse<IDocument>>('/reports', query)
      .then(prop('data'));
  });
}

// #endregion

//

export function useReportState() {}
