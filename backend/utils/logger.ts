import { S3EventRecord } from 'aws-lambda/trigger/s3';
import { ZodError } from 'zod';
import { RAITA_PARSING_EXCEPTION } from '../../constants';
import { RaitaParseError } from '../lambdas/utils';

class Logger {
  logError = (data: unknown) => {
    if (data instanceof RaitaParseError) {
      this.logParsingException(data.message);
      return;
    }
    const message =
      (typeof data === 'string' && data) ||
      (data instanceof Error && data.message) ||
      (data instanceof ZodError && data.message) ||
      JSON.stringify(data);
    try {
      console.error(message);
    } catch (error) {
      console.error(
        `Logger failed to log a given message: ${
          error instanceof Error && error.message
        }`,
      );
    }
  };

  logParsingException = (msg: string) =>
    this.logError(`${RAITA_PARSING_EXCEPTION}: ${msg}`);

  logS3EventRecord = (eventRecord: S3EventRecord) => {
    this.logError(`File arn: ${eventRecord.s3.bucket.arn}`);
    this.logError(`File object key: ${eventRecord.s3.object.key}`);
    this.logError(`File bucket: ${eventRecord.s3.bucket.name}`);
    this.logError(`File path: ${eventRecord.s3.object.key.split('/')}`);
  };
}

export const logger = new Logger();
