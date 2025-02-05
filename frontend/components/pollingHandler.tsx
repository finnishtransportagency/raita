import {
  handleFileDownload,
  initialState,
  fileDownloadContext,
} from 'shared/fileDownloadContext';
import Button from './button';
import { ProgressStatus } from 'shared/types';
import { getPollingProgress } from 'shared/rest';
import { useContext, useEffect } from 'react';
import * as R from 'rambda';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from './spinner';

export const PollingHandler = ({
  buttonType,
}: {
  buttonType?: 'primary' | 'secondary' | 'tertiary';
}) => {
  const { state, setState } = useContext(fileDownloadContext);
  const { error, isLoading } = state;

  const { t } = useTranslation(['common']);
  const retryFunction = (failureCount: number) => {
    if (failureCount === 3) {
      setState(initialState);
      setState(R.assoc('error', `${t('common:zip_error')}`));
      return false;
    }
    return true;
  };
  useEffect(() => {
    if (localStorage.getItem('pollingFileKey')) {
      setState(R.assoc('shouldPoll', true));
      setState(R.assoc('isLoading', true));
      setState(
        R.assoc('pollingFileKey', localStorage.getItem('pollingFileKey')!),
      );
    }
  }, []);
  const { data } = useQuery(
    ['fileData', state.pollingFileKey],
    () => {
      if (!state.pollingFileKey) return;
      return getPollingProgress(state.pollingFileKey);
    },
    {
      enabled: state.shouldPoll,
      refetchInterval: 2000,
      retry: retryFunction,
      retryDelay: 2000,
      onSuccess: data => {
        if (
          data?.progressData?.status === ProgressStatus.SUCCESS &&
          data?.progressData?.url
        ) {
          setState(initialState);
          setState(R.assoc('fileUrl', data.progressData.url));
          localStorage.setItem('fileUrl', data.progressData.url);
          localStorage.removeItem('pollingFileKey');
        } else if (data?.progressData?.status === ProgressStatus.FAILED) {
          setState(initialState);
          setState(R.assoc('error', `${t('common:zip_error')}`));
        }
      },
    },
  );
  const resetInitials = () => {
    setState(initialState);
    localStorage.removeItem('fileUrl');
    localStorage.removeItem('pollingFileKey');
  };
  return (
    <>
      {isLoading ? (
        <div className="flex mb-1 mr-4">
          <Spinner size={4} bottomMargin={0} />
        </div>
      ) : (
        <div className="flex gap-2 mb-1">
          <Button
            type={buttonType ? buttonType : 'primary'}
            size="sm"
            label={`${t('common:download_zip')}`}
            onClick={() => handleFileDownload(localStorage.getItem('fileUrl'))}
          />
          <Button
            size="sm"
            type={buttonType ? buttonType : 'secondary'}
            label={`${t('common:cancel')}`}
            onClick={() => resetInitials()}
          />
        </div>
      )}
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-2"
          role="alert"
        >
          <strong className="font-bold text-base mr-4">{error}</strong>
        </div>
      )}
    </>
  );
};
