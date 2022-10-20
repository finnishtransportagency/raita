import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { z } from 'zod';
import MetadataPort from '../../ports/metadataPort';
import { logger } from '../../utils/logger';
import {
  getOpenSearchLambdaConfigOrFail,
  getRaitaLambdaError,
  RaitaLambdaError,
} from '../utils';

/**
 * DRAFT IMPLEMENTATION
 * Returns meta data fields that are available in the data base
 */
export async function handleMetadataFieldsRequest(
  event: APIGatewayEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    const { openSearchDomain, region, metadataIndex } =
      getOpenSearchLambdaConfigOrFail();
    const metadata = new MetadataPort({
      backend: 'openSearch',
      metadataIndex,
      region,
      openSearchDomain,
    });
    const rawFieldsResponse = await metadata.getMetadataFields();
    const fields = parseMetadataFields(rawFieldsResponse);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        {
          result,
        },
        null,
        2,
      ),
    };
  } catch (err: unknown) {
    logger.logError(err);
    return getRaitaLambdaError(err);
  }
}

const FieldMappingsSchema = z.object({});

function parseMetadataFields(res: any) {
  if (typeof res !== 'string') {
    throw new RaitaLambdaError(
      'Unexpected response type from database port',
      500,
    );
  }
  const parsed = JSON.parse(res);
  const fields = FieldMappingsSchema.parse(parsed);
  return fields;
}
