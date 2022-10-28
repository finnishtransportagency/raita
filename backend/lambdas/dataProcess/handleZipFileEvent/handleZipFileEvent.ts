import { S3Event } from 'aws-lambda';
import { logger } from '../../../utils/logger';

export async function handleZipFileEvent(event: S3Event): Promise<void> {
  try {
    const recordResults = event.Records.map(async eventRecord => {
      // TODO: Unzip and store results.
      console.log(eventRecord);
    });
  } catch (err) {
    // TODO: Implement proper error handling.
    logger.logError(`An error occured while processing zip events: ${err}`);
  }
}
