import A from 'axios';
import { baseURL } from 'shared/config';

/**
 * API client for use in calling the REST API endpoint
 */
export const apiClient = A.create({ baseURL: baseURL });

console.log({ apiClient });

//

/**
 * Perform a search with the given OpenSearch `query` object
 * @param q
 * @returns
 */
export const getFiles = (q: object) =>
  apiClient.post<GetFilesResult>('files', q);

export const getFile = (key: string) =>
  apiClient.post<GetSignedUrlResult>('file', { key }).then(res => res.data);

export const getMeta = () => {
  return apiClient.get<GetMetaResult>('meta').then(res => res.data);
};

type GetFilesResult = {};

type GetSignedUrlResult = {
  url: string;
};

type GetMetaResult = {
  fields: MetaResultField[];
  reportTypes: MetaResultType[];
};

type MetaResultField<T extends string | number | symbol = string> = {
  [K in T]: { type: string };
};

type MetaResultType = { reportType: string; count: number };

// #region Old, removable

/**
 * This is only used for the backend whiel running in a dev env, e.g. locally.
 * @deprecated Use @see {@link api} instead
 */
export const client = A.create({ baseURL });

// #endregion
