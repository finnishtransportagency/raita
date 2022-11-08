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

// NOTE: This is INCOMPLETE schema typing of report type response
export const ReportTypesSchema = z.object({
  aggregations: z.object({
    types: z.object({
      buckets: z.array(BucketElementSchema),
    }),
  }),
});
