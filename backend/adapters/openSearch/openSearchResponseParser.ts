import { SearchHit } from '@opensearch-project/opensearch/api/types';
import {
  AggregationsResponseSchema,
  AggregationsResponseSchemaType,
  FieldMappingsSchema,
  IMetadataDocument,
  MetadataSearchResponseSchema,
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
      ) as Array<{ reportType: string; count: 1 }>,
      fileTypes: this.transformAggregationsResult(
        aggregations,
        'file_types',
        'fileType',
      ) as Array<{ fileType: string; count: 1 }>,
      systems: this.transformAggregationsResult(
        aggregations,
        'systems',
        'value',
      ) as Array<{ value: string; count: 1 }>,
      trackNumbers: this.transformAggregationsResult(
        aggregations,
        'track_numbers',
        'value',
      ) as Array<{ value: string; count: 1 }>,
      trackParts: this.transformAggregationsResult(
        aggregations,
        'track_parts',
        'value',
      ) as Array<{ value: string; count: 1 }>,
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

  parseSearchResponse = (res: any) => {
    if (!res.body) {
      throw new Error('Missing search response body');
    }
    const responseData = MetadataSearchResponseSchema.parse(res.body);
    const total = responseData.hits.total;
    const totalSize = res.body.aggregations?.total_size?.value || 0;
    return {
      total: typeof total === 'number' ? total : total.value,
      totalSize,
      hits: responseData.hits.hits
        .filter(
          (
            hit,
          ): hit is SearchHit<IMetadataDocument> & {
            _source: IMetadataDocument;
          } => Boolean(hit._source),
        )
        .map(hit => {
          const { _score: score, _source } = hit;
          const { key, file_name, size, metadata } = _source;
          return { score, source: { key, file_name, size, metadata } };
        }),
    };
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
