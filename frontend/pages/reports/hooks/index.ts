import { useMutation, useQuery } from '@tanstack/react-query';

import { webClient, getMeta, apiClient } from 'shared/rest';
import { IDocument, Rest } from 'shared/types';
import * as R from 'rambda';
import {
  MsearchBody,
  SearchResponse,
} from '@opensearch-project/opensearch/api/types';
import { TypeAggs } from 'pages/api/report-types';
import { DependencyList, useMemo, useState } from 'react';

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

export function useFieldQuery() {
  return useQuery(['fields'], () =>
    webClient
      .get<Rest.Fields>('/fields')
      .then(R.prop('data'))
      .then(R.tap(console.log)),
  );
}

/**
 *
 * @returns
 * @deprecated
 */
export function useReportTypeQuery() {
  const res = useQuery(['report-types'], () =>
    webClient.get<TypeAggs>('/report-types').then(R.prop('data')),
  );

  const items = res.data?.aggregations.types.buckets;

  return useMemo(
    () => items?.map(it => ({ key: it.key, count: it.doc_count })),
    [items],
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
      .post<SearchResponse<IDocument>>('/files', query)
      .then(R.prop('data'))
      .then(R.tap(x => console.log({ x })));
  });
}

// #endregion

//
