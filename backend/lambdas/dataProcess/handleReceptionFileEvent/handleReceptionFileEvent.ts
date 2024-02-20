import { S3Event } from 'aws-lambda';
import { CopyObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { log } from '../../../utils/logger';
import { getGetEnvWithPreassignedContext } from '../../../../utils';
import {
  getDecodedS3ObjectKey,
  getKeyData,
  isExcelSuffix,
  isZipPath,
  RaitaLambdaError,
} from '../../utils';
import { FILEPART_SUFFIX, ZIP_SUFFIX } from '../../../../constants';
import { launchECSZipTask } from './utils';
import { IAdminLogger } from '../../../utils/adminLog/types';
import { PostgresLogger } from '../../../utils/adminLog/postgresLogger';
import {
  DataProcessLockedError,
  acquireDataProcessLockOrFail,
} from '../../../utils/dataProcessLock';

function getLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext('Metadata parser lambda');
  return {
    clusterArn: getEnv('ECS_CLUSTER_ARN'),
    taskArn: getEnv('ECS_TASK_ARN'),
    containerName: getEnv('CONTAINER_NAME'),
    targetBucketName: getEnv('TARGET_BUCKET_NAME'),
    subnetIds: getEnv('SUBNET_IDS').split(','),
  };
}

const adminLogger: IAdminLogger = new PostgresLogger();

export async function handleReceptionFileEvent(event: S3Event): Promise<void> {
  try {
    const recordResults = event.Records.map(async eventRecord => {
      const config = getLambdaConfigOrFail();
      const bucket = eventRecord.s3.bucket;
      const key = getDecodedS3ObjectKey(eventRecord);
      await adminLogger.init('data-reception', key);
      await adminLogger.info(`Tiedosto vastaanotettu: ${key}`);
      try {
        // note: currently this lock is never released
        // pipeline can acquire lock only after all dataprocess locks have timed out
        // TODO: release lock once all files inside zip have been fully handled
        await getLock(key);
        log.info('acquired lock');
      } catch (error) {
        log.error(error);
        return;
      }
      const { path, fileSuffix } = getKeyData(key);
      if (!fileSuffix) {
        await adminLogger.warn(`Ei tiedostopäätettä, ei käsitellä.`);
        return;
      }
      if (fileSuffix === FILEPART_SUFFIX) {
        await adminLogger.warn(`Filepart tiedosto, ei käsitellä.`);
        return;
      }
      if (!isZipPath(path)) {
        throw new RaitaLambdaError(`Unexpected file path ${path}`, 400);
      }
      if (fileSuffix === ZIP_SUFFIX) {
        // Launch zip extraction for zip file
        return launchECSZipTask({
          ...config,
          key,
          sourceBucketName: bucket.name,
        });
      } else if (isExcelSuffix(fileSuffix)) {
        // Copy the file to target S3 bucket if it is an Excel file
        const command = new CopyObjectCommand({
          Key: key,
          Bucket: config.targetBucketName,
          CopySource: `${bucket.name}/${key}`,
        });
        const s3Client = new S3Client({});
        return s3Client.send(command);
      } else {
        throw new RaitaLambdaError(`Unexpected file suffix: ${path}`, 400);
      }
    });
    await Promise.all(recordResults);
  } catch (err) {
    log.error(`An error occured while processing zip events: ${err}`);
    await adminLogger.error('Virhe zip-tiedoston käsittelyssä');
  }
}

/**
 * Wait until lock is acquired
 */
const getLock = async (key: string) => {
  // TODO: don't naively wait here
  const waitTime = 30 * 1000;
  const timeout = 1000 * 60 * 15; // note: lambda timeout will hit first currently
  let elapsed = 0;
  while (elapsed < timeout) {
    try {
      return await acquireDataProcessLockOrFail(key);
    } catch (error) {
      if (error instanceof DataProcessLockedError) {
        log.info('Data process locked, waiting to acquire lock');
        await new Promise(resolve => setTimeout(resolve, waitTime));
        elapsed += waitTime;
      } else {
        throw error;
      }
    }
  }
};
