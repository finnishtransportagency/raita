import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import MetadataPort from '../../../ports/metadataPort';
import { logger } from '../../../utils/logger';
import {
  getOpenSearchLambdaConfigOrFail,
  getRaitaLambdaError,
  RaitaLambdaError,
} from '../../utils';
import {
  FieldMappingsSchema,
  AggregationsResponseSchema,
} from './handleMetaRequestSchemas';

/**
 * Returns meta information about inspection report (meta) data stored in Raita database
 */
export async function handleMetaRequest(
  event: APIGatewayEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    const { openSearchDomain, region, metadataIndex } =
      getOpenSearchLambdaConfigOrFail();
    const metadataPort = new MetadataPort({
      backend: 'openSearch',
      metadataIndex,
      region,
      openSearchDomain,
    });
    // TODO: Process requests parallel, not sequentially
    // TODO?: Reorganize reponsibilities between lambda handler, port and adapter
    const rawFieldsResponse = await metadataPort.getMetadataFields();
    const fields = parseMetadataFields(rawFieldsResponse, metadataIndex);
    const rawReportTypesResponse = await metadataPort.getReportTypes();
    const reportTypes = parseReportTypes(rawReportTypesResponse);
    const rawFileTypesResponse = await metadataPort.getFileTypes();
    const fileTypes = parseFileTypes(rawFileTypesResponse);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields,
        reportTypes,
        fileTypes,
      }),
    };
  } catch (err: unknown) {
    logger.logError(err);
    return getRaitaLambdaError(err);
  }
}

function parseMetadataFields(res: any, metadataIndexName: string) {
  if (!res.body) {
    throw new RaitaLambdaError(
      'Missing backend meta data fields response body',
      500,
    );
  }
  const responseData = FieldMappingsSchema.parse(res.body);
  const metadataIndexData = responseData[metadataIndexName];
  if (!metadataIndexData) {
    throw new RaitaLambdaError(
      'Response from database port does not contain data for given index.',
      500,
    );
  }
  const fields = metadataIndexData.mappings.properties.metadata.properties;
  return Object.entries(fields).map(([key, value]) => {
    return { [key]: { type: value.type } };
  });
}

function parseReportTypes(res: any) {
  if (!res.body) {
    throw new RaitaLambdaError(
      'Missing backend report types response body',
      500,
    );
  }
  return AggregationsResponseSchema.parse(
    res.body,
  ).aggregations.types.buckets.map(element => ({
    reportType: element.key,
    count: element.doc_count,
  }));
}

function parseFileTypes(res: any) {
  if (!res.body) {
    throw new RaitaLambdaError('Missing backend file types response body', 500);
  }
  return AggregationsResponseSchema.parse(
    res.body,
  ).aggregations.types.buckets.map(element => ({
    fileType: element.key,
    count: element.doc_count,
  }));
}
