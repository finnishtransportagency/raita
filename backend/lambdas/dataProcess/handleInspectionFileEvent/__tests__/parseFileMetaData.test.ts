import { IExtractionSpec } from '../../../../types';
import { KeyData } from '../../../utils';
import { parseFileMetadata } from '../parseFileMetadata';
import { stringToStream } from './testUtils';

const ISODateRegexp =
  /[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}Z/;

jest.mock('../../../../utils/logger', () => {
  return {
    log: {
      warn: jest.fn(),
      info: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    },
    logParsingException: {
      warn: jest.fn(),
      info: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    },
  };
});

const extractionSpec: IExtractionSpec = {
  fileNameExtractionSpec: {
    txt: [
      {
        '1': { name: 'nameOnly1' },
        '2': { name: 'overlapping' },
        '3': { name: 'nameOnly2', parseAs: 'integer' },
      },
    ],
    csv: [
      {
        '1': { name: 'nameOnly1' },
        '2': { name: 'overlapping' },
        '3': { name: 'nameOnly2', parseAs: 'integer' },
      },
    ],
    pdf: [
      {
        '1': { name: 'nameOnly1' },
        '2': { name: 'overlapping' },
        '3': { name: 'nameOnly2', parseAs: 'integer' },
      },
    ],
    xlsx: [
      {
        '1': { name: 'nameOnly1' },
        '2': { name: 'overlapping' },
        '3': { name: 'nameOnly2', parseAs: 'integer' },
      },
    ],
    xls: [
      {
        '1': { name: 'nameOnly1' },
        '2': { name: 'overlapping' },
        '3': { name: 'nameOnly2', parseAs: 'integer' },
      },
    ],
  },
  folderTreeExtractionSpec: {
    '1': { name: 'pathOnly1' },
    '2': { name: 'pathOnly2' },
    '3': { name: 'overlapping' },
    '4': { name: 'filename' },
  },
  vRunFolderTreeExtractionSpec: {
    '1': { name: 'pathOnly1' },
    '2': { name: 'vPathOnly2' },
  },
  fileContentExtractionSpec: [
    {
      propertyKey: 'contentOnly1',
      pattern: {
        predefinedPatternId: 'colonSeparatedKeyValuePair',
        searchKey: 'VAL1',
      },
    },
    {
      propertyKey: 'contentOnly2',
      pattern: {
        predefinedPatternId: 'colonSeparatedKeyValuePair',
        searchKey: 'VAL2',
      },
      parseAs: 'integer',
    },
    {
      propertyKey: 'overlapping',
      pattern: {
        predefinedPatternId: 'colonSeparatedKeyValuePair',
        searchKey: 'OVERLAP',
      },
    },
  ],
  knownExceptions: {
    fileNameExtractionSpec: {
      containsUnderscore: [],
    },
  },
};

// hash for 'dummy' string
const dummyHash =
  'b5a2c96250612366ea272ffac6d9744aaf4b45aacd96aa7cfcb931ee3b558259';

const testFileBody = `ver. 5.67.53
VAL1: first value
VAL2: 123456
OVERLAP: FROMCONTENT

data here
`;
const testFileHash =
  'e53d3e1705050cad90935209f87b7ef494dcf68365f521693e06f1a5e8ac05fc';

describe('parseFileMetadata', () => {
  test('success: normal .txt', async () => {
    const keyData: KeyData = {
      path: ['test', 'path', 'FROMPATH', 'TEST_FROMNAME_112233.txt'],
      rootFolder: 'test',
      fileName: 'TEST_FROMNAME_112233.txt',
      fileBaseName: 'TEST_FROMNAME_112233',
      fileSuffix: 'txt',
      keyWithoutSuffix: 'test/path/FROMPATH/TEST_FROMNAME_112233',
    };
    console.log("moi");
    const fileData = {
      fileStream: stringToStream(testFileBody),
      tags: {}, // TODO what is this
    };
    const params = {
      keyData,
      file: fileData,
      spec: extractionSpec,
    };
    const result = await parseFileMetadata(params);
    expect(result).toEqual({
      errors: false,
      hash: testFileHash,
      metadata: {
        file_type: 'txt',
        pathOnly1: 'test',
        pathOnly2: 'path',
        nameOnly1: 'TEST',
        nameOnly2: 112233,
        contentOnly1: 'first value',
        contentOnly2: 123456,
        overlapping: 'FROMNAME',
        parsed_at_datetime: expect.stringMatching(ISODateRegexp),
      },
    });
  });
  test('partial: malformed filename, .csv', async () => {
    const keyData: KeyData = {
      path: ['test', 'path', 'FROMPATH', 'TOO_MAY_NAME_SEGMENTS_HERE.csv'],
      rootFolder: 'test',
      fileName: 'TOO_MAY_NAME_SEGMENTS_HERE.csv',
      fileBaseName: 'TOO_MAY_NAME_SEGMENTS_HERE',
      fileSuffix: 'csv',
      keyWithoutSuffix: 'test/path/FROMPATH/TOO_MAY_NAME_SEGMENTS_HERE',
    };
    const fileData = {
      fileStream: stringToStream('dummy'),
      tags: {}, // TODO what is this
    };
    const params = {
      keyData,
      file: fileData,
      spec: extractionSpec,
    };
    const result = await parseFileMetadata(params);
    expect(result).toEqual({
      errors: true,
      hash: dummyHash,
      metadata: {
        // data from name missing
        overlapping: 'FROMPATH',
        pathOnly1: 'test',
        pathOnly2: 'path',
        parsed_at_datetime: expect.stringMatching(ISODateRegexp),
      },
    });
  });
  test('partial: malformed path, .csv', async () => {
    const keyData: KeyData = {
      path: ['TOO', 'LONG', 'PATH', 'HERE', 'TEST_FROMNAME_112233.csv'],
      rootFolder: 'TOO',
      fileName: 'TEST_FROMNAME_112233.csv',
      fileBaseName: 'TEST_FROMNAME_112233',
      fileSuffix: 'csv',
      keyWithoutSuffix: 'TOO/LONG/PATH/HERE/TEST_FROMNAME_112233',
    };
    const fileData = {
      fileStream: stringToStream('dummy'),
      tags: {}, // TODO what is this
    };
    const params = {
      keyData,
      file: fileData,
      spec: extractionSpec,
    };
    const result = await parseFileMetadata(params);
    expect(result).toEqual({
      errors: true,
      hash: dummyHash,
      metadata: {
        // data from path missing
        file_type: 'csv',
        nameOnly1: 'TEST',
        nameOnly2: 112233,
        overlapping: 'FROMNAME',
        parsed_at_datetime: expect.stringMatching(ISODateRegexp),
      },
    });
  });
  test.skip('success: parse submission report .xlsx', () => {
    // TODO
  });
  test('partial: malformed filename, .txt', async () => {
    const keyData: KeyData = {
      path: ['test', 'path', 'FROMPATH', 'TOO_MAY_NAME_SEGMENTS_HERE.txt'],
      rootFolder: 'test',
      fileName: 'TOO_MAY_NAME_SEGMENTS_HERE.txt',
      fileBaseName: 'TOO_MAY_NAME_SEGMENTS_HERE',
      fileSuffix: 'txt',
      keyWithoutSuffix: 'test/path/FROMPATH/TOO_MAY_NAME_SEGMENTS_HERE',
    };
    const fileData = {
      fileStream: stringToStream(testFileBody),
      tags: {}, // TODO what is this
    };
    const params = {
      keyData,
      file: fileData,
      spec: extractionSpec,
    };
    const result = await parseFileMetadata(params);
    expect(result).toEqual({
      errors: true,
      hash: testFileHash,
      metadata: {
        // data from name missing
        pathOnly1: 'test',
        pathOnly2: 'path',
        contentOnly1: 'first value',
        contentOnly2: 123456,
        overlapping: 'FROMCONTENT',
        parsed_at_datetime: expect.stringMatching(ISODateRegexp),
      },
    });
  });
  test('partial: malformed path, .txt', async () => {
    const keyData: KeyData = {
      path: ['TOO', 'LONG', 'PATH', 'HERE', 'TEST_FROMNAME_112233.txt'],
      rootFolder: 'test',
      fileName: 'TEST_FROMNAME_112233.txt',
      fileBaseName: 'TEST_FROMNAME_112233',
      fileSuffix: 'txt',
      keyWithoutSuffix: 'TOO/LONG/PATH/HERE/TEST_FROMNAME_112233',
    };
    const fileData = {
      fileStream: stringToStream(testFileBody),
      tags: {}, // TODO what is this
    };
    const params = {
      keyData,
      file: fileData,
      spec: extractionSpec,
    };
    const result = await parseFileMetadata(params);
    expect(result).toEqual({
      errors: true,
      hash: testFileHash,
      metadata: {
        // data form path missing
        file_type: 'txt',
        nameOnly1: 'TEST',
        nameOnly2: 112233,
        contentOnly1: 'first value',
        contentOnly2: 123456,
        overlapping: 'FROMNAME',
        parsed_at_datetime: expect.stringMatching(ISODateRegexp),
      },
    });
  });
  test('partial: malformed content, .txt', async () => {
    const keyData: KeyData = {
      path: ['test', 'path', 'FROMPATH', 'TEST_FROMNAME_112233.txt'],
      rootFolder: 'test',
      fileName: 'TEST_FROMNAME_112233.txt',
      fileBaseName: 'TEST_FROMNAME_112233',
      fileSuffix: 'txt',
      keyWithoutSuffix: 'test/path/FROMPATH/TEST_FROMNAME_112233',
    };
    const fileData = {
      fileStream: stringToStream('dummy'),
      tags: {}, // TODO what is this
    };
    const params = {
      keyData,
      file: fileData,
      spec: extractionSpec,
    };
    const result = await parseFileMetadata(params);
    expect(result).toEqual({
      errors: false, // TODO: should this report errors if no metadata is found?
      hash: dummyHash,
      metadata: {
        // data from content missing
        file_type: 'txt',
        pathOnly1: 'test',
        pathOnly2: 'path',
        nameOnly1: 'TEST',
        nameOnly2: 112233,
        overlapping: 'FROMNAME',
        parsed_at_datetime: expect.stringMatching(ISODateRegexp),
      },
    });
  });
});
