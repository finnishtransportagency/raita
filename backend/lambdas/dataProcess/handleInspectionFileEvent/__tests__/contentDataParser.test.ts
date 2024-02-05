import { IExtractionSpec } from '../../../../types';
import {
  extractFileContentData,
  extractFileContentDataFromStream,
  shouldParseContent,
} from '../contentDataParser';
import { stringToStream, stringToStreamWithDelay } from './testUtils';

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
  fileNameExtractionSpec: { csv: [], txt: [], pdf: [], xlsx: [], xls: [] },
  folderTreeExtractionSpec: {},
  vRunFolderTreeExtractionSpec: {},
  fileContentExtractionSpec: [
    {
      propertyKey: 'contentVal1',
      pattern: {
        predefinedPatternId: 'colonSeparatedKeyValuePair',
        searchKey: 'VAL1',
      },
    },
    {
      propertyKey: 'contentVal2',
      pattern: {
        predefinedPatternId: 'colonSeparatedKeyValuePair',
        searchKey: 'VAL2',
      },
    },
    {
      propertyKey: 'contentVal3',
      pattern: {
        predefinedPatternId: 'colonSeparatedKeyValuePair',
        searchKey: 'VAL3',
      },
      parseAs: 'integer',
    },
  ],
  knownExceptions: {
    fileNameExtractionSpec: { containsUnderscore: [] },
    substituteValues: [],
  },
};

describe('shouldParseContent', () => {
  test('success: txt file', () => {
    expect(shouldParseContent('txt')).toBe(true);
  });
  test('fail: other files', () => {
    expect(shouldParseContent('csv')).toBe(false);
    expect(shouldParseContent('pdf')).toBe(false);
    expect(shouldParseContent('xlsx')).toBe(false);
    expect(shouldParseContent('xls')).toBe(false);
    expect(shouldParseContent('exe')).toBe(false);
  });
});
describe('extractFileContentData', () => {
  test('success: txt file', () => {
    const fileBody = `ver. 5.67.53
VAL1: value_1
VAL2: value number 2
VAL3: 332211

data here
`;
    const result = extractFileContentData(extractionSpec, fileBody);
    expect(result).toEqual({
      contentVal1: 'value_1',
      contentVal2: 'value number 2',
      contentVal3: 332211,
    });
  });
  test('success: empty value in txt file', () => {
    const fileBody = `ver. 5.67.53
VAL1: value_1
VAL2:
VAL3: 332211

data here
`;
    const result = extractFileContentData(extractionSpec, fileBody);
    expect(result).toEqual({
      contentVal1: 'value_1',
      contentVal2: '',
      contentVal3: 332211,
    });
  });
  test('success: value in spec but missing', () => {
    const fileBody = `ver. 5.67.53
VAL1: value_1
VAL3: 332211

data here
`;
    const result = extractFileContentData(extractionSpec, fileBody);
    expect(result).toEqual({
      contentVal1: 'value_1',
      // missing contentVal2
      contentVal3: 332211,
    });
  });
  test('success: keyword found but malformed', () => {
    const fileBody = `ver. 5.67.53
VAL1: value_1
VAL2 malformed row
VAL3: 332211

data here
`;
    const result = extractFileContentData(extractionSpec, fileBody);
    expect(result).toEqual({
      contentVal1: 'value_1',
      // missing contentVal2
      contentVal3: 332211,
    });
  });
});
describe('extractFileContentDataFromStream', () => {
  test('success: txt file', async () => {
    const fileBody = `ver. 5.67.53
VAL1: value_1
VAL2: value number 2
VAL3: 332211

data here
`;
    const result = await extractFileContentDataFromStream(
      extractionSpec,
      stringToStream(fileBody),
    );
    expect(result).toEqual({
      contentVal1: 'value_1',
      contentVal2: 'value number 2',
      contentVal3: 332211,
    });
  });
  test('success: txt file with arbitrary delay in stream', async () => {
    const fileBody = `ver. 5.67.53
VAL1: value_1
VAL2: value number 2
VAL3: 332211

data here
`;
    const result = await extractFileContentDataFromStream(
      extractionSpec,
      stringToStreamWithDelay(fileBody, 1000),
    );
    expect(result).toEqual({
      contentVal1: 'value_1',
      contentVal2: 'value number 2',
      contentVal3: 332211,
    });
  });
});
