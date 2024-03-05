import { formatSummary } from '../adminLogUtils';
import { SummaryDBResponse } from '../types';

describe('formatSummary', () => {
  test('success', () => {
    const testDBResponse: SummaryDBResponse[] = [
      {
        count: '10',
        invocation_id: 'Test1',
        log_date: '2024-01-01T00:00:00.000Z',
        source: 'delete-process',
        log_level: 'info',
        start_timestamp: '2024-01-01T01:10:00.000Z',
      },
      {
        count: '30',
        invocation_id: 'Test1',
        log_date: '2024-01-01T00:00:00.000Z',
        source: 'delete-process',
        log_level: 'info',
        start_timestamp: '2024-01-01T01:11:00.000Z',
      },
      {
        count: '3',
        invocation_id: 'Test1',
        log_date: '2024-01-01T00:00:00.000Z',
        source: 'delete-process',
        log_level: 'warn',
        start_timestamp: '2024-01-01T01:12:00.000Z',
      },
      {
        count: '5',
        invocation_id: 'Test2',
        log_date: '2024-01-01T00:00:00.000Z',
        source: 'delete-process',
        log_level: 'warn',
        start_timestamp: '2024-01-01T01:13:00.000Z',
      },
    ];
    const result = formatSummary(testDBResponse);
    expect(result).toEqual([
      {
        log_date: '2024-01-01T00:00:00.000Z',
        invocation_id: 'Test1',
        start_timestamp: '2024-01-01T01:10:00.000Z',
        counts: {
          'delete-process': {
            info: 40,
            warn: 3,
            error: 0,
          },
        },
      },
      {
        log_date: '2024-01-01T00:00:00.000Z',
        invocation_id: 'Test2',
        start_timestamp: '2024-01-01T01:13:00.000Z',
        counts: {
          'delete-process': {
            info: 0,
            warn: 5,
            error: 0,
          },
        },
      },
    ]);
  });
});
