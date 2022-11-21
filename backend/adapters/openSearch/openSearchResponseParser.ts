import {
  AggregationsResponseSchema,
  FieldMappingsSchema,
} from './openSearchResponseSchemas';

export class OpenSearchResponseParser {
  parseAggregations = (res: any) => {
    if (!res.body) {
      throw new Error('Missing backend report types response body');
    }
    // AggregationsResponseSchema is currently incomplete description of the data in res.body
    const aggregations = AggregationsResponseSchema.parse(
      res.body,
    ).aggregations;
    // Bucket results are mapped to hide OpenSearch spesific naming from api users
    return {
      reportTypes: aggregations.report_types.buckets.map(element => ({
        reportType: element.key,
        count: element.doc_count,
      })),
      fileTypes: aggregations.file_types.buckets.map(element => ({
        fileType: element.key,
        count: element.doc_count,
      })),
    };
  };

  parseMetadataFields = (res: any, metadataIndexName: string) => {
    if (!res.body) {
      throw new Error('Missing backend meta data fields response body');
    }
    const responseData = FieldMappingsSchema.parse(res.body);
    const metadataIndexData = responseData[metadataIndexName];
    if (!metadataIndexData) {
      throw new Error(
        'Response from database port does not contain data for given index.',
      );
    }
    const fields = metadataIndexData.mappings.properties.metadata.properties;
    return Object.entries(fields).map(([key, value]) => {
      return { [key]: { type: value.type } };
    });
  };
}
