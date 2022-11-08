import { S3Event } from 'aws-lambda';
import { logger } from '../../../utils/logger';
import { S3 } from '@aws-sdk/client-s3';
import * as unzipper from 'unzipper';
import { getGetEnvWithPreassignedContext } from '../../../../utils';

function getLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext('Metadata parser lambda');
  return {
    targetBucketName: getEnv('TARGET_BUCKET_NAME'),
  };
}

/**
 * zip handling logic based on https://gist.github.com/nerychucuy/5cf0e169d330d8fbba85529d14907d31
 */
export async function handleZipFileEvent(event: S3Event): Promise<void> {
  try {
    const recordResults = event.Records.map(async eventRecord => {
      // TODO: Unzip and store results.
      const config = getLambdaConfigOrFail();

      console.log(eventRecord);
      const s3 = new S3({});

      const getObjectResult = await s3.getObject({
        Bucket: eventRecord.s3.bucket.name,
        Key: eventRecord.s3.object.key,
      });
      console.log('got object');

      // env-specific stream with added mixin methods.
      const bodyStream = getObjectResult.Body;
      console.log(typeof getObjectResult.Body);

      bodyStream
        .on('error', (e: unknown) => console.log(`Error extracting file: `, e))
        .pipe(
          unzipper.Parse().on('data', async data => {
            console.log('data received.');
            const fileName = data.path;
            const type = data.type;
            await s3.putObject({
              Bucket: config.targetBucketName,
              Key: fileName,
              Body: data,
            });
          }),
        );
    });
    console.log('awaiting done');
    await Promise.all(recordResults);
  } catch (err) {
    // TODO: Implement proper error handling.
    logger.logError(`An error occured while processing zip events: ${err}`);
  }
}
