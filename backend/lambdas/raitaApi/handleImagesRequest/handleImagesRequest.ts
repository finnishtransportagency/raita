import { ALBEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ListObjectsCommand, S3Client } from '@aws-sdk/client-s3';
import { getEnvOrFail } from '../../../../utils';
import { logger } from '../../../utils/logger';
import {
  decodeS3EventPropertyString,
  getRaitaLambdaErrorResponse,
  getRaitaSuccessResponse,
} from '../../utils';

function getLambdaConfigOrFail() {
  return {
    dataBucket: getEnvOrFail('DATA_BUCKET', 'handleS3FileRequest)'),
  };
}

/**
 * Returns a list of related images for a given S3 key.
 */
export async function handleImagesRequest(
  event: ALBEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> {
  const { body } = event;
  try {
    const { dataBucket } = getLambdaConfigOrFail();
    const requestBody = body && JSON.parse(body);
    if (!requestBody?.key) {
      throw new Error('Key not specified');
    }
    const { key } = requestBody;
    const filePath = decodeS3EventPropertyString(key).split('/');
    const folderPath = filePath.slice(0, -1);
    const imagesFolderKey = folderPath.concat('jpg').join('/');
    const command = new ListObjectsCommand({
      Bucket: dataBucket,
      Prefix: imagesFolderKey,
    });
    const s3Client = new S3Client({});
    const s3ImagesList = await s3Client.send(command);
    const images =
      s3ImagesList.Contents?.map(image => ({
        key: image.Key,
        size: image.Size,
      })) ?? [];
    return getRaitaSuccessResponse({ images });
  } catch (err: unknown) {
    logger.logError(err);
    return getRaitaLambdaErrorResponse(err);
  }
}