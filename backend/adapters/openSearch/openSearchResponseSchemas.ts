import { z } from 'zod';

// NOTE: This is INCOMPLETE schema typing of metadata fields
const MetadataFieldSchema = z.object({
  type: z.string(),
});

export const FieldMappingsSchema = z.record(
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

const BucketElementSchema = z.object({
  key: z.string(),
  doc_count: z.number(),
});

/**
 * NOTE: This is INCOMPLETE schema typing of report type response
 *  */
export const AggregationsResponseSchema = z.object({
  aggregations: z.object({
    report_types: z.object({
      buckets: z.array(BucketElementSchema),
    }),
    file_types: z.object({
      buckets: z.array(BucketElementSchema),
    }),
    systems: z.object({
      buckets: z.array(BucketElementSchema),
    }),
    track_numbers: z.object({
      buckets: z.array(BucketElementSchema),
    }),
    track_parts: z.object({
      buckets: z.array(BucketElementSchema),
    }),
  }),
});

export type AggregationsResponseSchemaType = z.infer<
  typeof AggregationsResponseSchema
>;

const MetadataDocument = z.object({
  key: z.string(),
  file_name: z.string(),
  bucket_arn: z.string(),
  bucket_name: z.string(),
  size: z.number(),
  metadata: z.record(z.string(), z.any()),
});

/**
 * Note: Incomplete schema description
 */
const MetadataSearchResult = z.object({
  _score: z.number(),
  _source: MetadataDocument,
});

/**
 * Note: Incomplete schema description
 */
export const MetadataSearchResponseSchema = z.object({
  hits: z.array(MetadataSearchResult),
  total: z.object({
    value: z.number(),
    relation: z.string(),
  }),
});
