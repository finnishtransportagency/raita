/**
 * Fastcheck arbitraries
 */
import { record, string, Arbitrary, asciiString } from 'fast-check';
import { KeyValueItem } from './types';

//

/**
 * Arbitrary for generating { key, value } objects
 */
export const item: Arbitrary<KeyValueItem<string>> = record({
  key: asciiString(),
  value: asciiString(),
});
