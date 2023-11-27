import ReactModal from 'react-modal';
import { clsx } from 'clsx';
import CloseIcon from 'components/icons/CloseIcon';

import css from './modal.module.css';

/**
 * Wrapper around ReactModal component with some default props and header
 */
const Modal = (props: ReactModal.Props) => {
  return (
    <ReactModal
      appElement={document.getElementById('__next') || undefined}
      overlayClassName={clsx(css['modal-overlay'])}
      bodyOpenClassName={clsx(css['modal-open'])}
      className={clsx(css['modal'])}
      {...props}
    >
      <div className={clsx(css['modal-header'])}>
        <button onClick={props.onRequestClose}>
          <CloseIcon />
        </button>
      </div>
      {props.children}
    </ReactModal>
  );
};

export default Modal;
