/**
 * OpenSearch configuration
 * @deprecated This is only for local dev usage, will be removed
 */
export const openSearch = {
  indexName: 'metadata-index-v2',
} as const;

export const baseURL =
  process.env.NEXT_PUBLIC_API_BASEURL || process.env.API_BASEURL || '/api';

export const paging = {
  pageSize: 10,
} as const;
