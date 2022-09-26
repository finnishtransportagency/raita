import { sample } from 'fast-check';
import { item } from './arbs';

/**
 * Generate `n` randomly generated { key, value } items.
 * Useful for dropdowns & co
 *
 * @param n
 * @returns
 */
export function keyValueItems(n: number = 10) {
  return sample(item, n);
}
