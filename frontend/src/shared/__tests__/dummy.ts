import { assert, property } from 'fast-check';
import { item } from '../arbs';
import { keyValueItems } from '../dummy';

describe('dummy', () => {
  it('keyValueItems', () => {
    keyValueItems();
  });
});
