import { record, string, Arbitrary } from 'fast-check';
import { KeyValueItem } from './types';

//

/**
 * Arbitrary for generating { key, value } objects
 */
export const item: Arbitrary<KeyValueItem<string>> = record({
  key: string(),
  value: string(),
});
