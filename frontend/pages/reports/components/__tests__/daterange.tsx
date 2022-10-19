import { render } from '@testing-library/react';
import * as F from 'fast-check';

import { DateRange } from '../daterange';

const rangeArb = F.record({
  start: F.date(),
  end: F.date(),
});

/**
 * FastCheck arbitrary describing props for testing `DateRange`
 */
const dateRangeProps = F.record({
  range: rangeArb,
  onUpdate: F.constant(() => {}),
});

describe('DateRange', () => {
  test('basic', () => {
    F.assert(
      F.property(dateRangeProps, props => {
        expect(() => {
          render(<DateRange {...props} />);
        }).not.toThrow();
      }),
    );
  });
});
