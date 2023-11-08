import { ALBEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { S3 } from 'aws-sdk';
import { getEnvOrFail } from '../../../../utils';
import { log } from '../../../utils/logger';
import { getUser, validateAdminUser } from '../../../utils/userService';
import {
  getKeyData,
  getRaitaLambdaErrorResponse,
  getRaitaSuccessResponse,
  isZipParentPath,
  isZipPath,
  RaitaLambdaError,
} from '../../utils';
import MetadataPort from '../../../ports/metadataPort';

function getLambdaConfigOrFail() {
  return {
    receptionBucket: getEnvOrFail('RECEPTION_BUCKET', 'handleDeleteRequest'),
    inspectionBucket: getEnvOrFail('INSPECTION_BUCKET', 'handleDeleteRequest'),
    openSearchDomain: getEnvOrFail('OPENSEARCH_DOMAIN', 'handleDeleteRequest'),
    region: getEnvOrFail('REGION', 'handleDeleteRequest'),
    metadataIndex: getEnvOrFail('METADATA_INDEX', 'handleDeleteRequest'),
  };
}

/**
 * Handle an incoming delete request
 * Delete keys that start with given prefix
 */
export async function handleDeleteRequest(
  event: ALBEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    const { body } = event;
    const s3 = new S3();
    const {
      receptionBucket,
      inspectionBucket,
      metadataIndex,
      region,
      openSearchDomain,
    } = getLambdaConfigOrFail();
    const user = await getUser(event);
    // TODO: permission check not implemented
    await validateAdminUser(user);
    const requestBody = body && JSON.parse(body);
    if (!requestBody?.prefix) {
      throw new RaitaLambdaError('Prefix not specified', 400);
    }
    const { prefix } = requestBody;
    log.info({ prefix: prefix, user: user.uid }, 'Delete request received');

    const { path, fileSuffix } = getKeyData(prefix);

    if (fileSuffix.length) {
      throw new RaitaLambdaError('Prefix must not have file suffix', 400);
    }
    const validPath = isZipPath(path) || isZipParentPath(path);

    if (!validPath) {
      throw new RaitaLambdaError('Invalid prefix length', 400);
    }
    // TODO: validate that prefix is one of: single zip file or full folder name
    // must define if some paths are forbidden (for example: /*)

    // can delete from three places: reception bucket, inspection bucket, metadata store
    // TODO: read these flags from input?
    const deleteFrom = { reception: true, inspection: true, metadata: true };

    let receptionDeleteCount = 0;
    let inspectionDeleteCount = 0;
    let metadataDeleteCount = 0;

    if (deleteFrom.reception) {
      receptionDeleteCount = await deleteFromBucket(
        prefix,
        receptionBucket,
        s3,
      );
      log.info(`Deleted from reception bucket: ${receptionDeleteCount}`);
    }

    if (deleteFrom.inspection) {
      // note: amount of inspection bucket objects is 10-100x higher than reception data
      inspectionDeleteCount = await deleteFromBucket(
        prefix,
        inspectionBucket,
        s3,
      );
      log.info(`Deleted from inspection bucket: ${inspectionDeleteCount}`);
    }

    if (deleteFrom.metadata) {
      metadataDeleteCount = await deleteFromMetadata(
        prefix,
        metadataIndex,
        region,
        openSearchDomain,
      );
      log.info(`Deleted from metadata: ${metadataDeleteCount}`);
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

    return getRaitaSuccessResponse({
      receptionDeleteCount,
      inspectionDeleteCount,
      metadataDeleteCount,
    });
  } catch (err: any) {
    log.error(`Error in handleDeleteRequest: ${err.message}`);
    return getRaitaLambdaErrorResponse(err);
  }
}

/**
 * Delete objects from bucket that begin with given prefix
 * @return amount of deleted objects
 */
async function deleteFromBucket(prefix: string, bucket: string, s3: S3) {
  try {
    let fetchMore = true;
    let continuationToken: string | undefined = undefined;
    // note: listObjectsV2 only returns 1000 keys at a time and deleteObjects only accepts 1000 keys at a time
    const keyBatches: string[][] = []; // array of arrays of up to 1000 keys
    // loop through multiple requests if there are more than 1000 keys
    while (fetchMore) {
      const params: S3.ListObjectsV2Request = {
        Bucket: bucket,
        Prefix: prefix,
      };
      if (continuationToken) {
        params.ContinuationToken = continuationToken;
      }
      const listResponse = await s3.listObjectsV2(params).promise();
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
    const deleteResponses = keyBatches.map(keys =>
      s3
        .deleteObjects({
          Bucket: bucket,
          Delete: {
            Objects: keys.map(key => ({
              Key: key,
            })),
          },
        })
        .promise(),
    );
    const responses = await Promise.all(deleteResponses);
    let deleteCount = 0;
    responses.forEach(response => {
      if (response.Deleted) {
        log.info({ keys: response.Deleted.map(d => d.Key) }, 'Deleted');
        deleteCount += response.Deleted.length;
      } else {
        log.error('No keys deleted');
      }
      if (response.Errors) {
        log.error(
          { errors: response.Errors },
          'Errors with bucket delete request',
        );
      }
    });
    return deleteCount;
  } catch (err: any) {
    throw new RaitaLambdaError(
      `Error deleting from bucket ${bucket}: ${err.message}`,
      500,
    );
  }
}

/**
 * Delete data keys starting with given prefix from metadata
 * @return amount of deleted metadata documents
 */
async function deleteFromMetadata(
  prefix: string,
  metadataIndex: string,
  region: string,
  openSearchDomain: string,
) {
  try {
    const metadata = new MetadataPort({
      backend: 'openSearch',
      metadataIndex,
      region,
      openSearchDomain,
    });
    const response = await metadata.deleteByKeyPrefix(prefix);
    // TODO: response does not contain which documents were deleted. Is this info needed?
    if (response.errors) {
      log.error(
        { errors: response.errors },
        'Errors with metadata delete request',
      );
    }
    return response.deleted;
  } catch (err: any) {
    throw new RaitaLambdaError(
      `Error deleting from metadata: ${err.message}`,
      500,
    );
  }
}
