import {
  AggregationsResponseSchema,
  AggregationsResponseSchemaType,
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
      reportTypes: this.transformAggregationsResult(
        aggregations,
        'report_types',
        'reportType',
      ),
      fileTypes: this.transformAggregationsResult(
        aggregations,
        'file_types',
        'fileType',
      ),
      systems: this.transformAggregationsResult(
        aggregations,
        'systems',
        'value',
      ),
      trackNumbers: this.transformAggregationsResult(
        aggregations,
        'track_numbers',
        'value',
      ),
      trackParts: this.transformAggregationsResult(
        aggregations,
        'track_parts',
        'value',
      ),
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

  private transformAggregationsResult = <T extends string>(
    aggregations: AggregationsResponseSchemaType['aggregations'],
    osResponseKey: keyof AggregationsResponseSchemaType['aggregations'],
    outputKey: T,
  ) =>
    aggregations[osResponseKey].buckets.map(element => ({
      [outputKey]: element.key,
      count: element.doc_count,
    }));
}
