import { render } from '@testing-library/react';
import Button from '../index';

test('Button', () => {
  render(<Button onClick={() => {}} label="one" />);
});
