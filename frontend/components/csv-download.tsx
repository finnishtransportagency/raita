import saveAs from 'file-saver';
import { useTranslation } from 'next-i18next';
import { useContext, useEffect, useState } from 'react';
import Button from './button';
import { Generate_Mittaus_CsvMutationVariables } from 'shared/graphql/__generated__/graphql';
import { useMutation } from '@apollo/client';
import { GENERATE_MITTAUS_CSV } from 'shared/graphql/queries/csv';
import { initialState, fileDownloadContext } from 'shared/fileDownloadContext';
import * as R from 'rambda';
import { Spinner } from './spinner';

export function CsvDownload(props: Props) {
  const { t } = useTranslation(['common', 'metadata']);

  const [shouldPoll, setShouldPoll] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null); // TODO show somehow
  const { state, setState } = useContext(fileDownloadContext);

  const [mutateGenerateCsv, generateCsvStatus] =
    useMutation(GENERATE_MITTAUS_CSV);

  const resetState = () => {
    setShouldPoll(false);
    setDownloadUrl(null);
    setError(null);
    setState(initialState);
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
    localStorage.setItem('pollingFileKey', key);
    setState(R.assoc('pollingFileKey', key));
    setState(R.assoc('isLoading', true));
    setState(R.assoc('shouldPoll', true));
  }, [generateCsvStatus.data]);

  return (
    <div>
      <div>
        {state.isLoading ? (
          <Spinner size={4} bottomMargin={0} />
        ) : (
          <Button
            label={t('common:generate_csv')}
            onClick={triggerCsvGeneration}
          />
        )}
      </div>
    </div>
  );
}

type Props = {
  queryVariables: Generate_Mittaus_CsvMutationVariables;
  resetState: boolean;
};
