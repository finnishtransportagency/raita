import { render } from '@testing-library/react';

import MultiChoice from '../multi-choice';

it('has a minimal working example', () => {
  const fn = jest.fn();

  render(<MultiChoice items={[]} onChange={fn} />);
});
