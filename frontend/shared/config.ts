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

export const assetURL = process.env.NEXT_PUBLIC_RAITA_BASEURL || '';
/**
 * Overwrite api requests for dev environment
 */
export const devApiUrl = process.env.DEV_RAITA_API_BASEURL || null;
export const devApiKey = process.env.DEV_RAITA_API_KEY || null;

export const paging = {
  pageSize: 10,
  allResultsPageSize: 50000, // max size to use for retrieving "all" results TODO: can this result in responses too large?
} as const;

// index of zip file name in file key
export const zipFileNameIndex = 5;
