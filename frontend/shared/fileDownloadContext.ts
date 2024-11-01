import saveAs from 'file-saver';
import { createContext, Dispatch, SetStateAction } from 'react';

export const initialState: FileDownloadState = {
  shouldPoll: false,
  pollingFileKey: undefined,
  fileUrl: undefined,
  error: undefined,
  isLoading: false,
};

export const fileDownloadContext = createContext<FileDownloadContextType>({
  state: initialState,
  setState: () => {},
});

export const handleFileDownload = (fileUrl: string | null) =>
  fileUrl ? saveAs(fileUrl) : null;

export type FileDownloadState = {
  shouldPoll: boolean;
  pollingFileKey?: string;
  fileUrl?: string;
  error?: string;
  isLoading: boolean;
};

export interface FileDownloadContextType {
  state: FileDownloadState;
  setState: Dispatch<SetStateAction<FileDownloadState>>;
}
