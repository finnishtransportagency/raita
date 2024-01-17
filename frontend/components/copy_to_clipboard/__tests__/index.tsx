import { render } from '@testing-library/react';
import CopyToClipboard from '../index';

test('CopyToClipboard', () => {
  render(<CopyToClipboard tooltipId="test" textToCopy="test" />);
});
