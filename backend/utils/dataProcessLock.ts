import { subMinutes } from 'date-fns';
import { PostgresDBConnection } from '../lambdas/dataProcess/csvCommon/db/dbUtil';

/**
 * This file handles the data process lock
 * The lock is implemented with a table in postgres
 *
 * The lock can be acquired by one holderType at a time, but an arbitrary amount of workers can acquire the lock if they are the same holderType
 * Currently holderTypes are pipeline and data-process
 * The lock is considered released after LOCK_TIMEOUT_MINUTES if it is not manually released
 *
 */

// how long to lock the data process for
export const LOCK_TIMEOUT_MINUTES = 20;

export class DataProcessLockedError extends Error {}

enum LockHolderType {
  DataProcess = 'data-process',
  Pipeline = 'pipeline',
}

/**
 * Acquire lock with holder_type = holderType as long as there is no lock held by holderTypeToFailOn
 * Allow setting multiple locks by the same holderType
 */
async function acquireLockOrFail(
  holderType: LockHolderType,
  holderTypeToFailOn: LockHolderType,
  filename: string | null,
  dbConnection: PostgresDBConnection,
) {
  const sql = dbConnection.sql;
  const schema = dbConnection.schema;
  const timestamp = new Date(Date.now()).toISOString();
  const expiredTime = subMinutes(
    new Date(),
    LOCK_TIMEOUT_MINUTES,
  ).toISOString();
  try {
    const selectExistingPipelineLock = sql`
    SELECT FROM ${sql(
      schema,
    )}.data_process_lock WHERE holder_type = ${holderTypeToFailOn} AND create_time > ${expiredTime}`;
    const result = await sql.begin(async innerSql => {
      await innerSql`
      LOCK TABLE ${innerSql(schema)}.data_process_lock;
        `;
      return await innerSql`
      INSERT INTO ${innerSql(schema)}.data_process_lock
      (holder_type, zip_file_name, create_time)
      SELECT ${holderType}, ${filename}, ${timestamp}
      WHERE NOT EXISTS (
        ${selectExistingPipelineLock}
      )
      RETURNING *;
      `;
    });
    if (result.length === 0) {
      throw new DataProcessLockedError();
    }
    return result;
  } catch (error) {
    throw new DataProcessLockedError();
  }
}
/**
 * Release lock matching holderType and filename
 */
async function releaseLock(
  holderType: LockHolderType,
  filename: string | null,
  dbConnection: PostgresDBConnection,
) {
  const sql = dbConnection.sql;
  const schema = dbConnection.schema;
  return await sql`
  DELETE FROM ${sql(schema)}.data_process_lock
  WHERE holder_type = ${holderType}
  AND zip_file_name = ${filename};
  `;
}

export function acquirePipelineLockOrFail(dbConnection: PostgresDBConnection) {
  return acquireLockOrFail(
    LockHolderType.Pipeline,
    LockHolderType.DataProcess,
    'pipeline',
    dbConnection,
  );
}
export function acquireDataProcessLockOrFail(
  filename: string,
  dbConnection: PostgresDBConnection,
) {
  return acquireLockOrFail(
    LockHolderType.DataProcess,
    LockHolderType.Pipeline,
    filename,
    dbConnection,
  );
}
export function releasePipelineLock(dbConnection: PostgresDBConnection) {
  return releaseLock(LockHolderType.Pipeline, 'pipeline', dbConnection);
}
export function releaseDataProcessLock(
  filename: string,
  dbConnection: PostgresDBConnection,
) {
  return releaseLock(LockHolderType.DataProcess, filename, dbConnection);
}

/**
 * This should only be used from the pipeline
 */
export async function lockTableExists(dbConnection: PostgresDBConnection) {
  const sql = dbConnection.sql;
  const schema = dbConnection.schema;
  const result = await sql`SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = ${schema}
  AND table_name = 'data_process_lock'
  );`;
  return Boolean(result[0].exists);
}
