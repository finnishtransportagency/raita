import { IExtractionSpec } from '../../../../types';
import { KeyData } from '../../../utils';
import { generateMetadata, parseFileMetadata } from '../parseFileMetadata';
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
  parserVersion: '0.0.1',
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
  folderTreeExtractionSpecs: [
    {
      name: 'v1',
      spec: {
        '1': { name: 'pathOnly1' },
        '2': { name: 'pathOnly2' },
        '3': { name: 'overlapping' },
        '4': { name: 'filename' },
      },
    },
    {
      name: 'virtualRun',
      spec: {
        '1': { name: 'pathOnly1' },
        '2': { name: 'vPathOnly2' },
      },
    },
  ],
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
      removePrefix: [],
    },
    substituteValues: [],
  },
};

const testFileBody = `ver. 5.67.53
VAL1: first value
VAL2: 123456
OVERLAP: FROMCONTENT

data here
`;

describe('parseFileMetadata', () => {
  test('success: v1 .txt', async () => {
    const keyData: KeyData = {
      path: ['test', 'path', 'FROMPATH', 'TEST_FROMNAME_112233.txt'],
      rootFolder: 'test',
      fileName: 'TEST_FROMNAME_112233.txt',
      fileBaseName: 'TEST_FROMNAME_112233',
      fileSuffix: 'txt',
      keyWithoutSuffix: 'test/path/FROMPATH/TEST_FROMNAME_112233',
    };

    const params = {
      keyData,
      fileStream: stringToStream(testFileBody),
      spec: extractionSpec,
      doCSVParsing: false,
      dbConnection: undefined,
      reportId: -1,
      invocationId: 'TEST_invocationId',
      doGeoviiteConversion: false,
    };
    const result = await parseFileMetadata(params);
    expect(result).toEqual({
      errors: false,
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
        metadata_changed_at_datetime: expect.stringMatching(ISODateRegexp),
        parser_version: '0.0.1',
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

    const params = {
      keyData,
      fileStream: stringToStream('dummy'),
      spec: extractionSpec,
      doCSVParsing: false,
      dbConnection: undefined,
      reportId: -1,
      invocationId: 'TEST_invocationId',
      doGeoviiteConversion: false,
    };
    const result = await parseFileMetadata(params);
    expect(result).toEqual({
      errors: true,
      metadata: {
        // data from name missing
        overlapping: 'FROMPATH',
        pathOnly1: 'test',
        pathOnly2: 'path',
        parsed_at_datetime: expect.stringMatching(ISODateRegexp),
        metadata_changed_at_datetime: expect.stringMatching(ISODateRegexp),
        parser_version: '0.0.1',
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

    const params = {
      keyData,
      fileStream: stringToStream('dummy'),
      spec: extractionSpec,
      doCSVParsing: false,
      dbConnection: undefined,
      reportId: -1,
      invocationId: 'TEST_invocationId',
      doGeoviiteConversion: false,
    };
    const result = await parseFileMetadata(params);
    expect(result).toEqual({
      errors: true,
      metadata: {
        // data from path missing
        file_type: 'csv',
        nameOnly1: 'TEST',
        nameOnly2: 112233,
        overlapping: 'FROMNAME',
        parsed_at_datetime: expect.stringMatching(ISODateRegexp),
        metadata_changed_at_datetime: expect.stringMatching(ISODateRegexp),
        parser_version: '0.0.1',
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

    const params = {
      keyData,
      fileStream: stringToStream(testFileBody),
      spec: extractionSpec,
      doCSVParsing: false,
      dbConnection: undefined,
      reportId: -1,
      invocationId: 'TEST_invocationId',
      doGeoviiteConversion: false,
    };
    const result = await parseFileMetadata(params);
    expect(result).toEqual({
      errors: true,
      metadata: {
        // data from name missing
        pathOnly1: 'test',
        pathOnly2: 'path',
        contentOnly1: 'first value',
        contentOnly2: 123456,
        overlapping: 'FROMCONTENT',
        parsed_at_datetime: expect.stringMatching(ISODateRegexp),
        metadata_changed_at_datetime: expect.stringMatching(ISODateRegexp),
        parser_version: '0.0.1',
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
    const params = {
      keyData,
      fileStream: stringToStream(testFileBody),
      spec: extractionSpec,
      doCSVParsing: false,
      dbConnection: undefined,
      reportId: -1,
      invocationId: 'TEST_invocationId',
      doGeoviiteConversion: false,
    };

    const result = await parseFileMetadata(params);
    expect(result).toEqual({
      errors: true,
      metadata: {
        // data form path missing
        file_type: 'txt',
        nameOnly1: 'TEST',
        nameOnly2: 112233,
        contentOnly1: 'first value',
        contentOnly2: 123456,
        overlapping: 'FROMNAME',
        parsed_at_datetime: expect.stringMatching(ISODateRegexp),
        metadata_changed_at_datetime: expect.stringMatching(ISODateRegexp),
        parser_version: '0.0.1',
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
    const params = {
      keyData,
      fileStream: stringToStream('dummy'),
      spec: extractionSpec,
      doCSVParsing: false,
      dbConnection: undefined,
      reportId: -1,
      invocationId: 'TEST_invocationId',
      doGeoviiteConversion: false,
    };

    const result = await parseFileMetadata(params);
    expect(result).toEqual({
      errors: false, // TODO: should this report errors if no metadata is found?
      metadata: {
        // data from content missing
        file_type: 'txt',
        pathOnly1: 'test',
        pathOnly2: 'path',
        nameOnly1: 'TEST',
        nameOnly2: 112233,
        overlapping: 'FROMNAME',
        parsed_at_datetime: expect.stringMatching(ISODateRegexp),
        metadata_changed_at_datetime: expect.stringMatching(ISODateRegexp),
        parser_version: '0.0.1',
      },
    });
  });
  test('success: normal .txt', async () => {
    const keyData: KeyData = {
      path: ['test', 'path', 'FROMPATH', 'TEST_FROMNAME_112233.txt'],
      rootFolder: 'test',
      fileName: 'TEST_FROMNAME_112233.txt',
      fileBaseName: 'TEST_FROMNAME_112233',
      fileSuffix: 'txt',
      keyWithoutSuffix: 'test/path/FROMPATH/TEST_FROMNAME_112233',
    };
    const params = {
      keyData,
      fileStream: stringToStream(testFileBody),
      spec: extractionSpec,
      doCSVParsing: false,
      dbConnection: undefined,
      reportId: -1,
      invocationId: 'TEST_invocationId',
      doGeoviiteConversion: false,
    };

    const result = await parseFileMetadata(params);
    expect(result).toEqual({
      errors: false,
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
        metadata_changed_at_datetime: expect.stringMatching(ISODateRegexp),
        parser_version: '0.0.1',
      },
    });
  });
});
describe('generateMetadata', () => {
  test('success: correct format', async () => {
    const testSpec = {
      parserVersion: '0.0.1',
    };
    const result = generateMetadata(testSpec as any as IExtractionSpec);
    expect(result).toEqual({
      parser_version: '0.0.1',
      parsed_at_datetime: expect.stringMatching(ISODateRegexp),
      metadata_changed_at_datetime: expect.stringMatching(ISODateRegexp),
    });
  });
});
