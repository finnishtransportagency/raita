import ReactModal from 'react-modal';
import { clsx } from 'clsx';
import { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import css from './modal.module.css';

/**
 * Wrapper around ReactModal component with some default props and header
 */
const Modal = (props: ReactModal.Props & { headerText?: string }) => {
  const { t } = useTranslation(['common']);

  useEffect(() => {
    const root = document.getElementById('__next');
    if (root) {
      ReactModal.setAppElement(root);
    }
  }, []);
  return (
    <ReactModal
      overlayClassName={clsx(css['modal-overlay'])}
      bodyOpenClassName={clsx(css['modal-open'])}
      className={clsx(css['modal'])}
      {...props}
    >
      <div className={clsx(css['modal-header'])}>
        {props.headerText && (
          <h2 className={clsx(css['modal-header-heading'])}>
            {props.headerText}
          </h2>
        )}
        <button onClick={props.onRequestClose}>
          <FontAwesomeIcon
            className="h-5 w-5"
            icon={faXmark}
            title={t('common:close') || ''}
          />
        </button>
      </div>
      {props.children}
    </ReactModal>
  );
};

export default Modal;
