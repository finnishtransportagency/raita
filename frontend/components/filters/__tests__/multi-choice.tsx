import { fireEvent, render } from '@testing-library/react';

import MultiChoice from '../multi-choice';

it('has a minimal working example', () => {
  const fn = jest.fn();

  render(<MultiChoice items={[]} onChange={fn} resetFilters={false} />);
});

it('can filter selectable elements', async () => {
  const fn = jest.fn();
  const testItems = [
    {
      key: 'test1',
      value: 'value1',
    },
    {
      key: 'test2',
      value: 'value2',
    },
    {
      key: 'other1',
      value: 'value3',
    },
  ];

  const { findByText, getByPlaceholderText, queryByText } = render(
    <MultiChoice items={testItems} onChange={fn} resetFilters={false} />,
  );

  const input = getByPlaceholderText('common:filter_options');
  fireEvent.change(input, { target: { value: 'test' } });
  expect(await findByText(testItems[0].key)).toBeTruthy();
  expect(await findByText(testItems[1].key)).toBeTruthy();
  expect(queryByText(testItems[2].key)).toBeFalsy();
});
