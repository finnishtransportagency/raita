import * as F from 'fast-check';
import { fireEvent, logDOM, logRoles, render } from '@testing-library/react';

import Pager from '../pager';

describe('Pager', () => {
  test('base implementation', () => {
    const r = render(<Pager count={50} size={5} page={0} />);

    expect(r).toMatchSnapshot();
  });
});
