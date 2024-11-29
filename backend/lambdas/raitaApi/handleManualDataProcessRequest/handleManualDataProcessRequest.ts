import { ALBEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import {
  CopyObjectCommand,
  CreateMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  S3Client,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
  CopyObjectCommandInput,
  _Object,
  UploadPartCopyCommand,
} from '@aws-sdk/client-s3';
import { getEnvOrFail } from '../../../../utils';
import { log } from '../../../utils/logger';
import { getUser, validateAdminUser } from '../../../utils/userService';
import {
  getKeyData,
  getRaitaLambdaErrorResponse,
  getRaitaSuccessResponse,
  isCampaignOrMoreSpecificPath,
  isZipPath,
  RaitaLambdaError,
} from '../../utils';
import { IAdminLogger } from '../../../utils/adminLog/types';
import { PostgresLogger } from '../../../utils/adminLog/postgresLogger';
import { lambdaRequestTracker } from 'pino-lambda';
import { getDBConnection } from '../../dataProcess/csvCommon/db/dbUtil';

function getLambdaConfigOrFail() {
  return {
    receptionBucket: getEnvOrFail(
      'RECEPTION_BUCKET',
      'handleManualDataProcessRequest',
    ),
    inspectionBucket: getEnvOrFail(
      'INSPECTION_BUCKET',
      'handleManualDataProcessRequest',
    ),
  };
}

const dbConnection = getDBConnection();
const adminLogger: IAdminLogger = new PostgresLogger(dbConnection);

const setTimeoutPromise = (delay: number) =>
  new Promise((resolve, reject) => {
    setTimeout(() => resolve(null), delay);
  });
const withRequest = lambdaRequestTracker();

/**
 * Handle an incoming request to start manual data (re-)process
 */
export async function handleManualDataProcessRequest(
  event: ALBEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> {
  withRequest(event, _context);
  try {
    const { body } = event;
    const s3Client = new S3Client({});
    const { receptionBucket, inspectionBucket } = getLambdaConfigOrFail();
    const user = await getUser(event);
    await validateAdminUser(user);
    const requestBody = body && JSON.parse(body);
    if (!requestBody?.prefix) {
      throw new RaitaLambdaError('Prefix not specified', 400);
    }
    const { prefix, skipHashCheck, requireNewerParserVersion } = requestBody;
    log.info(
      { prefix: prefix, user: user.uid },
      'Manual data process request received',
    );
    const invocationId = prefix;
    await adminLogger.init('data-reception', invocationId);
    await adminLogger.info(
      `Tiedostojen käsittelypyyntö vastaanotettu. Käyttäjä: ${user.uid}. Input: ${prefix}`,
    );

    const { path } = getKeyData(prefix);
    const validReceptionPath =
      isZipPath(path) || isCampaignOrMoreSpecificPath(path); // block paths that are broader than "campaign" level
    const validInspectionPath = path.length > 5;
    if (!validReceptionPath && !validInspectionPath) {
      throw new RaitaLambdaError('Invalid prefix length', 400);
    }
    if (!['1', '0'].includes(skipHashCheck)) {
      throw new RaitaLambdaError('Invalid skipHashCheck value', 400);
    }
    if (!['1', '0'].includes(requireNewerParserVersion)) {
      throw new RaitaLambdaError(
        'Invalid requireNewerParserVersion value',
        400,
      );
    }
    const copyZips = validReceptionPath;
    const targetBucket = copyZips ? receptionBucket : inspectionBucket;

    const metadata: { [key: string]: string } = {
      'skip-hash-check': skipHashCheck,
      'require-newer-parser-version': requireNewerParserVersion,
    };
    if (!copyZips) {
      // add invocationId metadata only for non zips: zips are logged with default invocationId = zip file name
      metadata['invocation-id'] = encodeURIComponent(invocationId);
    }
    const copiedCount = await copyInBucket(
      prefix,
      targetBucket,
      s3Client,
      metadata,
    );
    if (copiedCount === 0) {
      await adminLogger.error(
        'Annetulla avaimella ei löytynyt kopioitavia tietoja',
      );
      return getRaitaLambdaErrorResponse({ message: 'No keys found' });
    }
    if (copyZips) {
      await adminLogger.info(
        `Tiedostojen käsittely käynnistetty. Siirretty käsittelyyn zip-tiedostoja: ${copiedCount}`,
      );
      await adminLogger.init('data-inspection', invocationId);
      await adminLogger.info(
        'Yksittäisen zip-tiedoston lokit näkyvät omassa tapahtumassaan.',
      );
    } else {
      await adminLogger.info(
        `Tiedostojen käsittely käynnistetty. Siirretty käsittelyyn tiedostoja: ${copiedCount}`,
      );
    }
    return getRaitaSuccessResponse({
      count: copiedCount,
      bucket: copyZips ? 'reception' : 'inspection',
    });
  } catch (err: any) {
    log.error(`Error in handleRerunRequest: ${err.message}`);
    await adminLogger.error(
      'Tiedostojen käsittelyn käynnistämisessä tapahtui virhe',
    );
    return getRaitaLambdaErrorResponse(err);
  }
}

/**
 * Copy object with same source and destination path to trigger data process
 * Also set metadata
 * @return amount of copied objects
 */
async function copyInBucket(
  prefix: string,
  bucket: string,
  s3Client: S3Client,
  metadata: { [key: string]: string },
) {
  const waitPerRequest = 10;
  try {
    let fetchMore = true;
    let continuationToken: string | undefined = undefined;
    // note: listObjectsV2 only returns 1000 keys at a time
    const objectBatches: _Object[][] = []; // array of arrays of up to 1000 objects
    // loop through multiple requests if there are more than 1000 keys
    while (fetchMore) {
      const params: ListObjectsV2CommandInput = {
        Bucket: bucket,
        Prefix: prefix,
      };
      if (continuationToken) {
        params.ContinuationToken = continuationToken;
      }
      const listCommand = new ListObjectsV2Command(params);
      const listResponse = await s3Client.send(listCommand);
      if (!listResponse) {
        throw new RaitaLambdaError('Error with listObjects', 500);
      }
      const objects = listResponse.Contents ?? [];
      if (!objects.length) {
        log.warn(`No objects found in ${bucket} with prefix ${prefix}`);
        return 0;
      }
      objectBatches.push(objects);
      if (listResponse.IsTruncated) {
        continuationToken = listResponse.NextContinuationToken;
      } else {
        fetchMore = false;
      }
    }
    const allObjects = objectBatches.flat();
    // TODO: using single copy requests might not work if file count is too high?
    for (let i = 0; i < allObjects.length; i++) {
      const object = allObjects[i];
      await copyFileInPlace(s3Client, object, {
        Bucket: bucket,
        CopySource: encodeURIComponent(`${bucket}/${object.Key}`),
        Key: object.Key,
        Metadata: metadata,
        MetadataDirective: 'REPLACE',
      });
      // wait between each request to not hit s3 ratelimits
      await setTimeoutPromise(waitPerRequest);
    }
    return allObjects.length;
  } catch (err: any) {
    log.error({
      error: err,
      message: 'Error copying from bucket',
      prefix,
      bucket,
    });
    throw new RaitaLambdaError(
      `Error copying from bucket ${bucket}: ${err.message}`,
      500,
    );
  }
}

/**
 * Copy file in place, changing metadata
 * Use multipart upload for large enough files
 */
async function copyFileInPlace(
  s3Client: S3Client,
  existingObject: _Object,
  input: CopyObjectCommandInput,
) {
  const objectSize = existingObject.Size;
  if (!objectSize) {
    throw new Error('No objectSize?');
  }
  const sizeLimit = 1024 * 1024 * 100; // 100MB
  const useMultipart = objectSize > sizeLimit;
  if (!useMultipart) {
    const command = new CopyObjectCommand(input);
    return s3Client.send(command);
  }
  const partSize = sizeLimit;

  let uploadId: string | undefined;
  try {
    const multipartUpload = await s3Client.send(
      new CreateMultipartUploadCommand({
        Bucket: input.Bucket,
        Key: input.Key,
      }),
    );
    const partPromises = [];
    uploadId = multipartUpload.UploadId;
    const partCount = Math.ceil(objectSize / partSize);
    for (let i = 0; i < partCount; i++) {
      const start = i * partSize;
      const end = Math.min(start + partSize - 1, objectSize - 1);
      const copyInput = {
        ...input,
        PartNumber: i + 1,
        UploadId: uploadId,
        CopySourceRange: `bytes=${start}-${end}`,
      };
      partPromises.push(s3Client.send(new UploadPartCopyCommand(copyInput)));
    }
    const partResults = await Promise.all(partPromises);
    return await s3Client.send(
      new CompleteMultipartUploadCommand({
        Bucket: input.Bucket,
        Key: input.Key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: partResults.map((res, i) => ({
            ETag: res.CopyPartResult?.ETag,
            PartNumber: i + 1,
          })),
        },
      }),
    );
  } catch (error) {
    log.error({ msg: 'Error in multipart copy, aborting', error });
    if (uploadId) {
      const abortCommand = new AbortMultipartUploadCommand({
        Bucket: input.Bucket,
        Key: input.Key,
        UploadId: uploadId,
      });
      await s3Client.send(abortCommand);
    }
    throw new RaitaLambdaError('Error in multipart copy', 500);
  }
}
