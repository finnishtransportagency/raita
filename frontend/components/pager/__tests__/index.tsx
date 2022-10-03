import { render } from '@testing-library/react';

import Pager from '../index';

test('Pager', () => {
  render(<Pager pages={[]} />);
});
