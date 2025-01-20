import { Context, SNSEvent } from 'aws-lambda';
import { log } from '../../../utils/logger';
import { lambdaRequestTracker } from 'pino-lambda';
import { getEnvOrFail } from '../../../../utils';
import {
  CopyObjectCommand,
  GetObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { ExternalDataMessage } from '../types';

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
  const client = new S3Client();
  log.info({ event }, 'Event received');
  const handled = event.Records.map(async record => {
    const eventContent = record.Sns.Message;
    const parsed: ExternalDataMessage = JSON.parse(eventContent);
    const key = parsed.key;
    if (!key) {
      throw new Error('no key');
    }
    if (parsed.status === 'IMG_EXPORT') {
      // TODO use metadata somehow?
      const metadata = parsed.metadata;
      const command = new CopyObjectCommand({
        Key: key,
        Bucket: config.targetBucket,
        CopySource: `${config.sourceBucket}/${key}`,
      });
      await client.send(command);
    } else if (parsed.status === 'FULLY_PARSED') {
      log.info('receive fully parsed');
    }
  });
  await Promise.all(handled);
}
