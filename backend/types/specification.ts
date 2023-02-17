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

// Note: Update ExtractionSpec to use ExtractionItem when there is more than one
export const ExtractionSpec = z.object({
  fileNameExtractionSpec: z.object({
    csv: z.record(z.string(), FieldExtractionSpecObject),
    txt: z.record(z.string(), FieldExtractionSpecObject),
    pdf: z.record(z.string(), FieldExtractionSpecObject),
    xlsx: z.record(z.string(), FieldExtractionSpecObject),
    xls: z.record(z.string(), FieldExtractionSpecObject),
  }),
  folderTreeExtractionSpec: z.record(FieldExtractionSpecObject),
  vRunFolderTreeExtractionSpec: z.record(FieldExtractionSpecObject),
  fileContentExtractionSpec: z.array(ColonSeparatedKeyValuePairDefinition),
});

export type IExtractionSpec = z.infer<typeof ExtractionSpec>;
export type IExtractionSpecLabels =
  IExtractionSpec['fileNameExtractionSpec'][keyof IExtractionSpec['fileNameExtractionSpec']];
