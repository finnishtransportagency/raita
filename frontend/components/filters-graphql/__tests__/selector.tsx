import { fireEvent, logRoles, render } from '@testing-library/react';

import Selector, { FieldDict } from '../selector';

it('has a minimal working example', () => {
  const fn = jest.fn();

  render(
    <Selector
      fields={{
        foo: { type: 'String' },
        bar: { type: 'Boolean' },
        top: { type: 'Int' },
        kek: { type: 'DateTimeIntervalInput' },
      }}
      filters={[
        { field: 'foo', value: '', type: 'String' },
        { field: 'bar', value: '', type: 'Boolean' },
        { field: 'top', value: '', type: 'Int' },
        { field: 'kek', value: '', type: 'DateTimeIntervalInput' },
      ]}
      onChange={fn}
      resetFilterSelector={false}
    />,
  );
});

it('allows to add a filter', async () => {
  const fn = jest.fn();

  const { findAllByRole, queryAllByRole, getByLabelText } = render(
    <Selector
      fields={{ foo: { type: 'String' } }}
      onChange={fn}
      resetFilterSelector={false}
    />,
  );

  const filterCount = queryAllByRole('combobox').length;

  expect(filterCount).toBe(0);

  fireEvent.click(getByLabelText('common:add_filter'));

  expect(await findAllByRole('combobox')).toHaveLength(filterCount + 1);
});

it('allows to update a filter', async () => {
  const fn = jest.fn();

  const { getByRole } = render(
    <Selector
      fields={{ foo: { type: 'String' } }}
      filters={[{ field: 'foo', value: 'bar', rel: 'eq', type: 'String' }]}
      onChange={fn}
      resetFilterSelector={false}
    />,
  );

  fireEvent.change(getByRole('textbox'), { target: { value: 'foo' } });

  expect(fn.mock.calls[0][0]).toEqual([
    { field: 'foo', value: 'bar', rel: 'eq', type: 'String' },
  ]);
  expect(fn.mock.calls[1][0]).toEqual([
    { field: 'foo', value: 'foo', type: 'String', rel: 'eq' },
  ]);
});

it('allows to remove a filter', async () => {
  const fn = jest.fn();

  const { getByRole } = render(
    <Selector
      fields={{ foo: { type: 'String' } }}
      filters={[{ field: 'foo', value: 'bar', rel: 'eq', type: 'String' }]}
      onChange={fn}
      resetFilterSelector={false}
    />,
  );

  // Ensure the initial state contains a filter
  expect(fn).toHaveBeenLastCalledWith([
    { field: 'foo', value: 'bar', rel: 'eq', type: 'String' },
  ]);

  fireEvent.click(getByRole('button', { name: 'common:remove_filter' }));

  // After removing it, ensure it's actually removed
  expect(fn).toHaveBeenLastCalledWith([]);
});
