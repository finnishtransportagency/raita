import { z } from "zod";

export const ColonSeparatedKeyValuePairDefinition = z.object({
  propertyKey: z.string(),
  pattern: z.object({
    predefinedPatternId: z.literal("colonSeparatedKeyValuePair"),
    searchKey: z.string(),
  }),
});

export type IColonSeparatedKeyValuePairDefinition = z.infer<
  typeof ColonSeparatedKeyValuePairDefinition
>;

// Note: Update ExtractionSpec to use ExtractionItem when there is more than one
// const ExtractionItem = z.union([ColonSeparatedKeyValuePairDefinition]);
export const ExtractionSpec = z.object({
  include: z.object({
    includeContentTypes: z.string().array(), // alternate way causes "Type instantiation is excessively deep and possibly infinite"
    includeFileNames: z.string().array(),
  }),
  fileNameExtractionSpec: z.object({
    csv: z.record(z.string()),
    txt: z.record(z.string()),
  }),
  folderTreeExtractionSpec: z.record(z.string()),
  fileContentExtractionSpec: z.array(ColonSeparatedKeyValuePairDefinition),
});

export type IExtractionSpec = z.infer<typeof ExtractionSpec>;
