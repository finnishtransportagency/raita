import { useQuery } from '@tanstack/react-query';
import saveAs from 'file-saver';
import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import * as R from 'rambda';

import {
  getKeysOfFiles,
  getPollingProgress,
  triggerZipLambda,
} from 'shared/rest';
import { getKeyAggregations, sizeformatter } from 'shared/util';
import Button from './button';
import { Spinner } from './spinner';
import { ProgressStatus } from 'shared/types';

const initialState: ZipState = {
  shouldPoll: false,
  pollingFileKey: undefined,
  zipUrl: undefined,
  error: undefined,
};

export function ZipDownload(props: Props) {
  const { aggregationSize, usedQuery, resultTotalSize } = props;
  const [state, setState] = useState<ZipState>(initialState);
  const { shouldPoll, zipUrl, error } = state;

  const { t } = useTranslation(['common']);

  const retryFunction = (failureCount: number) => {
    if (failureCount === 3) {
      setState(R.assoc('shouldPoll', false));
      setState(R.assoc('error', `${t('common:zip_error')}`));
      return false;
    }
    return true;
  };

  const { data, isLoading, isFetching, isError } = useQuery(
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
          setState(R.assoc('shouldPoll', false));
          setState(R.assoc('zipUrl', data.progressData.url));
        } else if (data?.progressData?.status === ProgressStatus.FAILED) {
          setState(R.assoc('shouldPoll', false));
          setState(R.assoc('error', `${t('common:zip_error')}`));
        }
      },
    },
  );

  const triggerZipping = async () => {
    setState(initialState);
    const pollingFileKey = `progress/data-${Date.now()}.json`;
    setState(R.assoc('pollingFileKey', pollingFileKey));
    const keyAggs = getKeyAggregations(aggregationSize);
    const keys = await getKeysOfFiles({ ...usedQuery, aggs: keyAggs, size: 0 });
    triggerZipLambda(keys, pollingFileKey).then(() =>
      setState(R.assoc('shouldPoll', true)),
    );
  };

  const handleZipDownload = () => (zipUrl ? saveAs(zipUrl) : null);

  return (
    <div>
      {!data?.progressData?.url || error ? (
        <Button
          disabled={isFetching && isLoading}
          size="sm"
          label={
            isFetching && isLoading ? (
              <Spinner size={4} bottomMargin={0} />
            ) : (
              `${t('common:compress_all')} ${sizeformatter(resultTotalSize)}`
            )
          }
          onClick={() => triggerZipping()}
        />
      ) : (
        <Button
          size="sm"
          label={`${t('common:download_zip')}`}
          onClick={() => handleZipDownload()}
        />
      )}
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-2"
          role="alert"
        >
          <strong className="font-bold text-base mr-4">{error}</strong>
        </div>
      )}
    </div>
  );
}

type Props = {
  aggregationSize: number | undefined;
  usedQuery: object;
  resultTotalSize: number | undefined;
};

type ZipState = {
  shouldPoll: boolean;
  pollingFileKey?: string;
  zipUrl?: string;
  error?: string;
};
