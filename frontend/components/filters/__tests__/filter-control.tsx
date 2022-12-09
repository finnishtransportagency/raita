import { render, logRoles } from '@testing-library/react';

import FilterControl from '../filter-control';

it('has a minimal working example', () => {
  const fn = jest.fn();

  const { container } = render(
    <FilterControl
      onUpdate={fn}
      entry={{ field: 'foo', value: 'bar' }}
      index={1}
      type={'text'}
    />,
  );
});
