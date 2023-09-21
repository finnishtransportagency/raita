import { ExtractionSpec, IExtractionSpec } from '../../../../types';
import {
  extractFileContentData,
  shouldParseContent,
} from '../contentDataParser';

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
    const result = extractFileContentData(
      extractionSpec as any as IExtractionSpec,
      fileBody,
    );
    expect(result).toEqual({
      contentVal1: 'value_1',
      contentVal2: 'value number 2',
      contentVal3: 332211,
    });
  });
  test.skip('error: empty value', () => {
    // TODO: fix this, currently parses VAL2 value as "VAL3: 332211"
    const fileBody = `ver. 5.67.53
VAL1: value_1
VAL2:
VAL3: 332211

data here
`;
    const result = extractFileContentData(
      extractionSpec as any as IExtractionSpec,
      fileBody,
    );
    expect(result).toEqual({
      contentVal1: 'value_1',
      contentVal3: 332211,
    });
  });
  test('success: value in spec but missing', () => {
    const fileBody = `ver. 5.67.53
VAL1: value_1
VAL3: 332211

data here
`;
    const result = extractFileContentData(
      extractionSpec as any as IExtractionSpec,
      fileBody,
    );
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
    const result = extractFileContentData(
      extractionSpec as any as IExtractionSpec,
      fileBody,
    );
    expect(result).toEqual({
      contentVal1: 'value_1',
      // missing contentVal2
      contentVal3: 332211,
    });
  });
});
