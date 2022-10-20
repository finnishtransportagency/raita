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
    const fields = parseMetadataFields(rawFieldsResponse, metadataIndex);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        {
          fields,
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

const FieldMappingsSchema = z.record(
  z.string(),
  z.object({
    mappings: z.object({
      properties: z.object({
        metadata: z.object({
          properties: z.record(z.string(), z.any()),
        }),
      }),
    }),
  }),
);

function parseMetadataFields(res: any, metadataIndexName: string) {
  if (typeof res !== 'string') {
    throw new RaitaLambdaError(
      'Unexpected response type from database port',
      500,
    );
  }
  const parsed = JSON.parse(res);
  const responseData = FieldMappingsSchema.parse(parsed);
  const metadataIndexData = responseData[metadataIndexName];
  if (!metadataIndexData) {
    throw new RaitaLambdaError(
      'Response from database port does not contain data for given index.',
      500,
    );
  }
  return metadataIndexData.mappings.properties.metadata.properties;
}
