import * as F from 'fast-check';

import { prefix, toUndefined } from 'shared/util';

const strOpts: F.StringSharedConstraints = {
  minLength: 1,
};

/**
 * Generate a string of _at least_ one character (`F.string` can by default generate empty strings)
 * @returns
 */
const str1 = () => F.string(strOpts);

describe('Util', () => {
  test('prefix', () => {
    F.assert(
      F.property(str1(), str1(), (a, b) => prefix(a, b) === [a, b].join('')),
    );
  });

  test('toUndefined', () => {
    F.assert(
      F.property(str1(), x => {
        expect(toUndefined(x)).toBeUndefined();
      }),
    );
  });
});
