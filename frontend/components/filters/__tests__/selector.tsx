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

  const { container, getByText } = render(
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

  // expect(await findAllByRole('combobox')).toHaveLength(filterCount);

  fireEvent.click(getByLabelText('common:add_filter'));

  expect(await findAllByRole('combobox')).toHaveLength(filterCount + 1);

  // const combo1 = await findAllByRole('combobox');
  // const x = combo1[filterCount - 1];
  // fireEvent.change(x, { target: { value: '123' } });

  // fireEvent.click(getAllByLabelText('common:remove_filter')[0]);

  // expect(await findAllByRole('combobox')).toHaveLength(filterCount);

  // expect(fn).toHaveBeenCalled();
});

it('allows to update a filter', async () => {
  const fn = jest.fn();

  const { container, debug, getByRole } = render(
    <Selector
      fields={{ foo: { type: 'text' } }}
      filters={[{ field: 'foo', value: 'bar' }]}
      onChange={fn}
    />,
  );

  fireEvent.change(getByRole('textbox'), { target: { value: 'foo' } });

  expect(fn.mock.calls[0][0]).toEqual([{ field: 'foo', value: 'bar' }]);
  expect(fn.mock.calls[1][0]).toEqual([{ field: 'foo', value: 'foo' }]);
});

it('allows to remove a filter', async () => {
  const fn = jest.fn();

  const { container, getByRole } = render(
    <Selector
      fields={{ foo: { type: 'text' } }}
      filters={[{ field: 'foo', value: 'bar' }]}
      onChange={fn}
    />,
  );

  // Ensure the initial state contains a filter
  expect(fn).toHaveBeenLastCalledWith([{ field: 'foo', value: 'bar' }]);

  fireEvent.click(getByRole('button', { name: 'common:remove_filter' }));

  // After removing it, ensure it's actually removed
  expect(fn).toHaveBeenLastCalledWith([]);
});

// it('herpy derps', () => {
//   const fn = jest.fn();

//   const { debug } = render(
//     <Selector
//       fields={{ asd: { type: 'text' } }}
//       onChange={fs => {
//         // console.log({ fs });
//       }}
//     />,
//   );
// });
