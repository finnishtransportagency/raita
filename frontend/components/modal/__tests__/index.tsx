import { render } from '@testing-library/react';
import Modal from '../index';

test('Modal', () => {
  render(
    <Modal isOpen={true} appElement={document.body}>
      Test content
    </Modal>,
  );
});
