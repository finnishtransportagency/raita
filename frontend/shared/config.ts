/**
 * OpenSearch configuration
 * @deprecated This is only for local dev usage, will be removed
 */
export const openSearch = {
  indexName: 'metadata-index-v2',
} as const;

export const baseURL = process.env.NEXT_PUBLIC_RAITA_BASEURL
  ? `${process.env.NEXT_PUBLIC_RAITA_BASEURL}/api`
  : process.env.API_BASEURL || '/api';

/**
 * Overwrite api requests for dev environment
 */
export const devApiUrl = process.env.DEV_RAITA_API_BASEURL || null;
export const devApiKey = process.env.DEV_RAITA_API_KEY || null;

export const paging = {
  pageSize: 10,
} as const;
