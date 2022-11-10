import { render } from '@testing-library/react';
import * as F from 'fast-check';

import { Pager } from '../pager';

const pagerPropsArb = F.record({
  count: F.constant(1),
  size: F.constant(1),
  page: F.constant(0),
});

describe('Pager', () => {
  test('basic', () => {
    F.assert(
      F.property(pagerPropsArb, props => {
        expect(() => {
          render(<Pager {...props} />);
        }).not.toThrow();
      }),
    );
  });
});
