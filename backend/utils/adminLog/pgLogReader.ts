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
import { getPrismaClient } from '../prismaClient';

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
  const prisma = await getPrismaClient();
  const startTimestamp = `${format(date, 'yyyy-MM-dd')}T00:00:00Z`;
  const endTimestamp = `${format(date, 'yyyy-MM-dd')}T23:59:59Z`;

  const pageOffset = pageIndex * pageSize;

  const sizeResult = await prisma.logging.count({
    where: {
      log_timestamp: {
        gte: startTimestamp,
        lte: endTimestamp,
      },
      invocation_id: {
        equals: invocationId,
      },
      source: {
        in: sources,
      },
    },
  });

  const logsResult = await prisma.logging.findMany({
    where: {
      log_timestamp: {
        gte: startTimestamp,
        lte: endTimestamp,
      },
      invocation_id: {
        equals: invocationId,
      },
      source: {
        in: sources,
      },
    },
    orderBy: {
      log_timestamp: 'desc',
    },
    skip: pageOffset,
    take: pageSize,
  });

  await prisma.$disconnect();

  return {
    totalSize: sizeResult,
    logs: logsResult as any as RawLogRow[],
    pageSize,
    pageIndex,
  };
}

/**
 * Get summary for each log "event"
 * An event is defined by invocation_id (filename) and date part of timestamp
 */
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
SELECT events.log_date, events.start_timestamp, events.invocation_id,  counts.log_level, counts.source, counts.count
FROM (
-- subquery: select list of all "events" with paging
  SELECT
    date_trunc('day', log_timestamp) as log_date,
    MIN(log_timestamp) as start_timestamp,
    invocation_id
  FROM ${sql(schema)}.logging
  WHERE
    source IN ${sql(sources)}
    AND log_timestamp BETWEEN ${startTimestamp} AND ${endTimestamp}
  GROUP BY log_date, invocation_id
  ORDER BY start_timestamp DESC
  LIMIT ${pageSize} OFFSET ${pageOffset}
) AS events
LEFT JOIN (
-- subquery: get counts by log_level and source for each "event"
  SELECT
    date_trunc('day', log_timestamp) as log_date,
    invocation_id,
    log_level,
    source,
    COUNT(*) as count
  FROM ${sql(schema)}.logging
  WHERE
    source IN ${sql(sources)}
    AND log_timestamp BETWEEN ${startTimestamp} AND ${endTimestamp}
  GROUP BY log_date, invocation_id, source, log_level
) AS counts
ON
  events.invocation_id = counts.invocation_id
  AND events.log_date = counts.log_date
ORDER BY events.start_timestamp DESC;
  `;
}

/**
 * Get admin log summary
 *
 * note: pageSize determines the number of database rows returned which differs from the amount of rows in formatted response
 * TODO: query format can be changed to make this consistent
 */
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
