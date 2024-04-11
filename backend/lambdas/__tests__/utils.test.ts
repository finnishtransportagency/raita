import { getKeyData } from '../utils';

describe('getKeyData', () => {
  test('success: normal path', () => {
    const key = 'path/to/file/1/file_123.txt';
    const result = getKeyData(key);
    expect(result).toEqual({
      path: ['path', 'to', 'file', '1', 'file_123.txt'],
      rootFolder: 'path',
      fileName: 'file_123.txt',
      fileBaseName: 'file_123',
      fileSuffix: 'txt',
      keyWithoutSuffix: 'path/to/file/1/file_123',
    });
  });
  test('success: filename only', () => {
    const key = 'file_123.txt';
    const result = getKeyData(key);
    expect(result).toEqual({
      path: ['file_123.txt'],
      rootFolder: 'file_123.txt', // TODO: should this be empty?
      fileName: 'file_123.txt',
      fileBaseName: 'file_123',
      fileSuffix: 'txt',
      keyWithoutSuffix: 'file_123',
    });
  });
});
