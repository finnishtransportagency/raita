import { useQuery } from '@tanstack/react-query';
import saveAs from 'file-saver';
import { useTranslation } from 'next-i18next';
import { useEffect, useState } from 'react';

import { getPollingProgress } from 'shared/rest';
import Button from './button';
import { ProgressStatus } from 'shared/types';
import { Generate_Mittaus_CsvMutationVariables } from 'shared/graphql/__generated__/graphql';
import { useMutation } from '@apollo/client';
import { GENERATE_MITTAUS_CSV } from 'shared/graphql/queries/csv';

export function CsvDownload(props: Props) {
  const { t } = useTranslation(['common', 'metadata']);

  const [pollingKey, setPollingKey] = useState<string | null>(null);
  const [shouldPoll, setShouldPoll] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null); // TODO show somehow

  const [mutateGenerateCsv, generateCsvStatus] =
    useMutation(GENERATE_MITTAUS_CSV);

  const resetState = () => {
    setShouldPoll(false);
    setPollingKey(null);
    setDownloadUrl(null);
    setError(null);
  };

  useEffect(() => {
    if (props.resetState) {
      resetState();
    }
  }, [props.resetState]);

  const triggerCsvGeneration = () => {
    resetState();
    mutateGenerateCsv({ variables: props.queryVariables });
  };

  useEffect(() => {
    if (generateCsvStatus.loading || !generateCsvStatus.data || shouldPoll) {
      return;
    }
    const key = generateCsvStatus.data.generate_mittaus_csv.polling_key;
    console.log(key);
    setPollingKey(key);
    setShouldPoll(true);
  }, [generateCsvStatus.data]);

  useQuery(
    ['csv', pollingKey],
    () => {
      if (!pollingKey) return;
      return getPollingProgress(pollingKey);
    },
    {
      enabled: shouldPoll,
      refetchInterval: 3000,
      retry: 3,
      retryDelay: 3000,
      onSuccess: data => {
        if (
          data?.progressData?.status === ProgressStatus.SUCCESS &&
          data?.progressData?.url
        ) {
          resetState();
          setDownloadUrl(data.progressData.url);
        } else if (data?.progressData?.status === ProgressStatus.FAILED) {
          resetState();
          setError('TODO');
        }
      },
    },
  );

  const handleDownload = () => {
    if (downloadUrl) {
      saveAs(downloadUrl);
    }
  };

  return (
    <div>
      <div>
        <Button
          label={t('common:generate_csv')}
          onClick={triggerCsvGeneration}
        />
      </div>
      <div>
        {generateCsvStatus.data && (
          <>
            {downloadUrl ? (
              <Button label={t('common:download')} onClick={handleDownload} />
            ) : (
              <Button label={t('common:loading')} disabled onClick={() => {}} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

type Props = {
  queryVariables: Generate_Mittaus_CsvMutationVariables;
  resetState: boolean;
};
