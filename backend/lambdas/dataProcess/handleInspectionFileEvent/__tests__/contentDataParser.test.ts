import { shouldParseContent } from '../contentDataParser';

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
    // TODO
  });
});
