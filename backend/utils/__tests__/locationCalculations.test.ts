import { Decimal } from '@prisma/client/runtime/library';

import { roundToRataosoitePrecision } from '../locationCalculations';

describe('roundToRataosoitePrecision', () => {
  test('success: normal operation', async () => {
    expect(roundToRataosoitePrecision(new Decimal(1))).toEqual(new Decimal(1));
    expect(roundToRataosoitePrecision(new Decimal(0))).toEqual(new Decimal(0));
    expect(roundToRataosoitePrecision(new Decimal(3.25))).toEqual(
      new Decimal(3.25),
    );
    expect(roundToRataosoitePrecision(new Decimal(0.1))).toEqual(
      new Decimal(0),
    );
    expect(roundToRataosoitePrecision(new Decimal(12.261))).toEqual(
      new Decimal(12.25),
    );
    expect(roundToRataosoitePrecision(new Decimal(100.874))).toEqual(
      new Decimal(100.75),
    );
    expect(roundToRataosoitePrecision(new Decimal(100.875))).toEqual(
      new Decimal(101),
    );
  });
});
