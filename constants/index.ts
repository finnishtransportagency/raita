export const fileSuffixesToIncudeInMetadataParsing = {
  TXT_FILE: 'txt',
  PDF_FILE: 'pdf',
  CSV_FILE: 'csv',
} as const;

export type RaitaSourceSystem =
  typeof raitaSourceSystems[keyof typeof raitaSourceSystems];

export const raitaSourceSystems = {
  Meeri: 'Meeri',
  Emma: 'Emma',
  Elli: 'Elli',
} as const;

export const RAITA_PARSING_EXCEPTION = '[RAITA PARSING EXCEPTION]';
