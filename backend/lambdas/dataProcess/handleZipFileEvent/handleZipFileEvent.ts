import { S3Event } from 'aws-lambda';
import { logger } from '../../../utils/logger';
import {
  S3,
  PutObjectCommand,
  PutObjectCommandOutput,
} from '@aws-sdk/client-s3';
import * as unzipper from 'unzipper';
import * as mime from 'mime-types';
import { getGetEnvWithPreassignedContext } from '../../../../utils';

function getLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext('Metadata parser lambda');
  return {
    targetBucketName: getEnv('TARGET_BUCKET_NAME'),
  };
}

/**
 * NOTE: This zip handler implementation uses zip streaming approach offered by unzipper library.
 * However, is zip streaming is inherently UNRELIABLE as it relies on non-spec conformant expectations about the zip file.
 * See e.g.: https://github.com/thejoshwolfe/yauzl#no-streaming-unzip-api for issue description.
 *
 * Function implemetation is based on
 * https://gist.github.com/nerychucuy/5cf0e169d330d8fbba85529d14907d31
 * https://github.com/ZJONSSON/node-unzipper/issues/236
 *
 */
export async function handleZipFileEvent(event: S3Event): Promise<void> {
  try {
    const recordResults = event.Records.map(async eventRecord => {
      const config = getLambdaConfigOrFail();
      // Get filename and filepath
      const filename = decodeURIComponent(
        eventRecord.s3.object.key.replace(/\+/g, ' '),
      );
      const filepath = filename.substring(0, filename.lastIndexOf('/') + 1);
      const s3 = new S3({});
      const getObjectResult = await s3.getObject({
        Bucket: eventRecord.s3.bucket.name,
        Key: eventRecord.s3.object.key,
      });
      const zip = getObjectResult.Body.pipe(
        unzipper.Parse({ forceStream: true }),
      );
      // An array to hold promises from iterating over async iterators of zip
      const promises: Array<PutObjectCommandOutput> = [];
      for await (const entry of zip) {
        const entryName = entry.path;
        const type = entry.type;
        // Only files need to be processed as the there is no need to explicitly create folders in S3
        if (type === 'File') {
          const uploadParams = {
            Bucket: config.targetBucketName,
            Key: filepath + entryName,
            Body: entry,
            // TO CHECK: Setting content type explicitly may not be necessary
            ContentType: mime.lookup(entryName) || undefined,
          };
          const command = new PutObjectCommand(uploadParams);
          promises.push(await s3.send(command));
        } else {
          entry.autodrain();
        }
      }
      // Returns number of promises for accounting simplicity, if flatMap/flat available just return promises and flat arrays
      await Promise.all(promises);
      return promises.length;
    });
    await Promise.all(recordResults).then(counts => {
      const count = counts.reduce((acc, cur) => acc + cur);
      // TODO: Add logging for final count of extracted files?
      // TEMP
      console.log(`${count} files extracted from zip archive.`);
    });
  } catch (err) {
    // TODO: Implement proper error handling to fail gracefully if any of the file extractions fails.
    logger.logError(`An error occured while processing zip events: ${err}`);
  }
}
