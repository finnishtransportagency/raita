import { useState } from 'react';
import { clsx } from 'clsx';
import { useTranslation } from 'next-i18next';
import { marked } from 'marked';

import instructionData from 'shared/doc/manual_data_process_instructions.md';
import { Button, TextInput, Modal } from 'components';
import { makeQuery } from 'shared/query-builder';
import css from './delete.module.css';
import markdownCss from '../../styles/markdown.module.css';
import { useSearch } from 'shared/hooks';
import { postManualDataProcessRequest } from 'shared/rest';
import { ManualDataProcessRequest, RaitaNextPage } from 'shared/types';
import { RaitaRole } from 'shared/user';

const ProcessIndex: RaitaNextPage = () => {
  const { t } = useTranslation(['common', 'admin']);

  const [prefixInput, setPrefixInput] = useState('');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [processResult, setProcessResult] =
    useState<ManualDataProcessRequest | null>(null);
  const [processRequestInProgress, setProcessRequestInProgress] =
    useState(false);
  const [skipHashCheck, setSkipHashCheck] = useState(true);
  const [requireNewerParserVersion, setRequireNewerParserVersion] =
    useState(true);

  const filesToProcessMutation = useSearch();

  const fetchFilesToBeProcessed = () => {
    const query = makeQuery(
      [{ field: 'key.keyword', type: 'prefix', value: prefixInput }],
      { paging: { size: 0, curPage: 1 }, keyFn: s => s },
    );
    filesToProcessMutation.mutate(query);
  };

  const showConfirmationModal = () => {
    fetchFilesToBeProcessed();
    setConfirmModalOpen(true);
  };

  const processFiles = async () => {
    setProcessRequestInProgress(true);
    try {
      const response = await postManualDataProcessRequest(
        prefixInput,
        skipHashCheck,
        requireNewerParserVersion,
      );
      setProcessResult(response);
      setProcessRequestInProgress(false);
      setConfirmModalOpen(false);
      setResultModalOpen(true);
    } catch (err: any) {
      setProcessRequestInProgress(false);
      alert(`${t('admin:process_error')} ${err.message ?? err}`);
    }
  };

  const onCancelConfirmation = () => {
    if (processRequestInProgress) {
      return;
    }
    filesToProcessMutation.reset();
    setConfirmModalOpen(false);
    setProcessRequestInProgress(false);
  };

  const resetAll = () => {
    onCancelConfirmation();
    setResultModalOpen(false);
    setPrefixInput('');
    setProcessResult(null);
  };

  const readyToProcess =
    confirmModalOpen &&
    filesToProcessMutation.data &&
    filesToProcessMutation.data.total > 0 &&
    !processRequestInProgress;
  return (
    <div className="container mx-auto px-16 py-6">
      <div
        className={clsx(markdownCss['markdown-content'])}
        dangerouslySetInnerHTML={{
          __html: marked.parse(instructionData),
        }}
      />
      <TextInput
        onUpdate={setPrefixInput}
        value={prefixInput}
        placeholder={t('admin:process_input_placeholder') || ''}
        resetSearchText={false}
        className={clsx(css.textInput)}
      />
      <Button
        onClick={showConfirmationModal}
        label={t('common:next')}
        disabled={prefixInput.length === 0}
      />
      <Modal
        isOpen={confirmModalOpen}
        onRequestClose={() => onCancelConfirmation()}
        contentLabel={t('admin:process_confirm_heading') || ''}
        headerText={t('admin:process_confirm_heading') || ''}
      >
        <div>
          <p className="mb-4">
            {t('admin:process_path_info', { path: prefixInput })}
          </p>
          {filesToProcessMutation.isLoading && t('admin:process_files_loading')}
          {!!filesToProcessMutation.error &&
            t('admin:process_files_fetch_error')}
          {filesToProcessMutation.data &&
            (filesToProcessMutation.data.total === 0 ? (
              <p>{t('admin:process_files_not_found')}</p>
            ) : (
              <>
                <p>
                  {t('admin:process_counts_file', {
                    count: filesToProcessMutation.data.total,
                  })}
                  <div className="mb-2">
                    {t('admin:process_skip_hash_check_label')}
                    <label className="block">
                      <input
                        className="mr-1"
                        type="radio"
                        name="skip-hash-check"
                        value="false"
                        checked={!skipHashCheck}
                        onChange={e =>
                          e.target.checked && setSkipHashCheck(false)
                        }
                      />
                      {t('admin:process_skip_hash_check_no')}
                    </label>
                    <label className="block">
                      <input
                        className="mr-1"
                        type="radio"
                        name="skip-hash-check"
                        value="true"
                        checked={skipHashCheck}
                        onChange={e =>
                          e.target.checked && setSkipHashCheck(true)
                        }
                      />

                      {t('admin:process_skip_hash_check_yes')}
                    </label>
                  </div>
                  <div className="mb-2">
                    {t('admin:process_require_newer_version_label')}
                    <label className="block">
                      <input
                        className="mr-1"
                        type="radio"
                        name="require-newer-parser-version"
                        value="true"
                        checked={requireNewerParserVersion}
                        onChange={e =>
                          e.target.checked && setRequireNewerParserVersion(true)
                        }
                      />
                      {t('admin:process_require_newer_version_yes')}
                    </label>
                    <label className="block mb-2">
                      <input
                        className="mr-1"
                        type="radio"
                        name="require-newer-parser-version"
                        value="false"
                        checked={!requireNewerParserVersion}
                        onChange={e =>
                          e.target.checked &&
                          setRequireNewerParserVersion(false)
                        }
                      />
                      {t('admin:process_require_newer_version_no')}
                    </label>
                  </div>
                </p>
              </>
            ))}
        </div>

        <Button
          onClick={processFiles}
          disabled={!readyToProcess}
          label={t('admin:process_label')}
        />
        <Button
          onClick={() => onCancelConfirmation()}
          disabled={processRequestInProgress}
          label={t('common:cancel')}
        />
        {processRequestInProgress && <p>{t('admin:process_in_progress')}</p>}
      </Modal>
      <Modal
        isOpen={resultModalOpen}
        onRequestClose={resetAll}
        contentLabel={t('admin:process_result_heading') || ''}
        headerText={t('admin:process_result_heading') || ''}
      >
        {processResult && <div>{t('admin:process_started', {})}</div>}
      </Modal>
    </div>
  );
};

ProcessIndex.requiredRole = RaitaRole.Admin;

export default ProcessIndex;
