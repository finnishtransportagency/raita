import { render } from '@testing-library/react';

import Navigation from '../index';

test('Navigation', () => {
  render(<Navigation pages={[]} />);
});
