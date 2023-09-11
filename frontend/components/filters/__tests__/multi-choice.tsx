import { fireEvent, render, waitFor, screen } from '@testing-library/react';

import MultiChoice from '../multi-choice';
import Input from 'react-select/dist/declarations/src/components/Input';

it('has a minimal working example', () => {
  const fn = jest.fn();

  render(<MultiChoice items={[]} onChange={fn} resetFilters={false} />);
});

it('can select and clear elements', async () => {
  const fn = jest.fn();
  const testItems = [
    {
      label: 'test1',
      value: 'value1',
    },
    {
      label: 'test2',
      value: 'value2',
    },
  ];

  const { findByText, getByRole, findByRole } = render(
    <MultiChoice items={testItems} onChange={fn} resetFilters={false} />,
  );

  const input = getByRole('combobox');
  fireEvent.change(input, { target: { value: 't' } });
  const choice = await findByText(testItems[0].label);
  fireEvent.click(choice);
  expect(fn).lastCalledWith([testItems[0]]);

  const clearButton = await findByRole('button'); // should be only one role button
  fireEvent.click(clearButton);
  expect(fn).lastCalledWith([]);
});
