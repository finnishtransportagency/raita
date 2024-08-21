import { zcsv } from 'zod-csv';

import { z } from 'zod';

/*
"SSCount","Track","Location [km+m]","Latitude","Longitude","Ajonopeus [Km/h]","TG Master.Raideleveyden Poikkeama [mm]","TG Master.Kallistus [mm]","TG Master.Kallistuksen Poikkeama [mm]","TG Master.Kierous [mm]","TG Master.Kaarevuus [10000/m]","TG Master.Raideleveyden Poikkeaman Muutos [mm/m]","TG Master.Kierouden Poikkeama [mm]","TG Master.Vasen Korkeuspoikkeama D1 [mm]","TG Master.Vasen Korkeuspoikkeama D2 [mm]","TG Master.Oikea Korkeuspoikkeama D2 [mm]","TG Master.Vasen Korkeuspoikkeama D3 [mm]","TG Master.Oikea Korkeuspoikkeama D3 [mm]","TG Master.Vasen Nuolikorkeuspoikkeama D1 [mm]","TG Master.Oikea Nuolikorkeuspoikkeama D1 [mm]","TG Master.Vasen Nuolikorkeuspoikkeama D2 [mm]","TG Master.Oikea Nuolikorkeuspoikkeama D2 [mm]","TG Master.Vasen Nuolikorkeuspoikkeama D3 [mm]","TG Master.Oikea Nuolikorkeuspoikkeama D3 [mm]","TG Master.Gradient [‰]","TG Master.Raideleveyden [mm]","TG Master.Oikea Korkeuspoikkeama D1 [mm]","TG Master.Raideleveyden Keskihajonta [mm]","TG Master.Kallistus Keskihajonta [mm]","TG Master.Kierouden Keskihajonta [mm]","TG Master.Vasen Korkeuspoikkeama D1 Keskihajonta [mm]","TG Master.Oikea Korkeuspoikkeama D1 Keskihajonta [mm]","TG Master.Vasen Nuolikorkeus D1 Keskihajonta [mm]","TG Master.Oikea Nuolikorkeus D1 Keskihajonta [mm]","TG Master.Vasen Korkeuspoikkema D0 [mm]","TG Master.Oikea Korkeuspoikkema D0 [mm]","TG Master.Vasen Korkeuspoikkema D0 Keskihajonta [mm]","TG Master.Oikea Korkeuspoikkema D0 Keskihajonta [mm]"
*/

export const tgSchema = z.object({
  sscount: zcsv.number(
    z.number().optional(),
  ),
  track: zcsv.string(),
  location: zcsv.string(),
  latitude: zcsv.string(z.string().optional()),
  longitude: zcsv.string(z.string().optional()),
  ajonopeus: zcsv.string(
    z.string().optional(),
  ),
  raideleveyden_poikkeama: zcsv.string(
    z.string().optional(),
  ),
  kallistus: zcsv.string(
    z.string().optional(),
  ),
  kallistuksen_poikkeama: zcsv.string(
    z.string().optional(),
  ),
  kierous: zcsv.string(
    z.string().optional(),
  ),
  kaarevuus: zcsv.string(
    z.string().optional(),
  ),
  raideleveyden_poikkeaman_muutos: zcsv.string(
    z.string().optional(),
  ),
  kierouden_poikkeama: zcsv.string(
    z.string().optional(),
  ),
  vasen_korkeuspoikkeama_d1: zcsv.string(
    z.string().optional(),
  ),
  vasen_korkeuspoikkeama_d2: zcsv.string(
    z.string().optional(),
  ),
  oikea_korkeuspoikkeama_d2: zcsv.string(
    z.string().optional(),
  ),
  vasen_korkeuspoikkeama_d3: zcsv.string(
    z.string().optional(),
  ),
  oikea_korkeuspoikkeama_d3: zcsv.string(
    z.string().optional(),
  ),
  vasen_nuolikorkeuspoikkeama_d1: zcsv.string(
    z.string().optional(),
  ),
  oikea_nuolikorkeuspoikkeama_d1: zcsv.string(
    z.string().optional(),
  ),
  vasen_nuolikorkeuspoikkeama_d2: zcsv.string(
    z.string().optional(),
  ),
  oikea_nuolikorkeuspoikkeama_d2: zcsv.string(
    z.string().optional(),
  ),
  vasen_nuolikorkeuspoikkeama_d3: zcsv.string(
    z.string().optional(),
  ),
  oikea_nuolikorkeuspoikkeama_d3: zcsv.string(
    z.string().optional(),
  ),
  gradient: zcsv.string(
    z.string().optional(),
  ),
  raideleveyden: zcsv.string(
    z.string().optional(),
  ),
  oikea_korkeuspoikkeama_d1: zcsv.string(
    z.string().optional(),
  ),
  raideleveyden_keskihajonta: zcsv.string(
    z.string().optional(),
  ),
  kallistus_keskihajonta: zcsv.string(
    z.string().optional(),
  ),
  kierouden_keskihajonta: zcsv.string(
    z.string().optional(),
  ),
  vasen_korkeuspoikkeama_d1_keskihajonta: zcsv.string(
    z.string().optional(),
  ),
  oikea_korkeuspoikkeama_d1_keskihajonta: zcsv.string(
    z.string().optional(),
  ),
  vasen_nuolikorkeus_d1_keskihajonta: zcsv.string(
    z.string().optional(),
  ),
  oikea_nuolikorkeus_d1_keskihajonta: zcsv.string(
    z.string().optional(),
  ),
  vasen_korkeuspoikkema_d0: zcsv.string(
    z.string().optional(),
  ),
  oikea_korkeuspoikkema_d0: zcsv.string(
    z.string().optional(),
  ),
  vasen_korkeuspoikkema_d0_keskihajonta: zcsv.string(
    z.string().optional(),
  ),
  oikea_korkeuspoikkema_d0_keskihajonta: zcsv.string(
    z.string().optional(),
  ),
});

export type ITg = z.infer<typeof tgSchema>;
