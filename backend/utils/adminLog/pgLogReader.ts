import postgres from 'postgres';
import { getSecretsManagerSecret } from '../secretsManager';
import { getEnvOrFail } from '../../../utils';
import {
  AdminLogLevel,
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
import { PrismaClient } from '@prisma/client';

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
  const events = await prisma.logging.groupBy({
    by: ['invocation_id', 'log_timestamp'],
    _min: {
      log_timestamp: true,
      log_level: true,
    },
    where: {
      source: {
        in: sources,
      },
      log_timestamp: {
        gte: startTimestamp,
        lte: endTimestamp,
      },
    },
    orderBy: {
      _min: {
        log_timestamp: 'desc',
      },
    },
    skip: pageOffset,
    take: pageSize,
  });

  const invocationIds = events
    .map(event => event.invocation_id)
    .filter((id): id is string => id !== null);

  const logCounts = await prisma.logging.groupBy({
    by: ['invocation_id', 'log_timestamp'],
    _count: {
      _all: true,
      log_level: true,
      source: true,
    },
    where: {
      invocation_id: {
        in: invocationIds,
      },
      source: {
        in: sources,
      },
      log_timestamp: {
        gte: startTimestamp,
        lte: endTimestamp,
      },
    },
  });

  const results = events.map(event => {
    const counts = logCounts
      .filter(
        count =>
          count.invocation_id === event.invocation_id &&
          count.log_timestamp === event.log_timestamp,
      )
      .map(count => ({
        log_level: count._count.log_level,
        source: count._count.source,
        count: count._count._all,
      }));

    if (counts.length === 0) {
      console.warn(
        `No matching log counts found for event: ${event.invocation_id}`,
      );
    }
    return {
      log_date: event.log_timestamp
        ? event.log_timestamp.toISOString().split('T')[0] // Date only
        : '',
      log_level: event._min.log_level as AdminLogLevel,
      start_timestamp: event._min.log_timestamp
        ? event._min.log_timestamp.toISOString()
        : '',
      invocation_id: event.invocation_id || '',
      count: counts[0]?.count?.toString() || '0', // count from first match or fallback
      source:
        (counts[0]?.source as unknown as AdminLogSource) ||
        ('default' as AdminLogSource),
    };
  });

  return results;
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
  const password = await getSecretsManagerSecret('database_password');
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
  try {
    const logs = await prisma.logging.findMany({
      where: {
        source: { in: sources },
        log_timestamp: {
          gte: startTimestamp,
          lte: endTimestamp,
        },
      },
      select: {
        log_level: true,
        invocation_id: true,
        log_timestamp: true,
      },
      distinct: ['log_level', 'invocation_id', 'log_timestamp'],
    });
    type LogCountAccumulator = Record<string, number>;
    type LogEntry = {
      log_timestamp: Date | null;
      invocation_id: string | null;
      log_level: string | null;
    };
    const logCounts = logs.reduce(
      (count: LogCountAccumulator, { log_level }: LogEntry) => {
        if (!log_level) return {};
        count[log_level] = (count[log_level] || 0) + 1;
        return count;
      },
      {} as LogCountAccumulator,
    );

    // Transform the result into an array format similar to SQL output
    const result: StatsQueryDBResponseRow[] = (
      Object.entries(logCounts) as [string, number][]
    ).map(([log_level, event_count]) => ({
      log_level,
      event_count: event_count.toString(),
    }));
    return result;
  } catch (error) {
    throw new Error('Error in getStatsQuery');
  }
}
