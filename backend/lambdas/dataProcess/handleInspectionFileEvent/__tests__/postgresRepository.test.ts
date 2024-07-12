import { raportti } from '@prisma/client';
import { FileMetadataEntry } from '../../../../types';
import { checkExistingHash } from '../../../utils';
import { jest } from '@jest/globals';

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

  function mockFoundReport(overrides = {}): raportti {
    return {
      id: 1,
      file_name: null,
      file_type: null,
      source_system: null,
      zip_name: null,
      campaign: null,
      track_number: null,
      track_part: null,
      track_id: null,
      km_start: null,
      km_end: null,
      system: null,
      nonparsed_inspection_datetime: null,
      report_category: null,
      inspection_date: null,
      size: null,
      status: null,
      error: null,
      chunks_to_process: null,
      events: null,
      parsed_at_datetime: null,
      key: null,
      inspection_datetime: null,
      parser_version: null,
      zip_reception__year: null,
      zip_reception__date: null,
      year: null,
      created: null,
      modified: null,
      metadata_changed_at_datetime: null,
      extra_information: null,
      metadata_status: null,
      maintenance_area: null,
      is_empty: null,
      length: null,
      tilirataosanumero: null,
      report_type: null,
      temperature: null,
      measurement_start_location: null,
      measurement_end_location: null,
      measurement_direction: null,
      maintenance_level: null,
      hash: null,
      ...overrides,
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true if key is not found', async () => {
    const foundReport = null;
    const entry = mockEntry();
    const result = await checkExistingHash(entry, foundReport);
    expect(result).toBe(true);
  });

  it('should return true if skip_hash_check is true and hash matches', async () => {
    const foundReport = mockFoundReport({ hash: 'testHash' });
    const entry = mockEntry({ options: { skip_hash_check: true } });
    const result = await checkExistingHash(entry, foundReport);
    expect(result).toBe(true);
  });

  it('should return true if found hash does not match entry hash', async () => {
    const foundReport = mockFoundReport({
      hash: 'different-hash',
      parser_version: '1.0.0',
    });
    const entry = mockEntry();
    const result = await checkExistingHash(entry, foundReport);
    expect(result).toBe(true);
  });

  it('should return true if require_newer_parser_version is true and version is newer or equal', async () => {
    const foundReport = mockFoundReport({
      hash: 'testHash',
      parser_version: '1.0.0',
    });
    const entry = mockEntry({
      options: { require_newer_parser_version: true },
      metadata: { parser_version: '1.0.0' },
    });
    const result = await checkExistingHash(entry, foundReport);
    expect(result).toBe(true);
  });

  it('should return false if require_newer_parser_version is true and version is older', async () => {
    const foundReport = mockFoundReport({
      hash: 'testHash',
      parser_version: '2.0.0',
    });
    const entry = mockEntry({
      options: { require_newer_parser_version: true, skip_hash_check: false },
      metadata: { parser_version: '1.0.0' },
    });

    const result = await checkExistingHash(entry, foundReport);
    expect(result).toBe(false);
  });

  it('should return false if none of the conditions are met', async () => {
    const foundReport = mockFoundReport({
      hash: 'testHash',
      parser_version: '0.1.0',
    });
    const entry = mockEntry();
    const result = await checkExistingHash(entry, foundReport);
    expect(result).toBe(false);
  });
});
