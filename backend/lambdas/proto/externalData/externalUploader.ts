import { Context, SNSEvent } from 'aws-lambda';
import { log } from '../../../utils/logger';
import { lambdaRequestTracker } from 'pino-lambda';
import { getEnvOrFail } from '../../../../utils';
import {
  CopyObjectCommand,
  GetObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

function getLambdaConfigOrFail() {
  return {
    sourceBucket: getEnvOrFail('SOURCE_BUCKET', 'handleExternalDataUpload'),
    targetBucket: getEnvOrFail('TARGET_BUCKET', 'handleExternalDataUpload'),
  };
}
const withRequest = lambdaRequestTracker();

export async function handleExternalDataUpload(
  event: SNSEvent,
  _context: Context,
): Promise<void> {
  withRequest(event, _context);
  const config = getLambdaConfigOrFail();
  log.info({ event }, 'Event received');
  // const { body } = event;
  // const s3 = new S3();
  // get file from s3 and push to "external data source"
  const key = '';
  if (key) {
    const client = new S3Client();
    const command = new CopyObjectCommand({
      Key: key,
      Bucket: config.targetBucket,
      CopySource: `${config.sourceBucket}/${key}`,
    });
    client.send(command);
  }
}
