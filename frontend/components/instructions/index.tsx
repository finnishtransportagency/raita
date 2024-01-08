import Modal from 'components/modal';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { marked } from 'marked';
import clsx from 'clsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

import manualData from '../../shared/doc/manual.md';
import markdownCss from '../../styles/markdown.module.css';

/**
 * Render a button to display instructions
 */
const Instructions = (props: React.HTMLAttributes<HTMLDivElement>) => {
  const { t } = useTranslation(['common']);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div {...props}>
        <button onClick={() => setModalOpen(true)}>
          <FontAwesomeIcon
            className="w-6 h-6"
            icon={faInfoCircle}
            title={t('common:user_manual') || ''}
          />
        </button>
      </div>
      <Modal
        isOpen={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        contentLabel={t('common:user_manual') || ''}
      >
        <div
          className={clsx(markdownCss['markdown-content'])}
          dangerouslySetInnerHTML={{
            __html: marked.parse(manualData),
          }}
        ></div>
      </Modal>
    </>
  );
};

export default Instructions;
