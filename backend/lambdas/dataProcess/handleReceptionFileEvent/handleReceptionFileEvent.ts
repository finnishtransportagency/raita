import { Context, S3Event, SQSEvent } from 'aws-lambda';
import {
  CopyObjectCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
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
import { lambdaRequestTracker } from 'pino-lambda';
import { SQSClient } from '@aws-sdk/client-sqs';
import { DBConnection, getDBConnection } from '../csvCommon/db/dbUtil';

function getLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext('Metadata parser lambda');
  return {
    queueUrl: getEnv('QUEUE_URL'),
    targetBucketName: getEnv('TARGET_BUCKET_NAME'),
  };
}

const withRequest = lambdaRequestTracker();

const config = getLambdaConfigOrFail();
const sqsClient = new SQSClient({});
const dbConnection = getDBConnection();
const adminLogger: IAdminLogger = new PostgresLogger(dbConnection);

export async function handleReceptionFileEvent(
  queueEvent: SQSEvent,
  context: Context,
): Promise<void> {
  try {
    withRequest(queueEvent, context);
    const sqsRecords = queueEvent.Records;
    const sqsRecord = sqsRecords[0]; // assume only one event here // TODO: handle this if batch size is increased
    const s3Event: S3Event = JSON.parse(sqsRecord.body);
    const recordResults = s3Event.Records.map(async eventRecord => {
      const bucket = eventRecord.s3.bucket;
      const key = getDecodedS3ObjectKey(eventRecord);
      log.info({ fileName: key }, 'Start reception handler');
      await adminLogger.init('data-reception', key);
      await adminLogger.info(`Tiedosto vastaanotettu: ${key}`);
      try {
        // note: currently this lock is never released
        // pipeline can acquire lock only after all dataprocess locks have timed out
        // TODO: release lock once all files inside zip have been fully handled
        await getLock(key, await dbConnection);
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
        const result = await launchECSZipTask({
          ...config,
          key,
          sqsClient,
        });
        log.info({ result }); // temporary? for debugging
        return result;
      } else if (isExcelSuffix(fileSuffix)) {
        // Copy the file to target S3 bucket if it is an Excel file
        const s3Client = new S3Client({});
        // fetch metadata from existing object
        const existingResult = await s3Client.send(
          new HeadObjectCommand({
            Key: key,
            Bucket: bucket.name,
          }),
        );
        const existingMetadata = existingResult.Metadata ?? {};
        const newMetadata: { [key: string]: string } = {
          'invocation-id': key,
        };
        // only copy some metadata fields
        if (existingMetadata['skip-hash-check']) {
          newMetadata['skip-hash-check'] = existingMetadata['skip-hash-check'];
        }
        if (existingMetadata['require-newer-parser-version']) {
          newMetadata['require-newer-parser-version'] =
            existingMetadata['require-newer-parser-version'];
        }
        const command = new CopyObjectCommand({
          Key: key,
          Bucket: config.targetBucketName,
          CopySource: `${bucket.name}/${key}`,
          Metadata: newMetadata,
          MetadataDirective: 'REPLACE',
        });
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
// @ts-ignore
const getLock = async (key: string, dbConnection: DBConnection) => {
  // TODO: don't naively wait here
  const waitTime = 30 * 1000;
  const timeout = 1000 * 60 * 15; // note: lambda timeout will hit first currently
  let elapsed = 0;
  while (elapsed < timeout) {
    try {
      return await acquireDataProcessLockOrFail(key, dbConnection);
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
