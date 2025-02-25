import { S3Client } from '@aws-sdk/client-s3';
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
import { uploadProgressData, uploadReadableToS3 } from './utils';
import { PassThrough, Readable } from 'stream';
import { AdminLogSource } from '../../../utils/adminLog/types';
import { getLogExport } from '../../../utils/adminLog/pgLogReader';

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
  // TODO: generic version of readDbToReadable? or new version for this

  const { startTime, endTime, sources, progressKey, resultFileKey } = event;

  // TODO: should this be done in the funtion that triggers generation?
  await uploadProgressData(
    InitialProgressData,
    targetBucket,
    progressKey,
    s3Client,
  );

  const logStream: Readable = await readLogsToReadable(
    startTime,
    endTime,
    sources,
    dbConnection,
  ); // TODO read from db and transform to CSV

  await uploadReadableToS3(logStream, targetBucket, resultFileKey, s3Client);

  await uploadProgressData(
    { ...SuccessProgressData, url: 'TODO' },
    targetBucket,
    progressKey,
    s3Client,
  );
  // get what
  // stream csv from db? or generate using polling?
}

const readLogsToReadable = async (
  startTime: string,
  endTime: string,
  sources: AdminLogSource[],
  dbConnection: DBConnection,
): Promise<Readable> => {
  const { prisma } = dbConnection;
  const logs = await getLogExport(sources, startTime, endTime, prisma);

  const output = new PassThrough();
  output.pause();
  logs.map(logRow => {
    const row: CsvRow = [];
    // TODO
  });
  output.resume();
  return output;
  // TODO: convert to string and push to stream
};
