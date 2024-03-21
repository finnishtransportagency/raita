import { Comma, Quote } from 'csv-string/dist/types';

export type Rataosoite = {
  rataosuus_numero: string;
  rataosuus_nimi: string;
  raide_numero: string;
  rata_kilometri: number | null;
  rata_metrit: number;
};
