import A from 'axios';
import { baseURL } from 'shared/config';
import {
  AdminLogsSummaryResponse,
  DeleteResponse,
  ImageKeyResponse,
  ManualDataProcessRequest,
  PollingProgress,
  SingleEventAdminLogsResponse,
} from './types';

/**
 * API client for use in calling the REST API endpoint
 */
export const apiClient = A.create({ baseURL: baseURL });

//

export const getUser = () =>
  apiClient.get<GetUserResult>('user').then(res => res.data);

export const getFile = (key: string) =>
  apiClient.post<GetSignedUrlResult>('file', { key }).then(res => res.data);

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

export const getSingleEventAdminLogs = async (
  date: string,
  invocationId: string,
  sources: string[],
  pageSize: number,
  pageIndex: number,
): Promise<SingleEventAdminLogsResponse> => {
  return apiClient
    .get<SingleEventAdminLogsResponse>(
      `admin/logs?date=${date}&invocationId=${invocationId}&sources=${sources.join(
        ',',
      )}&pageSize=${pageSize}&pageIndex=${pageIndex}`,
    )
    .then(res => res.data);
};

export const getAdminLogsSummary = async (
  startDate: string,
  endDate: string,
  sources: string[],
  pageSize: number,
  pageIndex: number,
): Promise<AdminLogsSummaryResponse> => {
  return apiClient
    .get<AdminLogsSummaryResponse>(
      `admin/logs/summary?startDate=${startDate}&endDate=${endDate}&sources=${sources.join(
        ',',
      )}&pageSize=${pageSize}&pageIndex=${pageIndex}`,
    )
    .then(res => res.data);
};
export const postDeleteRequest = async (keyPrefix: string) => {
  return apiClient
    .post<DeleteResponse>('delete', { prefix: keyPrefix })
    .then(res => res.data);
};
export const postManualDataProcessRequest = async (
  keyPrefix: string,
  skipHashCheck: boolean,
  requireNewerParserVersion: boolean,
) => {
  return apiClient
    .post<ManualDataProcessRequest>('admin/process', {
      prefix: keyPrefix,
      skipHashCheck: skipHashCheck ? '1' : '0',
      requireNewerParserVersion: requireNewerParserVersion ? '1' : '0',
    })
    .then(res => res.data);
};

type GetFilesResult = {};

type GetUserResult = {
  roles: string[];
};

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
