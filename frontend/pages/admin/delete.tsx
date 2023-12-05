import { useState } from 'react';
import type { NextPage } from 'next';
import { clsx } from 'clsx';
import { useTranslation } from 'next-i18next';
import { marked } from 'marked';

import instructionData from 'shared/doc/delete_instructions.md';
import { Button, TextInput, Modal } from 'components';
import { makeQuery } from 'shared/query-builder';
import css from './delete.module.css';
import markdownCss from '../../styles/markdown.module.css';
import { useSearch } from 'shared/hooks';
import { postDeleteRequest } from 'shared/rest';
import { DeleteResponse } from 'shared/types';

const DeleteIndex: NextPage = () => {
  const { t } = useTranslation(['common', 'admin']);

  const [prefixInput, setPrefixInput] = useState('');
  const [confirmInput, setConfirmInput] = useState('');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [deleteResult, setDeleteResult] = useState<DeleteResponse | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [deleteIsConfirmed, setDeleteIsConfirmed] = useState(false);

  const filesToDeleteMutation = useSearch();

  const fetchFilesToBeDeleted = () => {
    const query = makeQuery(
      [{ field: 'key.keyword', type: 'prefix', value: prefixInput }],
      { paging: { size: 0, curPage: 1 }, keyFn: s => s },
    );
    filesToDeleteMutation.mutate(query);
  };

  const showConfirmationModal = () => {
    fetchFilesToBeDeleted();
    setConfirmModalOpen(true);
  };

  const deleteFiles = async () => {
    if (!deleteIsConfirmed) {
      return;
    }
    setDeleteInProgress(true);
    try {
      const response = await postDeleteRequest(prefixInput);
      setDeleteResult(response);
      setDeleteInProgress(false);
      setConfirmModalOpen(false);
      setResultModalOpen(true);
      // TODO: fetch logs?
    } catch (err: any) {
      setDeleteInProgress(false);
      alert(`${t('admin:delete_error')} ${err.message ?? err}`);
    }
  };

  const onCancelConfirmation = () => {
    if (deleteInProgress) {
      return;
    }
    filesToDeleteMutation.reset();
    setConfirmModalOpen(false);
    setDeleteIsConfirmed(false);
    setConfirmInput('');
    setDeleteInProgress(false);
  };

  const resetAll = () => {
    onCancelConfirmation();
    setResultModalOpen(false);
    setPrefixInput('');
    setDeleteResult(null);
  };

  const onConfirmInputChange = (inputText: string) => {
    setConfirmInput(inputText);
    if (inputText === filesToDeleteMutation.data?.total.toString()) {
      setDeleteIsConfirmed(true);
    } else {
      setDeleteIsConfirmed(false);
    }
  };

  const readyToDelete =
    confirmModalOpen &&
    deleteIsConfirmed &&
    filesToDeleteMutation.data &&
    filesToDeleteMutation.data.total > 0 &&
    !deleteInProgress;
  return (
    <div>
      <h1>{t('admin:delete_page_title')}</h1>
      <div
        className={clsx(markdownCss['markdown-content'])}
        dangerouslySetInnerHTML={{
          __html: marked.parse(instructionData),
        }}
      />
      <TextInput
        onUpdate={setPrefixInput}
        value={prefixInput}
        placeholder={t('admin:delete_input_placeholder') || ''}
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
        contentLabel={t('admin:delete_confirm_heading') || ''}
        headerText={t('admin:delete_confirm_heading') || ''}
      >
        <div>
          <p>{t('admin:delete_path_info', { path: prefixInput })}</p>
          {filesToDeleteMutation.isLoading && t('admin:delete_files_loading')}
          {!!filesToDeleteMutation.error && t('admin:delete_files_fetch_error')}
          {filesToDeleteMutation.data &&
            (filesToDeleteMutation.data.total === 0 ? (
              <p>{t('admin:delete_files_not_found')}</p>
            ) : (
              <>
                <p>
                  {t('admin:delete_counts', {
                    count: filesToDeleteMutation.data.total,
                  })}
                </p>
                <label>
                  {t('admin:delete_confirmation')}
                  <TextInput
                    onUpdate={onConfirmInputChange}
                    value={confirmInput}
                    placeholder={t('admin:delete_confirm_placeholder') || ''}
                    resetSearchText={false}
                    className={clsx(css.textInput)}
                  />
                </label>
              </>
            ))}
        </div>

        <Button
          onClick={deleteFiles}
          disabled={!readyToDelete}
          label={t('admin:delete_label')}
        />
        <Button
          onClick={() => onCancelConfirmation()}
          disabled={deleteInProgress}
          label={t('common:cancel')}
        />
        {deleteInProgress && <p>{t('admin:delete_in_progress')}</p>}
      </Modal>
      <Modal
        isOpen={resultModalOpen}
        onRequestClose={resetAll}
        contentLabel={t('admin:delete_result_heading') || ''}
        headerText={t('admin:delete_result_heading') || ''}
      >
        {deleteResult && (
          <div>
            {t('admin:delete_result', {
              zipCount: deleteResult.receptionDeleteCount,
              fileCount: deleteResult.inspectionDeleteCount,
              metaDataCount: deleteResult.metadataDeleteCount,
            })}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DeleteIndex;
