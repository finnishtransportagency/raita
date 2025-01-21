import { IExtractionSpec } from '../../../../types';
import { KeyData, RaitaParseError } from '../../../utils';
import {
  determineParsingSpecForPathParsing,
  extractPathData,
} from '../pathDataParser';

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

const extractionSpec: IExtractionSpec = {
  parserVersion: '0.0.1',
  fileNameExtractionSpec: { csv: [], txt: [], pdf: [], xlsx: [], xls: [] },
  folderTreeExtractionSpecs: [
    {
      name: 'v1',
      spec: {
        '1': { name: 'part1' },
        '2': { name: 'part2' },
        '3': { name: 'part3' },
        '4': { name: 'part4' },
        '5': { name: 'zipFile' },
        '6': { name: 'directory' },
        '7': { name: 'filename' },
      },
    },
    {
      name: 'v1WithTestTrackExtraInfo',
      spec: {
        '1': { name: 'part1' },
        '2': { name: 'part2' },
        '3': { name: 'part3' },
        '4': { name: 'part4' },
        '5': { name: 'zipFile' },
        '6': { name: 'extraInfo' },
        '7': { name: 'directory' },
        '8': { name: 'filename' },
      },
    },
    {
      name: 'virtualRun',
      spec: {
        '1': { name: 'vPart1' },
        '2': { name: 'filename' },
      },
    },
  ],
  fileContentExtractionSpec: [],
  knownExceptions: {
    fileNameExtractionSpec: { containsUnderscore: [], removePrefix: [] },
    substituteValues: [],
  },
};

describe('extractPathData', () => {
  test('success: normal run', () => {
    const keyData: KeyData = {
      path: ['test', 'path', '1', 'a', 'zip', 'b', 'test_123_456.txt'],
      rootFolder: 'test',
      fileName: 'test_123_456.txt',
      fileBaseName: 'test_123_456',
      fileSuffix: 'txt',
      keyWithoutSuffix: 'test/path/1/a/zip/b/test_123_456',
    };

    const result = extractPathData(keyData, extractionSpec);
    expect(result).toEqual({
      part1: 'test',
      part2: 'path',
      part3: '1',
      part4: 'a',
      zipFile: 'zip',
      directory: 'b',
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

    const result = extractPathData(keyData, extractionSpec);
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

    expect(() => extractPathData(keyData, extractionSpec)).toThrow(
      RaitaParseError,
    );
  });
  test('success: OHL substitution', () => {
    const keyData: KeyData = {
      path: [
        'test',
        'path',
        'here',
        'Over Head Line Geometry',
        'test_123_456.xlsx',
      ],
      rootFolder: 'test',
      fileName: 'test_123_456.xlsx',
      fileBaseName: 'test_123_456',
      fileSuffix: 'xlsx',
      keyWithoutSuffix: 'test/path/here/Over Head Line Geometry/test_123_456',
    };
    const folderTreeExtractionSpecs = [
      {
        name: 'v1',
        spec: {
          '1': { name: 'part1' },
          '2': { name: 'part2' },
          '3': { name: 'part3' },
          '4': { name: 'system' },
          '5': { name: 'filename' },
        },
      },
    ];

    expect(
      extractPathData(keyData, {
        ...extractionSpec,
        folderTreeExtractionSpecs,
        knownExceptions: {
          substituteValues: [
            {
              key: 'system',
              oldValue: 'Over Head Line Geometry',
              newValue: 'OHL',
            },
          ],
        },
      } as any as IExtractionSpec),
    ).toEqual({
      part1: 'test',
      part2: 'path',
      part3: 'here',
      system: 'OHL',
    });
  });
});

describe('determineParsingSpec', () => {
  test('success: v1', () => {
    const testKeyData: KeyData = {
      path: ['test', 'path', '1', 'a', 'zip', 'b', 'test_123_456.txt'],
      rootFolder: '',
      fileName: '',
      fileBaseName: '',
      fileSuffix: '',
      keyWithoutSuffix: '',
    };
    expect(
      determineParsingSpecForPathParsing(testKeyData, extractionSpec),
    ).toEqual(
      extractionSpec.folderTreeExtractionSpecs.find(s => s.name === 'v1'),
    );
  });
  test('success: virtualRun', () => {
    const testKeyData: KeyData = {
      path: ['test', 'filename.txt'],
      rootFolder: '',
      fileName: '',
      fileBaseName: '',
      fileSuffix: '',
      keyWithoutSuffix: '',
    };
    expect(
      determineParsingSpecForPathParsing(testKeyData, extractionSpec),
    ).toEqual(
      extractionSpec.folderTreeExtractionSpecs.find(
        s => s.name === 'virtualRun',
      ),
    );
  });
  test('success: v1WithTestTrackExtraInfo', () => {
    const testKeyData: KeyData = {
      path: [
        'test',
        'path',
        '1',
        'a',
        'zip',
        'TEST TRACK',
        'b',
        'test_123_456.txt',
      ],
      rootFolder: '',
      fileName: '',
      fileBaseName: '',
      fileSuffix: '',
      keyWithoutSuffix: '',
    };
    expect(
      determineParsingSpecForPathParsing(testKeyData, extractionSpec),
    ).toEqual(
      extractionSpec.folderTreeExtractionSpecs.find(
        s => s.name === 'v1WithTestTrackExtraInfo',
      ),
    );
  });
  test('failure: v1WithTestTrackExtraInfo with wrong extra info', () => {
    const testKeyData: KeyData = {
      path: [
        'test',
        'path',
        '1',
        'a',
        'zip',
        'WRONG EXTRA INFO HERE',
        'b',
        'test_123_456.txt',
      ],
      rootFolder: '',
      fileName: '',
      fileBaseName: '',
      fileSuffix: '',
      keyWithoutSuffix: '',
    };
    expect(
      determineParsingSpecForPathParsing(testKeyData, extractionSpec),
    ).toEqual(null);
  });
});
