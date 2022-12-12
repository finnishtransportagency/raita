import { fireEvent, logRoles, render } from '@testing-library/react';

import Selector, { FieldDict } from '../selector';

const fields: FieldDict = {
  foo: { type: 'text' },
  bar: { type: 'bool' },
  top: { type: 'long' },
  kek: { type: 'date' },
};

it('has a minimal working example', () => {
  const callArgs = [
    { field: '__EMPTY__' },
    { field: 'inspection_date' },
    { field: '__EMPTY__' },
  ];

  const fn = jest.fn();

  render(
    <Selector
      fields={{
        foo: { type: 'text' },
        bar: { type: 'bool' },
        top: { type: 'long' },
        kek: { type: 'date' },
      }}
      filters={[
        { field: 'foo', value: '' },
        { field: 'bar', value: '' },
        { field: 'top', value: '' },
        { field: 'kek', value: '' },
      ]}
      onChange={fn}
    />,
  );
});

it('allows to add a filter', async () => {
  const fn = jest.fn();

  const { findAllByRole, queryAllByRole, getByLabelText } = render(
    <Selector fields={{ foo: { type: 'text' } }} onChange={fn} />,
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
      fields={{ foo: { type: 'text' } }}
      filters={[{ field: 'foo', value: 'bar', rel: 'eq', type: 'match' }]}
      onChange={fn}
    />,
  );

  fireEvent.change(getByRole('textbox'), { target: { value: 'foo' } });

  expect(fn.mock.calls[0][0]).toEqual([
    { field: 'foo', value: 'bar', rel: 'eq', type: 'match' },
  ]);
  expect(fn.mock.calls[1][0]).toEqual([
    { field: 'foo', value: 'foo', type: 'match', rel: 'eq' },
  ]);
});

it('allows to remove a filter', async () => {
  const fn = jest.fn();

  const { getByRole } = render(
    <Selector
      fields={{ foo: { type: 'text' } }}
      filters={[{ field: 'foo', value: 'bar', rel: 'eq', type: 'match' }]}
      onChange={fn}
    />,
  );

  // Ensure the initial state contains a filter
  expect(fn).toHaveBeenLastCalledWith([
    { field: 'foo', value: 'bar', rel: 'eq', type: 'match' },
  ]);

  fireEvent.click(getByRole('button', { name: 'common:remove_filter' }));

  // After removing it, ensure it's actually removed
  expect(fn).toHaveBeenLastCalledWith([]);
});
