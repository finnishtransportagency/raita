import { zcsv } from '../../../../../utils/zod-csv/zcsv';
import { z } from 'zod';

/*
"SSCount","Track","Location [km+m]","Latitude","Longitude","Ajonopeus [Km/h]","Rail Corrugation.Oikea Raiteen Aallon RMS [10-30]mm [µm]","Rail Corrugation.Vasen Raiteen Aallon RMS [10-30]mm [µm]","Rail Corrugation.Oikea Raiteen Aallon RMS [30-100]mm [µm]","Rail Corrugation.Vasen Raiteen Aallon RMS [30-100]mm [µm]","Rail Corrugation.Oikea Raiteen Aallon RMS [100-300]mm [µm]","Rail Corrugation.Vasen Raiteen Aallon RMS [100-300]mm [µm]","Rail Corrugation.Oikea Raiteen Aallon RMS [300-1000]mm [µm]","Rail Corrugation.Vasen Raiteen Aallon RMS [300-1000]mm [µm]","Rail Corrugation.Oikea Raiteen Aallon RMS [10-30]mm Keskiarvo [µm]","Rail Corrugation.Vasen Raiteen Aallon RMS [10-30]mm Keskiarvo [µm]","Rail Corrugation.Oikea Raiteen Aallon RMS [30-100]mm Keskiarvo [µm]","Rail Corrugation.Vasen Raiteen Aallon RMS [30-100]mm Keskiarvo [µm]","Rail Corrugation.Oikea Raiteen Aallon RMS [100-300]mm Keskiarvo [µm]","Rail Corrugation.Vasen Raiteen Aallon RMS [100-300]mm Keskiarvo [µm]","Rail Corrugation.Oikea Raiteen Aallon RMS [300-1000]mm Keskiarvo [µm]","Rail Corrugation.Vasen Raiteen Aallon RMS [300-1000]mm Keskiarvo [µm]","Rail Corrugation.Oikea Raiteen Aallon RMS [10-30]mm Keskihajonta [µm]","Rail Corrugation.Vasen Raiteen Aallon RMS [10-30]mm Keskihajonta [µm]","Rail Corrugation.Oikea Raiteen Aallon RMS [30-100]mm Keskihajonta [µm]","Rail Corrugation.Vasen Raiteen Aallon RMS [30-100]mm Keskihajonta [µm]","Rail Corrugation.Oikea Raiteen Aallon RMS [10-300]mm Keskihajonta [µm]","Rail Corrugation.Vasen Raiteen Aallon RMS [100-300]mm Keskihajonta [µm]","Rail Corrugation.Oikea Raiteen Aallon RMS [300-1000]mm Keskihajonta [µm]","Rail Corrugation.Vasen Raiteen Aallon RMS [300-1000] Keskihajonta [µm]","Rail Corrugation.Vasen Raiteen AallonRMS[10-30]mm Kiinteä Keskiarvo [µm]","Rail Corrugation.Oikea Raiteen AallonRMS[10-30]mm Kiinteä Keskiarvo [µm]","Rail Corrugation.Vasen Raiteen AallonRMS[10-30]mm Kiinteä Keskihaj [µm]","Rail Corrugation.Oikea Raiteen AallonRMS[10-30]mm Kiinteä Keskihaj [µm]","Rail Corrugation.Vasen Raiteen AallonRMS[30-100]mm Kiinteä Keskiarv [µm]","Rail Corrugation.Oikea Raiteen AallonRMS[30-100]mm Kiinteä Keskiarv [µm]","Rail Corrugation.Vasen Raiteen AallonRMS[30-100]mm Kiinteä Keskihaj [µm]","Rail Corrugation.Oikea Raiteen AallonRMS[30-100]mm Kiinteä Keskihaj [µm]","Rail Corrugation.Vasen Raiteen AallonRMS[100-300]mm Kiinteä Keskiar [µm]","Rail Corrugation.Oikea Raiteen AallonRMS[100-300]mm Kiinteä Keskiar [µm]","Rail Corrugation.Vasen Raiteen AallonRMS[100-300]mm Kiinteä Keskiha [µm]","Rail Corrugation.Oikea Raiteen AallonRMS[100-300]mm Kiinteä Keskiha [µm]","Rail Corrugation.Vasen Raiteen AallonRMS[300-1000]mm Kiinteä Keskia [µm]","Rail Corrugation.Oikea Raiteen AallonRMS[300-1000]mm Kiinteä Keskia [µm]","Rail Corrugation.Vasen Raiteen AallonRMS[300-1000]mm Kiinteä Keskih [µm]","Rail Corrugation.Oikea Raiteen AallonRMS[300-1000]mm Kiinteä Keskih [µm]"
*/

export const rcSchema = z.object({
  sscount: zcsv.number(),
  track: zcsv.string(),
  location: zcsv.string(),
  latitude: zcsv.string(),
  longitude: zcsv.string(),
  ajonopeus: zcsv.number(),
  oikea_raiteen_aallon_rms_10_30mm: zcsv.number(z.number().optional()),
  vasen_raiteen_aallon_rms_10_30mm: zcsv.number(z.number().optional()),
  oikea_raiteen_aallon_rms_30_100mm: zcsv.number(z.number().optional()),
  vasen_raiteen_aallon_rms_30_100mm: zcsv.number(z.number().optional()),
  oikea_raiteen_aallon_rms_100_300mm: zcsv.number(z.number().optional()),
  vasen_raiteen_aallon_rms_100_300mm: zcsv.number(z.number().optional()),
  oikea_raiteen_aallon_rms_300_1000mm: zcsv.number(z.number().optional()),
  vasen_raiteen_aallon_rms_300_1000mm: zcsv.number(z.number().optional()),
  oikea_raiteen_aallon_rms_10_30mm_keskiarvo: zcsv.number(z.number().optional()),
  vasen_raiteen_aallon_rms_10_30mm_keskiarvo: zcsv.number(z.number().optional()),
  oikea_raiteen_aallon_rms_30_100mm_keskiarvo: zcsv.number(z.number().optional()),
  vasen_raiteen_aallon_rms_30_100mm_keskiarvo: zcsv.number(z.number().optional()),
  oikea_raiteen_aallon_rms_100_300mm_keskiarvo: zcsv.number(z.number().optional()),
  vasen_raiteen_aallon_rms_100_300mm_keskiarvo: zcsv.number(z.number().optional()),
  oikea_raiteen_aallon_rms_300_1000mm_keskiarvo: zcsv.number(z.number().optional()),
  vasen_raiteen_aallon_rms_300_1000mm_keskiarvo: zcsv.number(z.number().optional()),
  oikea_raiteen_aallon_rms_10_30mm_keskihajonta: zcsv.number(z.number().optional()),
  vasen_raiteen_aallon_rms_10_30mm_keskihajonta: zcsv.number(z.number().optional()),
  oikea_raiteen_aallon_rms_30_100mm_keskihajonta: zcsv.number(z.number().optional()),
  vasen_raiteen_aallon_rms_30_100mm_keskihajonta: zcsv.number(z.number().optional()),
  oikea_raiteen_aallon_rms_10_300mm_keskihajonta: zcsv.number(z.number().optional()),
  vasen_raiteen_aallon_rms_100_300mm_keskihajonta: zcsv.number(z.number().optional()),
  oikea_raiteen_aallon_rms_300_1000mm_keskihajonta: zcsv.number(z.number().optional()),
  vasen_raiteen_aallon_rms_300_1000_keskihajonta: zcsv.number(z.number().optional()),
  vasen_raiteen_aallonrms10_30mm_kiintea_keskiarvo: zcsv.number(z.number().optional()),
  oikea_raiteen_aallonrms10_30mm_kiintea_keskiarvo: zcsv.number(z.number().optional()),
  vasen_raiteen_aallonrms10_30mm_kiintea_keskihaj: zcsv.number(z.number().optional()),
  oikea_raiteen_aallonrms10_30mm_kiintea_keskihaj: zcsv.number(z.number().optional()),
  vasen_raiteen_aallonrms30_100mm_kiintea_keskiarv: zcsv.number(z.number().optional()),
  oikea_raiteen_aallonrms30_100mm_kiintea_keskiarv: zcsv.number(z.number().optional()),
  vasen_raiteen_aallonrms30_100mm_kiintea_keskihaj: zcsv.number(z.number().optional()),
  oikea_raiteen_aallonrms30_100mm_kiintea_keskihaj: zcsv.number(z.number().optional()),
  vasen_raiteen_aallonrms100_300mm_kiintea_keskiar: zcsv.number(z.number().optional()),
  oikea_raiteen_aallonrms100_300mm_kiintea_keskiar: zcsv.number(z.number().optional()),
  vasen_raiteen_aallonrms100_300mm_kiintea_keskiha: zcsv.number(z.number().optional()),
  oikea_raiteen_aallonrms100_300mm_kiintea_keskiha: zcsv.number(z.number().optional()),
  vasen_raiteen_aallonrms300_1000mm_kiintea_keskia: zcsv.number(z.number().optional()),
  oikea_raiteen_aallonrms300_1000mm_kiintea_keskia: zcsv.number(z.number().optional()),
  vasen_raiteen_aallonrms300_1000mm_kiintea_keskih: zcsv.number(z.number().optional()),
  oikea_raiteen_aallonrms300_1000mm_kiintea_keskih: zcsv.number(z.number().optional()),
});

export type IRc = z.infer<typeof rcSchema>;
