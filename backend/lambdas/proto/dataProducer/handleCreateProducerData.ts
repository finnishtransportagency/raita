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
// import { FILEPART_SUFFIX, ZIP_SUFFIX } from '../../../../constants';
// import { launchECSZipTask } from './utils';
// import { IAdminLogger } from '../../../utils/adminLog/types';
// import { PostgresLogger } from '../../../utils/adminLog/postgresLogger';
// import {
//   DataProcessLockedError,
//   acquireDataProcessLockOrFail,
// } from '../../../utils/dataProcessLock';
import { lambdaRequestTracker } from 'pino-lambda';
import { SQSClient } from '@aws-sdk/client-sqs';

function getLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext('handleCreateProducerData');
  return {
    // queueUrl: getEnv('QUEUE_URL'),
    // targetBucketName: getEnv('TARGET_BUCKET_NAME'),
    endpointUrl: getEnv('ENDPOINT_URL'),
  };
}

const withRequest = lambdaRequestTracker();

const config = getLambdaConfigOrFail();

export async function handleCreateProducerData(
  queueEvent: SQSEvent,
  context: Context,
): Promise<void> {
  try {
    withRequest(queueEvent, context);
    const config = getLambdaConfigOrFail();
    // create zip file
    const topic = '';
    const data = '';
    // upload to datahub api
    const url = config.endpointUrl;
    // post request to URL?
  } catch (err) {
    log.error({ msg: 'error at top level', err });
  }
}
