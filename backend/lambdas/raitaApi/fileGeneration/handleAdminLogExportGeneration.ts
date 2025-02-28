import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getGetEnvWithPreassignedContext } from '../../../../utils';
import { log } from '../../../utils/logger';
import { lambdaRequestTracker } from 'pino-lambda';
import { Context } from 'aws-lambda';
import { AdminLogExportEvent, CsvRow } from './types';
import {
  DBConnection,
  getDBConnection,
} from '../../dataProcess/csvCommon/db/dbUtil';
import {
  FailedProgressData,
  InitialProgressData,
  SuccessProgressData,
} from './constants';
import {
  prependBOMToStream,
  uploadProgressData,
  uploadReadableToS3,
} from './utils';
import { PassThrough, Readable } from 'stream';
import { AdminLogSource } from '../../../utils/adminLog/types';
import { writeLogExportToWritable } from '../../../utils/adminLog/pgLogReader';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const withRequest = lambdaRequestTracker();

const CSV_CHUNK_SIZE = 10000;

function getLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext(
    'handleAdminLogExportGeneration',
  );
  return {
    targetBucket: getEnv('TARGET_BUCKET'),
  };
}

export async function handleAdminLogExportGeneration(
  event: AdminLogExportEvent,
  context: Context,
) {
  withRequest(event, context);
  log.info({ event }, 'start');
  const config = getLambdaConfigOrFail();
  const s3Client = new S3Client({});

  try {
    await generateAdminLogExport(event, s3Client, config.targetBucket);
  } catch (error) {
    log.error({ error }, 'Error with CSV generation');
    await uploadProgressData(
      FailedProgressData,
      config.targetBucket,
      event.progressKey,
      s3Client,
    );
  }
}

async function generateAdminLogExport(
  event: AdminLogExportEvent,
  s3Client: S3Client,
  targetBucket: string,
) {
  const dbConnection = await getDBConnection();

  if (
    !event ||
    !event.startTime ||
    !event.endTime ||
    !event.sources ||
    !event.progressKey ||
    !event.resultFileKey
  ) {
    throw new Error('Missing parameters in event');
  }
  const { startTime, endTime, sources, progressKey, resultFileKey } = event;

  const logStream: Readable = await readLogsToReadable(
    startTime,
    endTime,
    sources,
    dbConnection,
  );
  await uploadReadableToS3(logStream, targetBucket, resultFileKey, s3Client);

  const downloadCommand = new GetObjectCommand({
    Bucket: targetBucket,
    Key: resultFileKey,
  });
  const downloadUrl = await getSignedUrl(s3Client, downloadCommand, {
    expiresIn: 3600,
  });

  const split = resultFileKey.split('/');
  const filename = split[split.length - 1];
  await uploadProgressData(
    { ...SuccessProgressData, url: downloadUrl, filename },
    targetBucket,
    progressKey,
    s3Client,
  );
}

const readLogsToReadable = async (
  startTime: string,
  endTime: string,
  sources: AdminLogSource[],
  dbConnection: DBConnection,
): Promise<Readable> => {
  const { prisma } = dbConnection;
  const output = prependBOMToStream(new PassThrough());
  output.pause();
  writeLogExportToWritable(sources, startTime, endTime, prisma, output);
  return output;
};
