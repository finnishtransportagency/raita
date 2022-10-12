import { render } from '@testing-library/react';

import Dropdown from '../index';

test('Dropdown', () => {
  render(<Dropdown items={[]} />);
});
