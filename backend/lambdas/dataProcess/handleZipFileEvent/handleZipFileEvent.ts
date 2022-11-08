import { S3Event } from 'aws-lambda';
import { logger } from '../../../utils/logger';
import { S3, S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as unzipper from 'unzipper';
import { getGetEnvWithPreassignedContext } from '../../../../utils';

function getLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext('Metadata parser lambda');
  return {
    targetBucketName: getEnv('TARGET_BUCKET_NAME'),
  };
}

/**
 * NOTE: Uses UNRELIABLE zip streaming
 * See e.g.: https://github.com/thejoshwolfe/yauzl#no-streaming-unzip-api
 *
 * zip handling logic based on
 * https://gist.github.com/nerychucuy/5cf0e169d330d8fbba85529d14907d31
 * https://github.com/ZJONSSON/node-unzipper/issues/236
 *
 */
export async function handleZipFileEvent(event: S3Event): Promise<void> {
  try {
    const recordResults = event.Records.map(async eventRecord => {
      // TODO: Unzip and store results.
      const config = getLambdaConfigOrFail();

      const filename = decodeURIComponent(
        event.Records[0].s3.object.key.replace(/\+/g, ' '),
      );
      const filepath = filename.substring(0, filename.lastIndexOf('/') + 1);

      console.log(eventRecord);
      const s3 = new S3({});
      const s3Client = new S3Client({});

      const getObjectResult = await s3.getObject({
        Bucket: eventRecord.s3.bucket.name,
        Key: eventRecord.s3.object.key,
      });
      console.log('got object');

      const bodyStream = getObjectResult.Body;
      console.log(typeof getObjectResult.Body);

      const zip = bodyStream.pipe(unzipper.Parse({ forceStream: true }));
      const promises = [];

      let num = 0;

      for await (const e of zip) {
        const entry = e;
        const entryName = entry.path;

        const type = entry.type;
        if (type === 'File') {
          // const entryMimeType = mime.lookup(entryName); // function to use for getting the MIME for each entry extracted

          //
          const uploadParams = {
            Bucket: config.targetBucketName,
            Key: filepath + entryName,
            Body: entry,
            // ContentType: entryMimeType, // we need to include this line of code to add a Content-Type for each entry extracted
          };

          const command = new PutObjectCommand(uploadParams);

          promises.push(await s3.send(command));
          num++;
        } else {
          entry.autodrain();
        }
      }

      await Promise.all(promises);

      // bodyStream
      //   .on('error', (e: unknown) => console.log(`Error extracting file: `, e))
      //   .pipe(
      //     unzipper.Parse().on('data', async data => {
      //       console.log('data received.');
      //       const fileName = data.path;
      //       const type = data.type;
      //       await s3.putObject({
      //         Bucket: config.targetBucketName,
      //         Key: fileName,
      //         Body: data,
      //       });
      //     }),
      //   );
    });
    console.log('awaiting done');
    await Promise.all(recordResults);
  } catch (err) {
    // TODO: Implement proper error handling.
    logger.logError(`An error occured while processing zip events: ${err}`);
  }
}
