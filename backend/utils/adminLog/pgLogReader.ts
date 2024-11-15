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
import { getDBConnection } from '../../lambdas/dataProcess/csvCommon/db/dbUtil';
import { Prisma, PrismaClient } from '@prisma/client';

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
const getSummaryQuery = async (
  sources: AdminLogSource[],
  startTimestamp: string,
  endTimestamp: string,
  pageSize: number,
  pageIndex: number,
  prisma: PrismaClient,
): Promise<SummaryDBResponse[]> => {
  const pageOffset = pageIndex * pageSize;
  return prisma.$queryRaw`
SELECT events.log_date, events.start_timestamp, events.invocation_id,  counts.log_level, counts.source, counts.count
FROM (
-- subquery: select list of all "events" with paging
  SELECT
    date_trunc('day', log_timestamp) as log_date,
    MIN(log_timestamp) as start_timestamp,
    invocation_id
  FROM logging
  WHERE
    source IN (${Prisma.join(sources)})
    AND log_timestamp BETWEEN ${new Date(startTimestamp)} AND ${new Date(
      endTimestamp,
    )}
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
  FROM logging
  WHERE
    source IN (${Prisma.join(sources)})
    AND log_timestamp BETWEEN ${new Date(startTimestamp)} AND ${new Date(
      endTimestamp,
    )}
  GROUP BY log_date, invocation_id, source, log_level
) AS counts
ON
  events.invocation_id = counts.invocation_id
  AND events.log_date = counts.log_date
ORDER BY events.start_timestamp DESC;
  `;
};

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
  const { prisma } = await getDBConnection();
  const stats = await getStatsQuery(
    sources,
    startTimestamp,
    endTimestamp,
    prisma,
  );
  const summaryResponse = await getSummaryQuery(
    sources,
    startTimestamp,
    endTimestamp,
    pageSize,
    pageIndex,
    prisma,
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
  sources: AdminLogSource[],
  startTimestamp: string,
  endTimestamp: string,
  prisma: PrismaClient,
): Promise<StatsQueryDBResponseRow[]> {
  const res: { log_level: string; event_count: any }[] = await prisma.$queryRaw`
SELECT COUNT(*) as event_count, log_level FROM (
  SELECT DISTINCT
    date_trunc('day', log_timestamp) as log_date,
    invocation_id,
    log_level
  FROM logging
  WHERE source IN (${Prisma.join(sources)})
  AND log_timestamp BETWEEN ${new Date(startTimestamp)} AND ${new Date(
    endTimestamp,
  )}
) AS tmp
GROUP BY log_level;`;
  return res.map(row => ({
    log_level: row.log_level,
    event_count: Number(row.event_count),
  }));
}
