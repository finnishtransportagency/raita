import { IExtractionSpec, IExtractionSpecLabels } from '../../../../types';
import { KeyData, RaitaParseError } from '../../../utils';
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
    const result = parseFileNameParts(extractionSpecLabels, fileNameParts, []);
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
    const result = parseFileNameParts(extractionSpecLabels, fileNameParts, []);
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
    ).toThrow(RaitaParseError);
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
    ).toThrow(RaitaParseError);
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
    ).toThrow(RaitaParseError);
  });
});
describe('extractFileNameData', () => {
  const testExtractionSpec: IExtractionSpec = {
    parserVersion: '0.0.1',
    fileContentExtractionSpec: [],
    folderTreeExtractionSpec: {},
    vRunFolderTreeExtractionSpec: {},
    fileNameExtractionSpec: {
      txt: [
        {
          '1': { name: 'name' },
          '2': { name: 'test1' },
          '3': { name: 'test2' },
        },
      ],
      csv: [
        {
          '1': { name: 'name' },
          '2': { name: 'test1' },
          '3': { name: 'test2' },
        },
      ],
      pdf: [
        {
          '1': { name: 'name' },
          '2': { name: 'test1' },
          '3': { name: 'test2' },
        },
      ],
      xlsx: [
        {
          '1': { name: 'name' },
          '2': { name: 'test1' },
          '3': { name: 'test2' },
        },
      ],
      xls: [
        {
          '1': { name: 'name' },
          '2': { name: 'test1' },
          '3': { name: 'test2' },
        },
      ],
    },
    knownExceptions: {
      fileNameExtractionSpec: { containsUnderscore: [], removePrefix: [] },
      substituteValues: [],
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
      key: 'Meeri/test/path/test_123_456',
    };
    const result = extractFileNameData(keyData, testExtractionSpec);
    expect(result).toEqual({
      file_type: 'txt',
      name: 'test',
      test1: '123',
      test2: '456',
    });
  });
  test('success: multiple specs', () => {
    const keyData: KeyData = {
      path: ['test', 'path', 'test_123_456.txt'],
      rootFolder: 'test',
      fileName: 'test_123_456.txt',
      fileBaseName: 'test_123_456',
      fileSuffix: 'txt',
      keyWithoutSuffix: 'test/path/test_123_456',
      key: 'Meeri/test/path/test_123_456',
    };
    const spec: IExtractionSpec = {
      ...testExtractionSpec,
      fileNameExtractionSpec: {
        txt: [
          {
            '1': { name: 'name' },
          },
          {
            '1': { name: 'name' },
            '2': { name: 'test1' },
            '3': { name: 'test2' },
          },
        ],
        csv: [],
        pdf: [],
        xlsx: [],
        xls: [],
      },
    };
    const result = extractFileNameData(keyData, spec);
    expect(result).toEqual({
      file_type: 'txt',
      name: 'test',
      test1: '123',
      test2: '456',
    });
  });
  test('success: submission report', () => {
    const keyData: KeyData = {
      path: [
        'test',
        'path',
        'P420016A68Z ASM 03 - Submission Report_20230213_TG_PI.xlsx',
      ],
      rootFolder: 'test',
      fileName: 'P420016A68Z ASM 03 - Submission Report_20230213_TG_PI.xlsx',
      fileBaseName: 'P420016A68Z ASM 03 - Submission Report_20230213_TG_PI',
      fileSuffix: 'xlsx',
      keyWithoutSuffix:
        'test/path/P420016A68Z ASM 03 - Submission Report_20230213_TG_PI.xlsx',
      key: 'Meeri/test/path/test_123_456',
    };
    const spec: IExtractionSpec = {
      ...testExtractionSpec,
      fileNameExtractionSpec: {
        xlsx: [
          {
            '1': { name: 'report_type' },
            '2': { name: 'inspection_date' },
          },
        ],
        txt: [],
        csv: [],
        pdf: [],
        xls: [],
      },
    };
    const result = extractFileNameData(keyData, spec);
    expect(result).toEqual({
      file_type: 'xlsx',
      report_type: 'P420016A68Z ASM 03 - Submission Report',
      inspection_date: '20230213',
    });
  });
  test('success: data field with underscore', () => {
    const keyData: KeyData = {
      path: ['test', 'path', 'test_part1_part2_test2.txt'],
      rootFolder: 'test',
      fileName: 'test_part1_part2_test2.txt',
      fileBaseName: 'test_part1_part2_test2',
      fileSuffix: 'txt',
      keyWithoutSuffix: 'test/path/test_part1_part2_test2',
      key: 'Meeri/test/path/test_123_456',
    };
    const spec: IExtractionSpec = {
      ...testExtractionSpec,
      fileNameExtractionSpec: {
        txt: [
          {
            '1': { name: 'value1' },
            '2': { name: 'value2' },
            '3': { name: 'value3' },
          },
        ],
        csv: [],
        pdf: [],
        xlsx: [],
        xls: [],
      },
      knownExceptions: {
        fileNameExtractionSpec: {
          containsUnderscore: [
            { name: 'dummy', value: 'does_not_exist' },
            { name: 'value2', value: 'part1_part2' },
          ],
          removePrefix: [],
        },
        substituteValues: [],
      },
    };
    const result = extractFileNameData(keyData, spec);
    expect(result).toEqual({
      file_type: 'txt',
      value1: 'test',
      value2: 'part1_part2',
      value3: 'test2',
    });
  });
  test('success: name only has one data field with multiple underscores', () => {
    const keyData: KeyData = {
      path: ['test', 'path', 'one_field_only.txt'],
      rootFolder: 'test',
      fileName: 'one_field_only.txt',
      fileBaseName: 'one_field_only',
      fileSuffix: 'txt',
      keyWithoutSuffix: 'test/path/one_field_only',
      key: 'Meeri/test/path/test_123_456',
    };
    const spec: IExtractionSpec = {
      ...testExtractionSpec,
      fileNameExtractionSpec: {
        txt: [
          {
            '1': { name: 'value1' },
          },
        ],
        csv: [],
        pdf: [],
        xlsx: [],
        xls: [],
      },
      knownExceptions: {
        fileNameExtractionSpec: {
          containsUnderscore: [{ name: 'value1', value: 'one_field_only' }],
          removePrefix: [],
        },
        substituteValues: [],
      },
    };
    const result = extractFileNameData(keyData, spec);
    expect(result).toEqual({
      file_type: 'txt',
      value1: 'one_field_only',
    });
  });
  test('fail: name has known value with underscore in wrong slot', () => {
    const keyData: KeyData = {
      path: ['test', 'path', 'UNDERSCORE_VALUE_test.txt'],
      rootFolder: 'test',
      fileName: 'UNDERSCORE_VALUE_test.txt',
      fileBaseName: 'UNDERSCORE_VALUE_test',
      fileSuffix: 'txt',
      keyWithoutSuffix: 'test/path/UNDERSCORE_VALUE_test',
      key: 'Meeri/test/path/test_123_456',
    };
    const spec: IExtractionSpec = {
      ...testExtractionSpec,
      fileNameExtractionSpec: {
        txt: [
          {
            '1': { name: 'value1' },
            '2': { name: 'value2' },
          },
        ],
        csv: [],
        pdf: [],
        xlsx: [],
        xls: [],
      },
      knownExceptions: {
        fileNameExtractionSpec: {
          containsUnderscore: [{ name: 'value2', value: 'UNDERSCORE_VALUE' }],
          removePrefix: [],
        },
        substituteValues: [],
      },
    };
    expect(() => extractFileNameData(keyData, spec)).toThrow(RaitaParseError);
  });
  test('fail: too many file name segments', () => {
    const keyData: KeyData = {
      path: ['test', 'path', 'test_123_456_789.txt'],
      rootFolder: 'test',
      fileName: 'test_123_456_789.txt',
      fileBaseName: 'test_123_456_789',
      fileSuffix: 'txt',
      keyWithoutSuffix: 'test/path/test_123_456_789',
      key: 'Meeri/test/path/test_123_456',
    };

    expect(() => extractFileNameData(keyData, testExtractionSpec)).toThrow(
      RaitaParseError,
    );
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
    expect(() =>
      extractFileNameData(keyData1 as KeyData, testExtractionSpec),
    ).toThrow(RaitaParseError);
    expect(() =>
      extractFileNameData(keyData2 as KeyData, testExtractionSpec),
    ).toThrow(RaitaParseError);
  });
  test('fail: wrong file type', () => {
    const keyData: KeyData = {
      path: ['test', 'path', 'test_123_456_789.exe'],
      rootFolder: 'test',
      fileName: 'test_123_456_789.exe',
      fileBaseName: 'test_123_456_789',
      fileSuffix: 'exe',
      keyWithoutSuffix: 'test/path/test_123_456_789',
      key: 'Meeri/test/path/test_123_456_789',
    };
    expect(() => extractFileNameData(keyData, testExtractionSpec)).toThrow(
      RaitaParseError,
    );
  });
  test('fail: additional VR_ prefix', () => {
    const keyData: KeyData = {
      path: ['test', 'path', 'VR_test_123_456.txt'],
      rootFolder: 'test',
      fileName: 'VR_test_123_456.txt',
      fileBaseName: 'VR_test_123_456',
      fileSuffix: 'txt',
      keyWithoutSuffix: 'VR_test/path/test_123_456',
      key: 'Meeri/VR_test/path/test_123_456',

    };
    expect(() => extractFileNameData(keyData, testExtractionSpec)).toThrow(
      RaitaParseError,
    );
  });
  test('success: remove additional VR_ prefix', () => {
    const keyData: KeyData = {
      path: ['test', 'path', 'VR_test_123_456.txt'],
      rootFolder: 'test',
      fileName: 'VR_test_123_456.txt',
      fileBaseName: 'VR_test_123_456',
      fileSuffix: 'txt',
      keyWithoutSuffix: 'test/path/VR_test_123_456',
      key: 'Meeri/test/path/VR_test_123_456',
    };
    const specWithRemovePrefix: IExtractionSpec = {
      ...testExtractionSpec,
      knownExceptions: {
        fileNameExtractionSpec: {
          containsUnderscore: [],
          removePrefix: ['VR_'],
        },
        substituteValues: [],
      },
    };
    expect(extractFileNameData(keyData, specWithRemovePrefix)).toEqual({
      file_type: 'txt',
      name: 'test',
      test1: '123',
      test2: '456',
    });
  });
});
