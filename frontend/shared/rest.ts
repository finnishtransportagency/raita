import A from 'axios';
import { baseURL } from 'shared/config';
import { ImageKeyResponse, SearchResponse } from './types';

/**
 * API client for use in calling the REST API endpoint
 */
export const apiClient = A.create({ baseURL: baseURL });

//

/**
 * Perform a search with the given OpenSearch `query` object
 * @param q
 * @returns
 */
export const getKeysOfFiles = (q: object) => {
  return apiClient.post<SearchResponse>('files', q).then(res => res.data.keys);
};

export const getFile = (key: string) =>
  apiClient.post<GetSignedUrlResult>('file', { key }).then(res => res.data);

export const getMeta = () => {
  return apiClient.get<GetMetaResult>('meta').then(res => res.data);
};

export const getZipFile = (keys: string[]) => {
  return apiClient
    .post<GetZipFileResult>('zip', { keys })
    .then(res => res.data);
};

export const getImageKeysForFileKey = async (key: string) => {
  return apiClient
    .post<ImageKeyResponse>('images', { key })
    .then(res => res.data.images)
    .then(images => images.map(image => image.key));
};

type GetFilesResult = {};

type GetSignedUrlResult = {
  url: string;
};

type GetZipFileResult = {
  url: string;
  destKey: string;
}

type GetMetaResult = {
  fileTypes: { fileType: string; count: number }[];
  systems: { value: string; count: number }[];
  trackNumbers: any[];
  trackParts: { value: string; count: number }[];
  fields: any[];
  reportTypes: MetaResultType[];
};

type MetaResultType = { reportType: string; count: number };

// #region Old, removable

/**
 * This is only used for the backend whiel running in a dev env, e.g. locally.
 * @deprecated Use @see {@link api} instead
 */
export const client = A.create({ baseURL });

// #endregion
