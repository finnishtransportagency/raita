import { ALBEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
  S3Client,
} from '@aws-sdk/client-s3';
import { getEnvOrFail } from '../../../../utils';
import { log } from '../../../utils/logger';
import { getUser, validateAdminUser } from '../../../utils/userService';
import {
  addZipFileExtension,
  getKeyData,
  getRaitaLambdaErrorResponse,
  getRaitaSuccessResponse,
  isZipParentPath,
  isZipPath,
  RaitaLambdaError,
} from '../../utils';
import { IAdminLogger } from '../../../utils/adminLog/types';
import { PostgresLogger } from '../../../utils/adminLog/postgresLogger';
import { lambdaRequestTracker } from 'pino-lambda';
import { getDBConnection } from '../../dataProcess/csvCommon/db/dbUtil';

function getLambdaConfigOrFail() {
  return {
    receptionBucket: getEnvOrFail('RECEPTION_BUCKET', 'handleDeleteRequest'),
    inspectionBucket: getEnvOrFail('INSPECTION_BUCKET', 'handleDeleteRequest'),
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
 * Handle an incoming delete request
 * Delete keys that start with given prefix
 */
export async function handleDeleteRequest(
  event: ALBEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> {
  withRequest(event, _context);
  try {
    const { body } = event;
    const s3Client = new S3Client();
    const { receptionBucket, inspectionBucket } = getLambdaConfigOrFail();
    const user = await getUser(event);
    await validateAdminUser(user);
    const requestBody = body && JSON.parse(body);
    if (!requestBody?.prefix) {
      throw new RaitaLambdaError('Prefix not specified', 400);
    }
    const { prefix } = requestBody;
    log.info({ prefix: prefix, user: user.uid }, 'Delete request received');

    await adminLogger.init('delete-process', prefix);
    await adminLogger.info(
      `Poistopyynto vastaanotettu. Käyttäjä: ${user.uid}. Input: ${prefix}`,
    );

    const { path, fileSuffix } = getKeyData(prefix);

    if (fileSuffix.length) {
      throw new RaitaLambdaError('Prefix must not have file suffix', 400);
    }
    if (prefix[prefix.length - 1] !== '/') {
      throw new RaitaLambdaError('Prefix must end in "/"', 400);
    }
    // zip path checks assume no trailing '/', remove before checks
    const pathTruncated = path.slice(0, path.length - 1);
    const isZip = isZipPath(pathTruncated);
    const isZipParent = isZipParentPath(pathTruncated);
    const validPath = isZip || isZipParent;

    if (!validPath) {
      throw new RaitaLambdaError('Invalid prefix length', 400);
    }

    // can delete from three places: reception bucket, inspection bucket, metadata store
    // TODO: read these flags from input?
    const deleteFrom = { reception: true, inspection: true, metadata: true };

    let receptionDeleteCount = 0;
    let inspectionDeleteCount = 0;
    let metadataDeleteCount = 0;

    if (deleteFrom.reception) {
      receptionDeleteCount = await deleteFromBucket(
        isZip ? addZipFileExtension(prefix) : prefix,
        receptionBucket,
        s3Client,
      );
    }

    if (deleteFrom.inspection) {
      // note: amount of inspection bucket objects is 10-100x higher than reception data
      inspectionDeleteCount = await deleteFromBucket(
        prefix,
        inspectionBucket,
        s3Client,
      );
    }

    if (deleteFrom.metadata) {
      metadataDeleteCount = await deleteFromPostgres(prefix);
    }
    if (
      deleteFrom.inspection &&
      deleteFrom.metadata &&
      inspectionDeleteCount !== metadataDeleteCount
    ) {
      log.warn(
        `Mismatch with inspection bucket delete count (${inspectionDeleteCount}) and metadata delete count (${inspectionDeleteCount})`,
      );
    }
    log.info({
      deleteCounts: {
        receptionDeleteCount,
        inspectionDeleteCount,
        metadataDeleteCount,
      },
    });
    await adminLogger.info(
      `Poistettujen tiedostojen määrät: zip-vastaanotto ${receptionDeleteCount}, tiedostosäilö ${inspectionDeleteCount}, metadatasäilö ${metadataDeleteCount}`,
    );
    return getRaitaSuccessResponse({
      receptionDeleteCount,
      inspectionDeleteCount,
      metadataDeleteCount,
    });
  } catch (err: any) {
    log.error(`Error in handleDeleteRequest: ${err.message}`);
    await adminLogger.error('Tiedostojen poistamisessa tapahtui virhe');
    return getRaitaLambdaErrorResponse(err);
  }
}

/**
 * Delete objects from bucket that begin with given prefix
 * @return amount of deleted objects
 */
async function deleteFromBucket(
  prefix: string,
  bucket: string,
  s3Client: S3Client,
) {
  const waitPerRequest = 500;
  try {
    let fetchMore = true;
    let continuationToken: string | undefined = undefined;
    // note: listObjectsV2 only returns 1000 keys at a time and deleteObjects only accepts 1000 keys at a time
    const keyBatches: string[][] = []; // array of arrays of up to 1000 keys
    // loop through multiple requests if there are more than 1000 keys
    while (fetchMore) {
      // first fetch list of object keys to delete
      const params: ListObjectsV2CommandInput = {
        Bucket: bucket,
        Prefix: prefix,
      };
      if (continuationToken) {
        params.ContinuationToken = continuationToken;
      }
      const listResponse = await s3Client.send(
        new ListObjectsV2Command(params),
      );
      if (!listResponse) {
        throw new RaitaLambdaError('Error with listObjects', 500);
      }
      const keys = listResponse.Contents?.map(
        object => object.Key || '',
      ).filter(key => !!key);
      if (!keys || !keys.length) {
        log.warn(`No keys found in ${bucket} with prefix ${prefix}`);
        return 0;
      }
      keyBatches.push(keys);
      if (listResponse.IsTruncated) {
        continuationToken = listResponse.NextContinuationToken;
      } else {
        fetchMore = false;
      }
    }

    // do delete requests
    let deleteCount = 0;
    for (let i = 0; i < keyBatches.length; i++) {
      const keyBatch = keyBatches[i];
      const response = await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Objects: keyBatch.map(key => ({
              Key: key,
            })),
          },
        }),
      );
      if (response.Deleted && response.Deleted.length) {
        const deletedKeys = response.Deleted.map(d => d.Key);
        log.info({ keys: deletedKeys }, `Deleted from ${bucket}`);
        deleteCount += response.Deleted.length;
        await adminLogger.batch(
          deletedKeys.map(key => `Poistettu ${key}`),
          'info',
        );
      } else {
        log.error(`No keys deleted from ${bucket}`);
      }
      if (response.Errors && response.Errors.length) {
        log.error(
          { errors: response.Errors },
          'Errors with bucket delete request',
        );
      }
      // wait between each request to not hit s3 ratelimits
      await setTimeoutPromise(waitPerRequest);
    }
    return deleteCount;
  } catch (err: any) {
    log.error({
      error: err,
      message: 'Error deleting from bucket',
      prefix,
      bucket,
    });
    throw new RaitaLambdaError(
      `Error deleting from bucket ${bucket}: ${err.message}`,
      500,
    );
  }
}

async function deleteFromPostgres(prefix: string) {
  try {
    const response = await (
      await dbConnection
    ).prisma.raportti.deleteMany({
      where: { key: { startsWith: prefix } },
    });
    return response.count;
  } catch (err: any) {
    throw new RaitaLambdaError(
      `Error deleting from Postgre metadata: ${err.message}`,
      500,
    );
  }
}
