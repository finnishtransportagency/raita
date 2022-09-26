import { assert, property, string } from 'fast-check';
import { toItem } from '../util';

describe('utils', () => {
  describe('toItem', () => {
    it('creates { key, value } objects', () => {
      assert(
        property(string(), string(), (s1, s2) =>
          expect(toItem(s1, s2)).toEqual({ key: s1, value: s2 }),
        ),
      );
    });
  });
});
