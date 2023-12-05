import A from 'axios';
import { baseURL } from 'shared/config';
import {
  AdminLogsResponse,
  ImageKeyResponse,
  PollingProgress,
  SearchResponse,
} from './types';

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

export const getPollingProgress = (queryKey: string) => {
  return apiClient
    .get<PollingProgress>(`/polling?queryKey=${queryKey}`)
    .then(res => res.data);
};

export const triggerZipLambda = (keys: string[], pollingFileKey: string) => {
  return apiClient.post<GetZipFileResult>('zip', { keys, pollingFileKey });
};

export const getImageKeysForFileKey = async (key: string) => {
  return apiClient
    .post<ImageKeyResponse>('images', { key })
    .then(res => res.data.images)
    .then(images => images.map(image => image.key));
};

export const getAdminLogs = async (startDate: string, endDate: string) => {
  return apiClient
    .get<AdminLogsResponse>(
      `admin/logs?startDate=${startDate}&endDate=${endDate}`,
    )
    .then(res => res.data.logs);
};

type GetFilesResult = {};

type GetSignedUrlResult = {
  url: string;
};

type GetZipFileResult = {
  url: string;
  destKey: string;
};

type GetMetaResult = {
  fileTypes: { fileType: string; count: number }[];
  systems: { value: string; count: number }[];
  trackNumbers: any[];
  trackParts: { value: string; count: number }[];
  tilirataosanumerot: { value: string; count: number }[];
  fields: any[];
  reportTypes: MetaResultType[];
  latestInspection: string;
};

type MetaResultType = { reportType: string; count: number };

// #region Old, removable

/**
 * This is only used for the backend whiel running in a dev env, e.g. locally.
 * @deprecated Use @see {@link api} instead
 */
export const client = A.create({ baseURL });

// #endregion
