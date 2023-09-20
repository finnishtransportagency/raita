import { format } from 'date-fns';
import { IExtractionSpec, IExtractionSpecLabels } from '../../../../types';
import { KeyData } from '../../../utils';
import {
  extractFileNameData,
  parseFileNameParts,
  validateGenericFileNameStructureOrFail,
} from '../fileNameDataParser';

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

describe('parseFileNameParts', () => {
  test('success', () => {
    const extractionSpecLabels: IExtractionSpecLabels = {
      '1': { name: 'name' },
      '2': { name: 'count' },
      '3': { name: 'length' },
    };
    const fileNameParts = ['testName', '123', '100.5'];
    const result = parseFileNameParts(extractionSpecLabels, fileNameParts);
    expect(result).toEqual({
      name: 'testName',
      count: '123',
      length: '100.5',
    });
  });
  test('success with EMPTY suffix', () => {
    const extractionSpecLabels: IExtractionSpecLabels = {
      '1': { name: 'name' },
      '2': { name: 'test' },
    };
    const fileNameParts = ['testName', 'test', 'EMPTY'];
    const result = parseFileNameParts(extractionSpecLabels, fileNameParts);
    expect(result).toEqual({
      name: 'testName',
      test: 'test',
      isEmpty: true,
    });
  });
});
describe('validateGenericFileNameStructureOrFail', () => {
  test('success', () => {
    const extractionSpecLabels: IExtractionSpecLabels = {
      '1': { name: 'name' },
      '2': { name: 'test1' },
      '3': { name: 'test2' },
    };
    const fileName = 'test_123_456.txt';
    const fileNameParts = ['test', '123', '456'];
    const result = validateGenericFileNameStructureOrFail(
      fileName,
      extractionSpecLabels,
      fileNameParts,
    );
    expect(result).toBe(undefined);
  });
  test('success with EMPTY suffix', () => {
    const extractionSpecLabels: IExtractionSpecLabels = {
      '1': { name: 'name' },
      '2': { name: 'test1' },
      '3': { name: 'test2' },
    };
    const fileName = 'test_123_456_EMPTY.txt';
    const fileNameParts = ['test', '123', '456', 'EMPTY'];
    const result = validateGenericFileNameStructureOrFail(
      fileName,
      extractionSpecLabels,
      fileNameParts,
    );
    expect(result).toBe(undefined);
  });
  test('fail: too many name segments', () => {
    const extractionSpecLabels: IExtractionSpecLabels = {
      '1': { name: 'name' },
      '2': { name: 'test1' },
    };
    const fileName = 'test_123_456_.txt';
    const fileNameParts = ['test', '123', '456'];
    expect(() =>
      validateGenericFileNameStructureOrFail(
        fileName,
        extractionSpecLabels,
        fileNameParts,
      ),
    ).toThrow();
  });
  test('fail: too few name segments', () => {
    const extractionSpecLabels: IExtractionSpecLabels = {
      '1': { name: 'name' },
      '2': { name: 'test1' },
      '3': { name: 'test2' },
    };
    const fileName = 'test_123.txt';
    const fileNameParts = ['test', '123'];
    expect(() =>
      validateGenericFileNameStructureOrFail(
        fileName,
        extractionSpecLabels,
        fileNameParts,
      ),
    ).toThrow();
  });
  test('fail: too few name segments with EMPTY', () => {
    const extractionSpecLabels: IExtractionSpecLabels = {
      '1': { name: 'name' },
      '2': { name: 'test1' },
      '3': { name: 'test2' },
    };
    const fileName = 'test_123_EMPTY.txt';
    const fileNameParts = ['test', '123', 'EMPTY'];
    expect(() =>
      validateGenericFileNameStructureOrFail(
        fileName,
        extractionSpecLabels,
        fileNameParts,
      ),
    ).toThrow();
  });
});
describe('extractFileNameData', () => {
  const extractionSpec: IExtractionSpec['fileNameExtractionSpec'] = {
    txt: {
      '1': { name: 'name' },
      '2': { name: 'test1' },
      '3': { name: 'test2' },
    },
    csv: {
      '1': { name: 'name' },
      '2': { name: 'test1' },
      '3': { name: 'test2' },
    },
    pdf: {
      '1': { name: 'name' },
      '2': { name: 'test1' },
      '3': { name: 'test2' },
    },
    xlsx: {
      '1': { name: 'name' },
      '2': { name: 'test1' },
      '3': { name: 'test2' },
    },
    xls: {
      '1': { name: 'name' },
      '2': { name: 'test1' },
      '3': { name: 'test2' },
    },
  };
  test('success', () => {
    const keyData: KeyData = {
      path: ['test', 'path', 'test_123_456.txt'],
      rootFolder: 'test',
      fileName: 'test_123_456.txt',
      fileBaseName: 'test_123_456',
      fileSuffix: 'txt',
      keyWithoutSuffix: 'test/path/test_123_456',
    };
    const result = extractFileNameData(keyData, extractionSpec);
    expect(result).toEqual({
      file_type: 'txt',
      name: 'test',
      test1: '123',
      test2: '456',
    });
  });
  test('fail: too many file name segments', () => {
    const keyData: KeyData = {
      path: ['test', 'path', 'test_123_456_789.txt'],
      rootFolder: 'test',
      fileName: 'test_123_456_789.txt',
      fileBaseName: 'test_123_456_789',
      fileSuffix: 'txt',
      keyWithoutSuffix: 'test/path/test_123_456_789',
    };
    const result = extractFileNameData(keyData, extractionSpec);
    expect(result).toEqual({});
  });
  test('fail: missing keydata fields', () => {
    const keyData1 = {
      path: ['test', 'path', 'test_123_456_789.txt'],
      rootFolder: 'test',
      fileName: 'test_123_456_789.txt',
      fileBaseName: 'test_123_456_789',
      keyWithoutSuffix: 'test/path/test_123_456_789',
    };
    const keyData2 = {
      path: ['test', 'path', 'test_123_456_789.txt'],
      rootFolder: 'test',
      fileName: 'test_123_456_789.txt',
      fileSuffix: 'txt',
      keyWithoutSuffix: 'test/path/test_123_456_789',
    };
    expect(extractFileNameData(keyData1 as KeyData, extractionSpec)).toEqual(
      {},
    );
    expect(extractFileNameData(keyData2 as KeyData, extractionSpec)).toEqual(
      {},
    );
  });
  test('fail: wrong file type', () => {
    const keyData: KeyData = {
      path: ['test', 'path', 'test_123_456_789.exe'],
      rootFolder: 'test',
      fileName: 'test_123_456_789.exe',
      fileBaseName: 'test_123_456_789',
      fileSuffix: 'exe',
      keyWithoutSuffix: 'test/path/test_123_456_789',
    };
    expect(extractFileNameData(keyData, extractionSpec)).toEqual({});
  });
});
