import saveAs from 'file-saver';
import { createContext, Dispatch, SetStateAction } from 'react';

export const initialState: ZipState = {
  shouldPoll: false,
  pollingFileKey: undefined,
  zipUrl: undefined,
  error: undefined,
  isLoading: false,
};

export const zipContext = createContext<ZipContextType>({
  state: initialState,
  setState: () => {},
});

export const handleZipDownload = (zipUrl: string | null) =>
  zipUrl ? saveAs(zipUrl) : null;

export type ZipState = {
  shouldPoll: boolean;
  pollingFileKey?: string;
  zipUrl?: string;
  error?: string;
  isLoading: boolean;
};

export interface ZipContextType {
  state: ZipState;
  setState: Dispatch<SetStateAction<ZipState>>;
}
