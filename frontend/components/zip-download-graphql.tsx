import { useQuery } from '@tanstack/react-query';
import saveAs from 'file-saver';
import { useTranslation } from 'next-i18next';
import { useEffect, useState } from 'react';
import * as R from 'rambda';
import * as cfg from 'shared/config';

import { getPollingProgress, triggerZipLambda } from 'shared/rest';
import { sizeformatter } from 'shared/util';
import Button from './button';
import { Spinner } from './spinner';
import { ProgressStatus } from 'shared/types';
import { Search_RaporttiQueryVariables } from 'shared/graphql/__generated__/graphql';
import { useLazyQuery } from '@apollo/client';
import { SEARCH_RAPORTTI_KEYS_ONLY } from 'shared/graphql/queries/reports';

const initialState: ZipState = {
  shouldPoll: false,
  pollingFileKey: undefined,
  zipUrl: undefined,
  error: undefined,
  isLoading: false,
};

// Copied from zip-download.tsx
// TODO: rename when removing opensearch
export function ZipDownload(props: Props) {
  const { aggregationSize, usedQueryVariables, resultTotalSize } = props;
  const [state, setState] = useState<ZipState>(initialState);
  const { zipUrl, error, isLoading } = state;

  const maxSize = 5000000000;
  const bigSize = 1000000000;

  const { t } = useTranslation(['common']);
  const resultTooBigToCompress =
    resultTotalSize && resultTotalSize > maxSize ? true : false;
  const bigCompression =
    resultTotalSize && resultTotalSize > bigSize && !resultTooBigToCompress
      ? true
      : false;

  const [triggerKeyQuery, keyQuery] = useLazyQuery(SEARCH_RAPORTTI_KEYS_ONLY);

  const retryFunction = (failureCount: number) => {
    if (failureCount === 3) {
      setState(initialState);
      setState(R.assoc('error', `${t('common:zip_error')}`));
      return false;
    }
    return true;
  };

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
          setState(R.assoc('zipUrl', data.progressData.url));
        } else if (data?.progressData?.status === ProgressStatus.FAILED) {
          setState(initialState);
          setState(R.assoc('error', `${t('common:zip_error')}`));
        }
      },
    },
  );
  const triggerKeyFetching = () => {
    triggerKeyQuery({
      variables: {
        raportti: usedQueryVariables.raportti,
        page: 1,
        page_size: cfg.paging.maxZipPageSize,
      },
    });
  };

  useEffect(() => {
    if (keyQuery.data && keyQuery.data.search_raportti) {
      const keys =
        keyQuery.data.search_raportti.raportti
          ?.filter(raportti => raportti.key)
          .map(raportti => `${raportti.key}`) ?? [];
      triggerZipping(keys);
    }
  }, [keyQuery.data]);

  const triggerZipping = async (keys: string[]) => {
    setState(initialState);
    const pollingFileKey = `progress/data-${Date.now()}.json`;
    setState(R.assoc('pollingFileKey', pollingFileKey));
    setState(R.assoc('isLoading', true));
    try {
      triggerZipLambda(keys, pollingFileKey).then(() =>
        setState(R.assoc('shouldPoll', true)),
      );
    } catch (err) {
      setState(initialState);
      setState(R.assoc('error', `${t('common:zip_error')}`));
    }
  };

  const handleZipDownload = () => (zipUrl ? saveAs(zipUrl) : null);

  return (
    <div>
      {!zipUrl || error ? (
        <Button
          disabled={isLoading || resultTooBigToCompress}
          size="sm"
          label={
            isLoading ? (
              <Spinner size={4} bottomMargin={0} />
            ) : (
              `${t('common:compress_all')} ${sizeformatter(resultTotalSize)}`
            )
          }
          onClick={() => triggerKeyFetching()}
        />
      ) : (
        <Button
          size="sm"
          label={`${t('common:download_zip')}`}
          onClick={() => handleZipDownload()}
        />
      )}
      {bigCompression && (
        <p className="text-xs">{t('common:big_compression')}</p>
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
  usedQueryVariables: Search_RaporttiQueryVariables;
  resultTotalSize: number | undefined;
};

type ZipState = {
  shouldPoll: boolean;
  pollingFileKey?: string;
  zipUrl?: string;
  error?: string;
  isLoading: boolean;
};
