import { Context, S3Event, SQSEvent } from 'aws-lambda';
import { log } from '../../../utils/logger';
import { getEnvOrFail } from '../../../../utils';

import { lambdaRequestTracker } from 'pino-lambda';

import { getDBConnection } from '../csvCommon/db/dbUtil';
import {
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  S3Client,
} from '@aws-sdk/client-s3';

function getLambdaConfigOrFail() {
  return {
    targetBucketName: getEnvOrFail('TARGET_BUCKET_NAME'),
    region: getEnvOrFail('REGION'),
  };
}

const withRequest = lambdaRequestTracker();

const config = getLambdaConfigOrFail();
const dbConnection = getDBConnection();

export async function handleFileCountInspection(
  queueEvent: SQSEvent,
  context: Context,
): Promise<void> {
  try {
    withRequest(queueEvent, context);
    const { prisma } = await dbConnection;
    const s3 = new S3Client({ region: config.region });

    const dbFileCount = await prisma.raportti.count();
    let s3BucketFileCount = 0;
    let continuationToken: string | undefined = undefined;

    do {
      const response: ListObjectsV2CommandOutput = await s3.send(
        new ListObjectsV2Command({
          Bucket: config.targetBucketName,
          ContinuationToken: continuationToken,
        }),
      );
      const resWithoutPNG = response.Contents?.filter(
        content => content.Key && !content.Key.endsWith('.png'),
      );
      log.info(`FILES WITHOUT .PNG ${resWithoutPNG}`);
      s3BucketFileCount += resWithoutPNG?.length || 0;
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    log.info(
      `DATABASE FILECOUNT: ${dbFileCount}, S3_BUCKET_FILECOUNT: ${s3BucketFileCount}`,
    );
    // if database and s3 filecount matches. DO NOTHING
    if (dbFileCount === s3BucketFileCount) {
      log.info('FILECOUNTS MATCHES');
      return;
    }
  } catch (err) {
    log.error(`An error occured while processing filecounts: ${err}`);
  }
}
