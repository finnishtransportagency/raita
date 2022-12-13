import { render } from '@testing-library/react';

import { noop } from 'shared/util';

import Dropdown from '../index';

test('Dropdown', () => {
  render(<Dropdown onChange={noop} items={[]} />);
});
