import { render, logRoles, fireEvent } from '@testing-library/react';

import FilterControl from '../filter-control';

it('has a minimal working example', () => {
  const fn = jest.fn();

  const { container } = render(
    <FilterControl
      onUpdate={fn}
      entry={{ field: 'foo', value: 'bar', type: 'String', rel: 'eq' }}
      index={1}
      type="String"
    />,
  );
});

it('changes `rel` to new value', () => {
  const fn = jest.fn();

  const { container, getByRole, getAllByRole } = render(
    <FilterControl
      onUpdate={fn}
      entry={{
        field: 'foo',
        value: '123',
        type: 'IntIntervalInput',
        rel: 'gte',
      }}
      index={1}
      type="IntIntervalInput"
    />,
  );

  const combo1 = getByRole('combobox', { name: /common:rel_type/i });

  fireEvent.change(combo1, {
    target: { value: 'gte' },
  });

  fireEvent.change(combo1, {
    target: { value: 'lte' },
  });

  expect(fn.mock.calls[0]).toEqual([
    1,
    'foo',
    '123',
    'gte',
    'IntIntervalInput',
  ]);
  expect(fn.mock.calls[1]).toEqual([
    1,
    'foo',
    '123',
    'lte',
    'IntIntervalInput',
  ]);
});
