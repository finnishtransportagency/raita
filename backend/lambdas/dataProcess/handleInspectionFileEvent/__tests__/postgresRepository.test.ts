import { FileMetadataEntry } from '../../../../types';
import { checkExistingHash } from '../../../utils';
import { jest } from '@jest/globals';

// Mock the findReportByKey function
jest.mock('../handleInspectionFileEvent', () => ({
  findReportByKey: jest.fn(),
}));

// Get the mocked version of findReportByKey
const findReportByKey = require('../handleInspectionFileEvent').findReportByKey;

describe('PostgreRepository.upsertDocument', () => {
  const mockEntry = (overrides = {}): FileMetadataEntry => ({
    file_name: 'test',
    key: 'path/test',
    size: 100,
    bucket_name: '',
    bucket_arn: '',
    metadata: {
      test: 'test',
      parsed_at_datetime: 'test',
      parser_version: '1.0.0',
    },
    hash: 'testHash',
    options: {
      skip_hash_check: false,
      require_newer_parser_version: false,
    },
    errors: false,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true if key is not found', async () => {
    findReportByKey.mockResolvedValue(null);
    const entry = mockEntry();
    const result = await checkExistingHash(entry);
    expect(result).toBe(true);
  });

  it('should return true if skip_hash_check is true and hash matches', async () => {
    findReportByKey.mockResolvedValue({ hash: 'testHash' });
    const entry = mockEntry({ options: { skip_hash_check: true } });
    const result = await checkExistingHash(entry);
    expect(result).toBe(true);
  });

  it('should return true if found hash does not match entry hash', async () => {
    findReportByKey.mockResolvedValue({ hash: 'differentHash' });
    const entry = mockEntry();
    const result = await checkExistingHash(entry);
    expect(result).toBe(true);
  });

  it('should return true if require_newer_parser_version is true and version is newer or equal', async () => {
    findReportByKey.mockResolvedValue({ parser_version: '1.0.0' });
    const entry = mockEntry({
      options: { require_newer_parser_version: true },
      metadata: { parser_version: '1.0.0' },
    });
    const result = await checkExistingHash(entry);
    expect(result).toBe(true);
  });

  it('should return false if require_newer_parser_version is true and version is older', async () => {
    findReportByKey.mockResolvedValue({
      hash: 'testHash',
      parser_version: '2.0.0',
    });
    const entry = mockEntry({
      options: { require_newer_parser_version: true, skip_hash_check: false },
      metadata: { parser_version: '1.0.0' },
    });

    const result = await checkExistingHash(entry);
    expect(result).toBe(false);
  });

  it('should return false if none of the conditions are met', async () => {
    findReportByKey.mockResolvedValue({ hash: 'testHash' });
    const entry = mockEntry();
    const result = await checkExistingHash(entry);
    expect(result).toBe(false);
  });
});
