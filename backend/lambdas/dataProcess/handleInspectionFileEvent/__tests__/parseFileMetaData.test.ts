import { IExtractionSpec } from '../../../../types';
import { KeyData } from '../../../utils';
import { parseFileMetadata } from '../parseFileMetadata';

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
    txt: {
      '1': { name: 'nameOnly1' },
      '2': { name: 'overlapping' },
      '3': { name: 'nameOnly2', parseAs: 'integer' },
    },
    csv: {
      '1': { name: 'nameOnly1' },
      '2': { name: 'overlapping' },
      '3': { name: 'nameOnly2', parseAs: 'integer' },
    },
    pdf: {
      '1': { name: 'nameOnly1' },
      '2': { name: 'overlapping' },
      '3': { name: 'nameOnly2', parseAs: 'integer' },
    },
    xlsx: {
      '1': { name: 'nameOnly1' },
      '2': { name: 'overlapping' },
      '3': { name: 'nameOnly2', parseAs: 'integer' },
    },
    xls: {
      '1': { name: 'nameOnly1' },
      '2': { name: 'overlapping' },
      '3': { name: 'nameOnly2', parseAs: 'integer' },
    },
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
  fileContentExtractionSpec: [],
};

const dummyHash =
  'b5a2c96250612366ea272ffac6d9744aaf4b45aacd96aa7cfcb931ee3b558259';

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
    const fileData = {
      fileBody: 'dummy',
      contentType: 'text/plain',
      tags: {}, // TODO what is this
    };
    const params = {
      keyData,
      file: fileData,
      spec: extractionSpec,
    };
    const result = await parseFileMetadata(params);
    expect(result).toEqual({
      hash: dummyHash,
      metadata: {
        file_type: 'txt',
        pathOnly1: 'test',
        pathOnly2: 'path',
        nameOnly1: 'TEST',
        nameOnly2: 112233,
        overlapping: 'FROMNAME',
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
      fileBody: 'dummy',
      contentType: 'text/csv',
      tags: {}, // TODO what is this
    };
    const params = {
      keyData,
      file: fileData,
      spec: extractionSpec,
    };
    const result = await parseFileMetadata(params);
    expect(result).toEqual({
      hash: dummyHash,
      metadata: {
        // data from name missing
        overlapping: 'FROMPATH',
        pathOnly1: 'test',
        pathOnly2: 'path',
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
      fileBody: 'dummy',
      contentType: 'text/csv',
      tags: {}, // TODO what is this
    };
    const params = {
      keyData,
      file: fileData,
      spec: extractionSpec,
    };
    const result = await parseFileMetadata(params);
    expect(result).toEqual({
      hash: dummyHash,
      metadata: {
        file_type: 'csv',
        nameOnly1: 'TEST',
        nameOnly2: 112233,
        overlapping: 'FROMNAME',
      },
    });
  });
  test.skip('success: parse submission report .xlsx', () => {});
  test.skip('partial: malformed filename, .txt', () => {});
  test.skip('partial: malformed path, .txt', () => {});
  test.skip('partial: malformed content, .txt', () => {});
});
