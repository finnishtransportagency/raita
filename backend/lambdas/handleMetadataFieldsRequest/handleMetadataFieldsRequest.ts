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

const MetadataFieldSchema = z.object({
  type: z.string(),
});

const FieldMappingsSchema = z.record(
  z.string(),
  z.object({
    mappings: z.object({
      properties: z.object({
        metadata: z.object({
          properties: z.record(z.string(), MetadataFieldSchema),
        }),
      }),
    }),
  }),
);

function parseMetadataFields(res: any, metadataIndexName: string) {
  console.log(typeof res);
  console.log(res);
  if (!res.body) {
    throw new RaitaLambdaError('Missing response body', 500);
  }
  // const parsed = JSON.parse(data);
  const responseData = FieldMappingsSchema.parse(res.body);
  const metadataIndexData = responseData[metadataIndexName];
  if (!metadataIndexData) {
    throw new RaitaLambdaError(
      'Response from database port does not contain data for given index.',
      500,
    );
  }
  const fields = metadataIndexData.mappings.properties.metadata.properties;
  return Object.keys(fields).map(key => {
    const value = fields[key];
    return { [key]: { type: value.type } };
  });
}
