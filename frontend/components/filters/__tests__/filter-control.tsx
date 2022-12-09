import { render, logRoles, fireEvent } from '@testing-library/react';

import FilterControl from '../filter-control';

it('has a minimal working example', () => {
  const fn = jest.fn();

  const { container } = render(
    <FilterControl
      onUpdate={fn}
      entry={{ field: 'foo', value: 'bar', type: 'match', rel: 'eq' }}
      index={1}
      type={'text'}
    />,
  );
});

it('changes `rel` to `eq` if not doing something range-able and vice-versa', () => {
  const fn = jest.fn();

  const { container, getByRole, getAllByRole } = render(
    <FilterControl
      onUpdate={fn}
      entry={{ field: 'foo', value: '123', type: 'range', rel: 'gte' }}
      index={1}
      type={'long'}
    />,
  );

  const combo1 = getByRole('combobox', { name: /common:rel_type/i });

  fireEvent.change(combo1, {
    target: { value: 'eq' },
  });

  fireEvent.change(combo1, {
    target: { value: 'gte' },
  });

  expect(fn.mock.calls[0]).toEqual([1, 'foo', '123', 'eq', 'match']);
  expect(fn.mock.calls[1]).toEqual([1, 'foo', '123', 'gte', 'range']);
});
