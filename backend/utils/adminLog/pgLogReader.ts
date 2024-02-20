import postgres from 'postgres';
import { getSecretsManagerSecret } from '../secretsManager';
import { getEnvOrFail } from '../../../utils';
import {
  AdminLogSource,
  AdminLogSummary,
  RawLogRow,
  SingleEventLogsResponse,
  StatsQueryDBResponseRow,
  SummaryDBResponse,
} from './types';
import { formatSummary } from './adminLogUtils';
import { format } from 'date-fns';

/**
 * Get logs for a single event, defined by date and invocationId
 */
export async function getSingleEventLogs(
  date: Date,
  invocationId: string,
  sources: AdminLogSource[],
  pageSize: number,
  pageIndex: number,
): Promise<SingleEventLogsResponse> {
  const password = await getSecretsManagerSecret('database_password');
  const sql = await postgres({ password });
  const schema = getEnvOrFail('RAITA_PGSCHEMA');
  const startTimestamp = `${format(date, 'yyyy-MM-dd')}T00:00:00Z`;
  const endTimestamp = `${format(date, 'yyyy-MM-dd')}T23:59:59Z`;

  const sizeResult = await sql`
  SELECT COUNT(*) AS size
  FROM ${sql(schema)}.logging
  WHERE log_timestamp BETWEEN ${startTimestamp} AND ${endTimestamp}
  AND invocation_id = ${invocationId}
  AND source IN ${sql(sources)};`;

  const pageOffset = pageIndex * pageSize;
  const logsResult = await sql`
  SELECT *
  FROM ${sql(schema)}.logging
  WHERE log_timestamp BETWEEN ${startTimestamp} AND ${endTimestamp}
  AND invocation_id = ${invocationId}
  AND source IN ${sql(sources)}
  ORDER BY log_timestamp ASC
  LIMIT ${pageSize} OFFSET ${pageOffset};`;
  return {
    totalSize: sizeResult[0].size,
    logs: logsResult as any as RawLogRow[],
    pageSize,
    pageIndex,
  };
}

function getSummaryQuery(
  sql: postgres.Sql,
  schema: string,
  sources: AdminLogSource[],
  startTimestamp: string,
  endTimestamp: string,
  pageSize: number,
  pageIndex: number,
): Promise<SummaryDBResponse[]> {
  const pageOffset = pageIndex * pageSize;
  return sql`
SELECT
  date_trunc('day', log_timestamp) as log_date,
  MIN(log_timestamp) as start_timestamp,
  invocation_id,
  log_level,
  source,
  COUNT(*) as count
FROM ${sql(schema)}.logging
WHERE
source IN ${sql(sources)}
AND log_timestamp BETWEEN ${startTimestamp} AND ${endTimestamp}
GROUP BY log_date, log_level, source, invocation_id
ORDER BY start_timestamp DESC
LIMIT ${pageSize} OFFSET ${pageOffset};`;
}

export async function getLogSummary(
  startTimestamp: string,
  endTimestamp: string,
  sources: AdminLogSource[],
  pageSize: number,
  pageIndex: number,
): Promise<AdminLogSummary> {
  const password = await getSecretsManagerSecret('database_password');
  const sql = await postgres({ password });
  const schema = getEnvOrFail('RAITA_PGSCHEMA');

  const stats = await getStatsQuery(
    sql,
    schema,
    sources,
    startTimestamp,
    endTimestamp,
  );
  const summaryResponse = await getSummaryQuery(
    sql,
    schema,
    sources,
    startTimestamp,
    endTimestamp,
    pageSize,
    pageIndex,
  );
  const formattedSummary = formatSummary(summaryResponse);
  const totalSize =
    Number(stats.find(row => row.log_level === 'info')?.event_count) ?? NaN; // there should always be one info level message?
  return {
    totalSize,
    stats,
    summaryRows: formattedSummary,
    pageIndex,
    pageSize,
  };
}

export async function getStatsQuery(
  sql: postgres.Sql,
  schema: string,
  sources: AdminLogSource[],
  startTimestamp: string,
  endTimestamp: string,
): Promise<StatsQueryDBResponseRow[]> {
  return sql`
SELECT COUNT(*) as event_count, log_level FROM (
  SELECT DISTINCT
    date_trunc('day', log_timestamp) as log_date,
    invocation_id,
    log_level
  FROM ${sql(schema)}.logging
  WHERE source IN ${sql(sources)}
  AND log_timestamp BETWEEN ${startTimestamp} AND ${endTimestamp}
) AS tmp
GROUP BY log_level;`;
}
