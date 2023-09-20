import { IExtractionSpec } from '../../../../types';
import { KeyData } from '../../../utils';
import { extractPathData } from '../pathDataParser';

jest.mock('../../../../utils/logger', () => {
  return {
    log: {
      warn: jest.fn(),
      info: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
    },
    logParsingException: {
      warn: jest.fn(),
      info: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
    },
  };
});

const extractionSpec = {
  fileNameExtractionSpec: {},
  folderTreeExtractionSpec: {
    '1': { name: 'part1' },
    '2': { name: 'part2' },
    '3': { name: 'part3' },
    '4': { name: 'filename' },
  },
  vRunFolderTreeExtractionSpec: {
    '1': { name: 'vPart1' },
    '2': { name: 'filename' },
  },
  fileContentExtractionSpec: {},
};

describe('extractPathData', () => {
  test('success: normal run', () => {
    const keyData: KeyData = {
      path: ['test', 'path', '1', 'test_123_456.txt'],
      rootFolder: 'test',
      fileName: 'test_123_456.txt',
      fileBaseName: 'test_123_456',
      fileSuffix: 'txt',
      keyWithoutSuffix: 'test/path/1/test_123_456',
    };

    const result = extractPathData(
      keyData,
      extractionSpec as any as IExtractionSpec,
    );
    expect(result).toEqual({
      part1: 'test',
      part2: 'path',
      part3: '1',
    });
  });
  test('success: virtual run', () => {
    const keyData: KeyData = {
      path: ['test', 'test_123_456.txt'],
      rootFolder: 'test',
      fileName: 'test_123_456.txt',
      fileBaseName: 'test_123_456',
      fileSuffix: 'txt',
      keyWithoutSuffix: 'test/test_123_456',
    };

    const result = extractPathData(
      keyData,
      extractionSpec as any as IExtractionSpec,
    );
    expect(result).toEqual({
      vPart1: 'test',
    });
  });
  test('fail: wrong amount of directories', () => {
    const keyData: KeyData = {
      path: ['test', 'path', 'test_123_456.txt'],
      rootFolder: 'test',
      fileName: 'test_123_456.txt',
      fileBaseName: 'test_123_456',
      fileSuffix: 'txt',
      keyWithoutSuffix: 'test/path/test_123_456',
    };

    const result = extractPathData(
      keyData,
      extractionSpec as any as IExtractionSpec,
    );
    expect(result).toEqual({});
  });
});
