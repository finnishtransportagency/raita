import { z } from 'zod';

const parseOptions = z.enum(['integer', 'float', 'date']).optional();

export const ColonSeparatedKeyValuePairDefinition = z.object({
  propertyKey: z.string(),
  pattern: z.object({
    predefinedPatternId: z.literal('colonSeparatedKeyValuePair'),
    searchKey: z.string(),
  }),
  parseAs: parseOptions,
});

export type IColonSeparatedKeyValuePairDefinition = z.infer<
  typeof ColonSeparatedKeyValuePairDefinition
>;

export const FieldExtractionSpecObject = z.object({
  name: z.string(),
  parseAs: parseOptions,
});

// const FieldExtractionSpec = z.union([FieldExtractionSpecObject, z.string()]);

// Note: Update ExtractionSpec to use ExtractionItem when there is more than one
// const ExtractionItem = z.union([ColonSeparatedKeyValuePairDefinition]);
export const ExtractionSpec = z.object({
  include: z.object({
    includeContentTypes: z.string().array(), // alternate way causes "Type instantiation is excessively deep and possibly infinite"
    includeFileNames: z.string().array(),
  }),
  fileNameExtractionSpec: z.object({
    csv: z.record(z.string(), FieldExtractionSpecObject),
    txt: z.record(z.string(), FieldExtractionSpecObject),
    pdf: z.record(z.string(), FieldExtractionSpecObject),
  }),
  folderTreeExtractionSpec: z.record(FieldExtractionSpecObject),
  fileContentExtractionSpec: z.array(ColonSeparatedKeyValuePairDefinition),
});

export type IExtractionSpec = z.infer<typeof ExtractionSpec>;
