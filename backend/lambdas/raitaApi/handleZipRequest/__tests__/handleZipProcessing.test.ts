import { mapFileKeysToZipFileNames } from '../handleZipProcessing';

describe('mapFileKeysToZipFileNames', () => {
  test('success: different kinds of keys', () => {
    const testKeys = [
      '/a/b/c/d/test.txt',
      '/a/b/c/d/test1.txt',
      'test2.txt',
      'a/b/c/test.test.3.txt',
    ];
    const result = mapFileKeysToZipFileNames(testKeys);
    expect(result).toEqual([
      'test.txt',
      'test1.txt',
      'test2.txt',
      'test.test.3.txt',
    ]);
  });
  test('success: duplicate filenames', () => {
    const testKeys = ['/a/b/test.txt', '/a/b/c/test.txt', 'test.txt'];
    const result = mapFileKeysToZipFileNames(testKeys);
    expect(result).toEqual(['test.txt', 'test_(1).txt', 'test_(2).txt']);
  });
});
