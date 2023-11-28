import ReactModal from 'react-modal';
import { clsx } from 'clsx';
import CloseIcon from 'components/icons/CloseIcon';

import css from './modal.module.css';
import { useEffect } from 'react';

/**
 * Wrapper around ReactModal component with some default props and header
 */
const Modal = (props: ReactModal.Props & { headerText?: string }) => {
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
          <CloseIcon />
        </button>
      </div>
      {props.children}
    </ReactModal>
  );
};

export default Modal;
