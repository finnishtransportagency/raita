import * as F from 'fast-check';

import { fst, snd, prefix, toSearchQueryTerm } from 'shared/util';

const strOpts: F.StringSharedConstraints = {
  minLength: 1,
};

/**
 * Generate a string of _at least_ one character (`F.string` can by default generate empty strings)
 * @returns
 */
const str1 = () => F.string(strOpts);

describe('Util', () => {
  test('fst', () => {
    F.assert(
      F.property(F.tuple(str1(), str1()), ([a, b]) => fst([a, b]) === a),
    );
  });

  test('snd', () => {
    F.assert(
      F.property(F.tuple(str1(), str1()), ([a, b]) => snd([a, b]) === b),
    );
  });

  test('prefix', () => {
    F.assert(
      F.property(str1(), str1(), (a, b) => prefix(a, b) === [a, b].join('')),
    );
  });

  test('toSearchQueryTerm', () => {
    F.assert(
      F.property(str1(), str1(), (key, value) =>
        expect(toSearchQueryTerm(key, value)).toEqual({
          match: { [key]: value },
        }),
      ),
    );

    /** It also supports key transformation */
    F.assert(
      F.property(str1(), str1(), str1(), (key, value, keyPrefix) =>
        expect(
          toSearchQueryTerm(key, value, _key => [keyPrefix, _key].join('')),
        ).toEqual({
          match: { [[keyPrefix, key].join('')]: value },
        }),
      ),
    );
  });
});
