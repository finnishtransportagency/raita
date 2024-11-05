import { subMinutes } from 'date-fns';
import { DBConnection } from '../lambdas/dataProcess/csvCommon/db/dbUtil';
import { PrismaClient } from '@prisma/client';

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
  dbConnection: DBConnection,
) {
  const { prisma } = dbConnection;
  const timestamp = new Date(Date.now()).toISOString();
  const expiredTime = subMinutes(
    new Date(),
    LOCK_TIMEOUT_MINUTES,
  ).toISOString();
  try {
    const result = await prisma.$transaction(async (prisma: PrismaClient) => {
      // Check if an existing lock already meets the criteria
      const existingPipelineLock = await prisma.data_process_lock.findFirst({
        where: {
          holder_type: holderTypeToFailOn,
          create_time: {
            gt: expiredTime,
          },
        },
      });

      // If no existing lock meets the criteria, create a new one
      if (!existingPipelineLock) {
        return await prisma.data_process_lock.create({
          data: {
            holder_type: holderType,
            zip_file_name: filename,
            create_time: timestamp,
          },
        });
      }

      // Return null or handle the case when the lock already exists
      return null;
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
  dbConnection: DBConnection,
) {
  const { prisma } = dbConnection;
  try {
    const result = await prisma.data_process_lock.deleteMany({
      where: {
        holder_type: holderType,
        zip_file_name: filename,
      },
    });
    return result;
  } catch (error) {
    throw new DataProcessLockedError();
  }
}

export function acquirePipelineLockOrFail(dbConnection: DBConnection) {
  return acquireLockOrFail(
    LockHolderType.Pipeline,
    LockHolderType.DataProcess,
    'pipeline',
    dbConnection,
  );
}
export function acquireDataProcessLockOrFail(
  filename: string,
  dbConnection: DBConnection,
) {
  return acquireLockOrFail(
    LockHolderType.DataProcess,
    LockHolderType.Pipeline,
    filename,
    dbConnection,
  );
}
export function releasePipelineLock(dbConnection: DBConnection) {
  return releaseLock(LockHolderType.Pipeline, 'pipeline', dbConnection);
}
export function releaseDataProcessLock(
  filename: string,
  dbConnection: DBConnection,
) {
  return releaseLock(LockHolderType.DataProcess, filename, dbConnection);
}

/**
 * This should only be used from the pipeline
 */
export async function lockTableExists(dbConnection: DBConnection) {
  const { prisma } = dbConnection;
  const result = await prisma.$queryRaw`
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'data_process_lock'
  ) as "exists";
`;
  return Boolean(result[0].exists);
}
