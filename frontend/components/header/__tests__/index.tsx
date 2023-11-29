import { render } from '@testing-library/react';

import Header from '../index';

test('Header', () => {
  const { getByText } = render(
    <Header title="test_title" headerText="test_header" />,
  );
  expect(getByText('test_header')).toBeTruthy();
});
