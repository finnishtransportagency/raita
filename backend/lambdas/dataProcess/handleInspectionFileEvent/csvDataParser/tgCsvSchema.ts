import { zcsv } from '../../../../utils/zod-csv/zcsv';
import { z } from 'zod';

/*
"SSCount","Track","Location [km+m]","Latitude","Longitude","Ajonopeus [Km/h]","TG Master.Raideleveyden Poikkeama [mm]","TG Master.Kallistus [mm]","TG Master.Kallistuksen Poikkeama [mm]","TG Master.Kierous [mm]","TG Master.Kaarevuus [10000/m]","TG Master.Raideleveyden Poikkeaman Muutos [mm/m]","TG Master.Kierouden Poikkeama [mm]","TG Master.Vasen Korkeuspoikkeama D1 [mm]","TG Master.Vasen Korkeuspoikkeama D2 [mm]","TG Master.Oikea Korkeuspoikkeama D2 [mm]","TG Master.Vasen Korkeuspoikkeama D3 [mm]","TG Master.Oikea Korkeuspoikkeama D3 [mm]","TG Master.Vasen Nuolikorkeuspoikkeama D1 [mm]","TG Master.Oikea Nuolikorkeuspoikkeama D1 [mm]","TG Master.Vasen Nuolikorkeuspoikkeama D2 [mm]","TG Master.Oikea Nuolikorkeuspoikkeama D2 [mm]","TG Master.Vasen Nuolikorkeuspoikkeama D3 [mm]","TG Master.Oikea Nuolikorkeuspoikkeama D3 [mm]","TG Master.Gradient [‰]","TG Master.Raideleveyden [mm]","TG Master.Oikea Korkeuspoikkeama D1 [mm]","TG Master.Raideleveyden Keskihajonta [mm]","TG Master.Kallistus Keskihajonta [mm]","TG Master.Kierouden Keskihajonta [mm]","TG Master.Vasen Korkeuspoikkeama D1 Keskihajonta [mm]","TG Master.Oikea Korkeuspoikkeama D1 Keskihajonta [mm]","TG Master.Vasen Nuolikorkeus D1 Keskihajonta [mm]","TG Master.Oikea Nuolikorkeus D1 Keskihajonta [mm]","TG Master.Vasen Korkeuspoikkema D0 [mm]","TG Master.Oikea Korkeuspoikkema D0 [mm]","TG Master.Vasen Korkeuspoikkema D0 Keskihajonta [mm]","TG Master.Oikea Korkeuspoikkema D0 Keskihajonta [mm]"
*/

export const tgSchema = z.object({
  sscount: zcsv.number(),
  track: zcsv.string(),
  location: zcsv.string(),
  latitude: zcsv.string(),
  longitude: zcsv.string(),
  ajonopeus: zcsv.number(),
  raideleveyden_poikkeama: zcsv.number(),
  kallistus: zcsv.number(),
  kallistuksen_poikkeama: zcsv.number(),
  kierous: zcsv.number(),
  kaarevuus: zcsv.number(),
  raideleveyden_poikkeaman_muutos: zcsv.number(),
  kierouden_poikkeama: zcsv.number(),
  vasen_korkeuspoikkeama_d1: zcsv.number(),
  vasen_korkeuspoikkeama_d2: zcsv.number(),
  oikea_korkeuspoikkeama_d2: zcsv.number(),
  vasen_korkeuspoikkeama_d3: zcsv.number(),
  oikea_korkeuspoikkeama_d3: zcsv.number(),
  vasen_nuolikorkeuspoikkeama_d1: zcsv.number(),
  oikea_nuolikorkeuspoikkeama_d1: zcsv.number(),
  vasen_nuolikorkeuspoikkeama_d2: zcsv.number(),
  oikea_nuolikorkeuspoikkeama_d2: zcsv.number(),
  vasen_nuolikorkeuspoikkeama_d3: zcsv.number(),
  oikea_nuolikorkeuspoikkeama_d3: zcsv.number(),
  gradient: zcsv.number(),
  raideleveyden: zcsv.number(),
  oikea_korkeuspoikkeama_d1: zcsv.number(),
  raideleveyden_keskihajonta: zcsv.number(),
  kallistus_keskihajonta: zcsv.number(),
  kierouden_keskihajonta: zcsv.number(),
  vasen_korkeuspoikkeama_d1_keskihajonta: zcsv.number(),
  oikea_korkeuspoikkeama_d1_keskihajonta: zcsv.number(),
  vasen_nuolikorkeus_d1_keskihajonta: zcsv.number(),
  oikea_nuolikorkeus_d1_keskihajonta: zcsv.number(),
  vasen_korkeuspoikkema_d0: zcsv.number(),
  oikea_korkeuspoikkema_d0: zcsv.number(),
  vasen_korkeuspoikkema_d0_keskihajonta: zcsv.number(),
  oikea_korkeuspoikkema_d0_keskihajonta: zcsv.number(),
});

export type ITg = z.infer<typeof tgSchema>;
