import { integer } from '@opensearch-project/opensearch/api/types';

//todo all db fields
export type Raportti = {
  zip_vastaanotto_vuosi: Date;
  zip_vastaanotto_pvm: Date;
  zip_tiedostonimi: string;
  vuosi: Date;
  pvm: Date;
  tiedostonimi: string | null;
  tiedostotyyppi: string | null;
  tarkastusvaunu: string | null;
  kampanja: string | null;
  rataosuus_numero: string | null;
  raportointiosuus: string | null;
  raide_numero: number | null;
  aloitus_rata_kilometri: number | null;
  lopetus_rata_kilometri: number | null;
  jarjestelma: string | null;
  tarkastusajon_tunniste: string | null;
  raportin_kategoria: string | null;
  tiedoston_koko_kb: string | null;
  status: string | null;
};
