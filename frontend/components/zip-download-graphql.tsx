import { useTranslation } from 'next-i18next';
import { useContext, useEffect } from 'react';
import * as R from 'rambda';
import * as cfg from 'shared/config';

import { triggerZipLambda } from 'shared/rest';
import { initialState } from 'shared/zipContext';
import { sizeformatter } from 'shared/util';
import Button from './button';
import { Spinner } from './spinner';

import { Search_RaporttiQueryVariables } from 'shared/graphql/__generated__/graphql';
import { useLazyQuery } from '@apollo/client';
import { SEARCH_RAPORTTI_KEYS_ONLY } from 'shared/graphql/queries/reports';
import { zipContext } from 'shared/zipContext';

// Copied from zip-download.tsx
// TODO: rename when removing opensearch
export function ZipDownload(props: Props) {
  const { usedQueryVariables, resultTotalSize } = props;
  const { state, setState } = useContext(zipContext);
  const { error, isLoading } = state;

  const maxSize = 15 * 1000 * 1000 * 1000;
  const bigSize = 1 * 1000 + 1000 + 1000;

  const { t } = useTranslation(['common']);

  const [triggerKeyQuery, keyQuery] = useLazyQuery(SEARCH_RAPORTTI_KEYS_ONLY);

  const triggerKeyFetching = () => {
    if (usedQueryVariables) {
      triggerKeyQuery({
        variables: {
          raportti: usedQueryVariables.raportti,
          page: 1,
          page_size: cfg.paging.maxZipPageSize,
        },
      });
    }
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
    localStorage.setItem('pollingFileKey', pollingFileKey);
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

  useEffect(() => {
    if (state.zipUrl == undefined) triggerKeyQuery();
  }, [state]);

  return (
    <div>
      {!error && (
        <div className="flex gap-2 mb-1">
          {isLoading ? (
            <Spinner size={4} bottomMargin={0} />
          ) : (
            <Button
              size="sm"
              label={`${t('common:compress_all')} ${sizeformatter(
                resultTotalSize ? resultTotalSize : undefined,
              )}`}
              onClick={() => triggerKeyFetching()}
            />
          )}
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
    </div>
  );
}

type Props = {
  aggregationSize: number | undefined;
  usedQueryVariables?: Search_RaporttiQueryVariables;
  resultTotalSize: number | undefined;
  buttonType?: 'primary' | 'secondary' | 'tertiary';
};
