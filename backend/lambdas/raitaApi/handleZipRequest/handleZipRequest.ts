import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { S3 } from 'aws-sdk';
import { ALBEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import JSZip from 'jszip';

import { getEnvOrFail } from '../../../../utils';
import { log } from '../../../utils/logger';
import { getUser, validateReadUser } from '../../../utils/userService';
import {
  getRaitaLambdaErrorResponse,
  getRaitaSuccessResponse,
} from '../../utils';

function getLambdaConfigOrFail() {
  return {
    dataBucket: getEnvOrFail('DATA_BUCKET', 'handleZipRequest)'),
  };
}

export async function handleZipRequest(
  event: ALBEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> {
  const { body } = event;
  const requestBody = body && JSON.parse(body);
  const { keys } = requestBody;
  const s3Client = new S3Client({});

  const zip = new JSZip();
  try {
    const user = await getUser(event);
    await validateReadUser(user);
    const { dataBucket } = getLambdaConfigOrFail();
    if (!keys.length) {
      throw new Error('No file keys to handle');
    }
    const promises = keys.map(async (key: string) => {
      const command = new GetObjectCommand({
        Bucket: dataBucket,
        Key: key,
      });
      const data = await s3Client.send(command);
      zip.file(key, data.Body as Uint8Array);
      return data;
    });

    await Promise.all(promises).catch(err => {
      log.error(`Error getting S3 Objects: ${err}`);
      throw err;
    });

    const zipData = await zip
      .generateAsync({ type: 'nodebuffer' })
      .catch(err => {
        log.error(`Error generating zip file: ${err}`);
        throw err;
      });

    const destKey = `raita-zip-${Date.now()}.zip`;
    const putCommand = new PutObjectCommand({
      Bucket: dataBucket,
      Key: destKey,
      Body: zipData,
    });

    await s3Client.send(putCommand).catch(err => {
      log.error(`Error uploading zip file to S3: ${err}`);
      throw err;
    });

    const s3 = new S3();
    const url = s3.getSignedUrl('getObject', {
      Bucket: dataBucket,
      Key: destKey,
      Expires: 30,
    });

    return getRaitaSuccessResponse({ url, destKey });
  } catch (err: unknown) {
    log.error(err);
    return getRaitaLambdaErrorResponse(err);
  }
}
