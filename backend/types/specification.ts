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
  parserVersion: z.string(),
  fileNameExtractionSpec: z.object({
    csv: z.array(z.record(z.string(), FieldExtractionSpecObject)),
    txt: z.array(z.record(z.string(), FieldExtractionSpecObject)),
    pdf: z.array(z.record(z.string(), FieldExtractionSpecObject)),
    xlsx: z.array(z.record(z.string(), FieldExtractionSpecObject)),
    xls: z.array(z.record(z.string(), FieldExtractionSpecObject)),
  }),
  // TODO change these too?
  folderTreeExtractionSpec: z.record(FieldExtractionSpecObject),
  vRunFolderTreeExtractionSpec: z.record(FieldExtractionSpecObject),
  fileContentExtractionSpec: z.array(ColonSeparatedKeyValuePairDefinition),
  knownExceptions: z.object({
    fileNameExtractionSpec: z.object({
      containsUnderscore: z.array(
        z.object({
          name: z.string(),
          value: z.string(),
        }),
      ),
      removePrefix: z.array(z.string()),
    }),
    substituteValues: z.array(
      z.object({
        // if metadata field key is found with value oldValue (exact match), substitute with newValue
        key: z.string(),
        oldValue: z.string(),
        newValue: z.string(), // Value as string. Type parsing is done after substitution
      }),
    ),
  }),
});

export type IExtractionSpec = z.infer<typeof ExtractionSpec>;
export type IExtractionSpecLabels =
  IExtractionSpec['fileNameExtractionSpec'][keyof IExtractionSpec['fileNameExtractionSpec']][number];
