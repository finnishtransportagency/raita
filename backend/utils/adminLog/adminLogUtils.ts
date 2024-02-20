import { SummaryDBResponse, SummaryRow } from './types';

export function formatSummary(rows: SummaryDBResponse[]): SummaryRow[] {
  const byInvocation: { [key: string]: SummaryRow } = {};
  rows.forEach(row => {
    const invocation = `${row.log_date}_${row.invocation_id}`;
    const element = byInvocation[invocation] ?? {
      log_date: row.log_date,
      invocation_id: row.invocation_id,
      start_timestamp: row.start_timestamp,
      counts: {},
    };
    const sourceCount = element.counts[row.source] ?? {
      error: 0,
      warn: 0,
      info: 0,
    };
    sourceCount[row.log_level] += Number(row.count);
    element.counts[row.source] = sourceCount;
    byInvocation[invocation] = element;
  });
  const summaryRows = Object.values(byInvocation);
  return summaryRows;
}
