import { Decimal } from '@prisma/client/runtime/library';

/**
 * Round the given number (rataosoite) to nearest 0.25
 */
export function roundToRataosoitePrecision(rataosoite_metrit: Decimal) {
  {
    const converted = rataosoite_metrit.toNumber();
    const multiplied = converted * 4;
    const rounded = Math.round(multiplied);
    return new Decimal(rounded / 4);
  }
}
