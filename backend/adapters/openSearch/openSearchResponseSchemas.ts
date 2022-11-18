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
  }),
});
