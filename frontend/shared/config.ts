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
  maxZipPageSize: 5000, // max size to use for zipping. If larger sizes are required, need to rework zip download so that list of keys is not fetched in frontend
} as const;

// index of zip file name in file key
export const zipFileNameIndex = 5;

export const currentMetadataDatabase: 'opensearch' | 'postgres' =
  process.env.NEXT_PUBLIC_METADATA_DATABASE;
export const enableCsvPage: boolean =
  !!process.env.NEXT_PUBLIC_ENABLE_CSV_PAGE ?? false;
