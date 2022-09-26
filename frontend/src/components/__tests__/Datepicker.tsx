import { render } from '@testing-library/react';
import { Datepicker } from '../Datepicker';

describe('Datepicker', () => {
  it('has a minimal working example', () => {
    render(<Datepicker caption={''} />);
  });
});
