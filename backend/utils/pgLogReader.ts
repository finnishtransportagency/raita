import postgres from 'postgres';
import { getSecretsManagerSecret } from './secretsManager';
import { getEnvOrFail } from '../../utils';

export type LogResponse = {
  totalSize: number;
  pageIndex: number;
  pageSize: number;
  logs: any[]; // TODO define?
};

/**
 * Get logs with paging
 * pageIndex starts from 0
 */
export async function getPostgresLogs(
  startTimestamp: string,
  endTimestamp: string,
  pageIndex: number,
  pageSize: number,
): Promise<LogResponse> {
  const password = await getSecretsManagerSecret('database_password');
  const sql = await postgres({ password });
  const schema = getEnvOrFail('RAITA_PGSCHEMA');
  const pageOffset = pageSize * pageIndex;
  const sizeResult = await sql`
  SELECT COUNT(*) AS size
  FROM ${sql(schema)}.logging
  WHERE log_timestamp BETWEEN ${startTimestamp} AND ${endTimestamp}`;
  const logsResult = await sql`
  SELECT *
  FROM ${sql(schema)}.logging
  WHERE log_timestamp BETWEEN ${startTimestamp} AND ${endTimestamp}
  ORDER BY log_timestamp DESC
  LIMIT ${pageSize} OFFSET ${pageOffset}`;
  return {
    totalSize: sizeResult[0].size,
    pageIndex,
    pageSize,
    logs: logsResult,
  };
}
