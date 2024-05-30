import { zcsv } from 'zod-csv';

import { z } from 'zod';

/*
"SSCount","Track","Location [km+m]","Latitude","Longitude","Ajonopeus [Km/h]","Rail Profile.Vasen Pystysuora Kuluma [mm]","Rail Profile.Oikea Pystysuora Kuluma [mm]","Rail Profile.Vasen Pystysuora Kuluman Keskiarvo [mm]","Rail Profile.Oikea Pystysuora Kuluman Keskiarvo [mm]","Rail Profile.Vasen Pystysuora Kuluman Keskihajonta [mm]","Rail Profile.Oikea Pystysuora Kuluman Keskihajonta [mm]","Rail Profile.Vasen Sisäpuolinen Sivuttaiskuluma [mm]","Rail Profile.Oikea Sisäpuolinen Sivuttaiskuluma [mm]","Rail Profile.Vasen Sisäpuolisen Sivuttaiskuluman Keskiarvo [mm]","Rail Profile.Oikea Sisäpuolisen Sivuttaiskuluman Keskiarvo [mm]","Rail Profile.Vasen Sisäpuolisen Sivuttaiskuluman Keskihajonta [mm]","Rail Profile.Oikea Sisäpuolisen Sivuttaiskuluman Keskihajonta [mm]","Rail Profile.Vasen Ulkoinen Sivuttaiskuluma [mm]","Rail Profile.Oikea Ulkoinen Sivuttaiskuluma [mm]","Rail Profile.Vasen Ulkoisen Sivuttaiskuluman Keskiarvo [mm]","Rail Profile.Oikea Ulkoisen Sivuttaiskuluman Keskiarvo [mm]","Rail Profile.Vasen Ulkoisen Sivuttaiskuluman Keskihajonta [mm]","Rail Profile.Oikea Ulkoisen Sivuttaiskuluman Keskihajonta [mm]","Rail Profile.Vasen Kallistus [°]","Rail Profile.Oikea Kallistus [°]","Rail Profile.Vasen Kallistuksen Keskiarvo [°]","Rail Profile.Oikea Kallistuksen Keskiarvo [°]","Rail Profile.Vasen Kallistuksen Keskihajonta [°]","Rail Profile.Oikea Kallistuksen Keskihajonta [°]","Rail Profile.Vasen 45° Kuluma [mm]","Rail Profile.Oikea 45° Kuluma [mm]","Rail Profile.Vasen 45° Kuluman Keskiarvo [mm]","Rail Profile.Oikea 45° Kuluman Keskiarvo [mm]","Rail Profile.Vasen 45° Kuluman Keskihajonta [mm]","Rail Profile.Oikea 45° Kuluman Keskihajonta [mm]","Rail Profile.Vasen Yhdistetty Kuluma [mm]","Rail Profile.Oikea Yhdistetty Kuluma [mm]","Rail Profile.Vasen Yhdistetyn Kuluman Keskiarvo [mm]","Rail Profile.Oikea Yhdistetyn Kuluman Keskiarvo [mm]","Rail Profile.Vasen Yhdistetyn Kuluman Keskihajonta [mm]","Rail Profile.Oikea Yhdistetyn Kuluman Keskihajonta [mm]","Rail Profile.Vasen Poikkileikkauspinta-Ala [mm^2]","Rail Profile.Oikea Poikkileikkauspinta-Ala [mm^2]","Rail Profile.Vasen Poikkileikkauspinta-Alan Keskiarvo [mm^2]","Rail Profile.Oikea Poikkileikkauspinta-Alan Keskiarvo [mm^2]","Rail Profile.Vasen Poikkileikkauspinta-Alan Keskihajonta [mm^2]","Rail Profile.Oikea Poikkileikkauspinta-Alan Keskihajonta [mm^2]","Rail Profile.Vasen Sisäpuolinen Purse [mm]","Rail Profile.Oikea Sisäpuolinen Purse [mm]","Rail Profile.Vasen Sisäpuolisen Purseen Keskiarvo [mm]","Rail Profile.Oikea Sisäpuolisen Purseen Keskiarvo [mm]","Rail Profile.Vasen Sisäpuolisen Purseen Keskihajonta [mm]","Rail Profile.Oikea Sisäpuolisen Purseen Keskihajonta [mm]","Rail Profile.Vasen Ulkopuolinen Purse [mm]","Rail Profile.Oikea Ulkopuolinen Purse [mm]","Rail Profile.Vasen Ulkopuolisen Purseen Keskiarvo [mm]","Rail Profile.Oikea Ulkopuolisen Purseen Keskiarvo [mm]","Rail Profile.Vasen Ulkopuolisen Purseen Keskihajonta [mm]","Rail Profile.Oikea Ulkopuolisen Purseen Keskihajonta [mm]","Rail Profile.Tehollinen Kartiokkuus","Rail Profile.Tehollisen Kartiokkuuden Keskiarvo","Rail Profile.Tehollisen Kartiokkuuden Keskihajonta","Rail Profile.Vasen Kiskon Kallistuksen Kiinteä Keskiarvo [°]","Rail Profile.Oikea Kiskon Kallistuksen Kiinteä Keskiarvo [°]","Rail Profile.Vasen Kiskon Kallistuksen Kiinteä Keskihajonta [°]","Rail Profile.Oikea Kiskon Kallistuksen Kiinteä Keskihajonta [°]","Rail Profile.Vasen Pystysuoran Kuluman Kiinteä Keskiarvo [mm]","Rail Profile.Oikea Pystysuoran Kuluman Kiinteä Keskiarvo [mm]","Rail Profile.Vasen Pystysuoran Kuluman Kiinteä Keskihajonta [mm]","Rail Profile.Oikea Pystysuoran Kuluman Kiinteä Keskihajonta [mm]","Rail Profile.Vasen Sisäpuolisen Sivuttaisk Kiinteä Keskiarvo [mm]","Rail Profile.Oikea Sisäpuolisen Sivuttaisk Kiinteä Keskiarvo [mm]","Rail Profile.Vasen Sisäpuolisen Sivuttaisk Kiinteä Keskihajonta [mm]","Rail Profile.Oikea Sisäpuolisen Sivuttaisk Kiinteä Keskihajonta [mm]","Rail Profile.Vasen Ulkopuolisen Sivuttaisk Kiinteä Keskiarvo [mm]","Rail Profile.Oikea Ulkopuolisen Sivuttaisk Kiinteä Keskiarvo [mm]","Rail Profile.Vasen Ulkopuolisen Sivuttaisk Kiinteä Keskihajonta [mm]","Rail Profile.Oikea Ulkopuolisen Sivuttaisk Kiinteä Keskihajonta [mm]","Rail Profile.Vasen 45° Kuluman Kiinteä Keskiarvo [mm]","Rail Profile.Oikea 45° Kuluman Kiinteä Keskiarvo [mm]","Rail Profile.Vasen 45° Kuluman Kiinteä Keskihajonta [mm]","Rail Profile.Oikea 45° Kuluman Kiinteä Keskihajonta [mm]","Rail Profile.Vasen Yhdistetyn Kuluman Kiinteä Keskiarvo [mm]","Rail Profile.Oikea Yhdistetyn Kuluman Kiinteä Keskiarvo [mm]","Rail Profile.Vasen Yhdistetyn Kuluman Kiinteä Keskihajonta [mm]","Rail Profile.Oikea Yhdistetyn Kuluman Kiinteä Keskihajonta [mm]","Rail Profile.Vasen Poikkileikkauspinta-Alan Kiinteä Keskiarvo [mm^2]","Rail Profile.Oikea Poikkileikkauspinta-Alan Kiinteä Keskiarvo [mm^2]","Rail Profile.Vasen Poikkileikkauspint-Alan Kiinteä Keskihajonta [mm^2]","Rail Profile.Oikea Poikkileikkauspint-Alan Kiinteä Keskihajonta [mm^2]","Rail Profile.Vasen Sisäpuolisen Purseen Kiinteä Keskiarvo [mm]","Rail Profile.Oikea Sisäpuolisen Purseen Kiinteä Keskiarvo [mm]","Rail Profile.Vasen Sisäpuolisen Purseen Kiinteä Keskihajonta [mm]","Rail Profile.Oikea Sisäpuolisen Purseen Kiinteä Keskihajonta [mm]","Rail Profile.Vasen Ulkopuolisen Purseen Kiinteä Keskiarvo [mm]","Rail Profile.Oikea Ulkopuolisen Purseen Kiinteä Keskiarvo [mm]","Rail Profile.Vasen Ulkopulisen Purseen Kiinteä Keskihajonta [mm]","Rail Profile.Oikea Ulkopuolisen Purseen Kiinteä Keskihajonta [mm]","Rail Profile.Tehollisen Kartiokkuuden Kiinteä Keskiarvo","Rail Profile.Tehollisen Kartiokkuuden Kiinteä Keskihajonta","Rail Profile.Vasen Poikkipinta-Alan Poikkeama [mm^2]","Rail Profile.Oikea Poikkipinta-Alan Poikkeama [mm^2]","Rail Profile.Ajonopeus [Km/h]"
*/

export const rpSchema = z.object({
  sscount: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  track: zcsv.string(),
  location: zcsv.string(),
  latitude: zcsv.string(z.string().optional()),
  longitude: zcsv.string(z.string().optional()),
  ajonopeus: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_pystysuora_kuluma: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_pystysuora_kuluma: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_pystysuora_kuluman_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_pystysuora_kuluman_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_pystysuora_kuluman_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_pystysuora_kuluman_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_sisapuolinen_sivuttaiskuluma: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_sisapuolinen_sivuttaiskuluma: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_sisapuolisen_sivuttaiskuluman_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_sisapuolisen_sivuttaiskuluman_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_sisapuolisen_sivuttaiskuluman_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_sisapuolisen_sivuttaiskuluman_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_ulkoinen_sivuttaiskuluma: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_ulkoinen_sivuttaiskuluma: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_ulkoisen_sivuttaiskuluman_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_ulkoisen_sivuttaiskuluman_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_ulkoisen_sivuttaiskuluman_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_ulkoisen_sivuttaiskuluman_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_kallistus: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_kallistus: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_kallistuksen_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_kallistuksen_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_kallistuksen_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_kallistuksen_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_45_kuluma: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_45_kuluma: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_45_kuluman_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_45_kuluman_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_45_kuluman_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_45_kuluman_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_yhdistetty_kuluma: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_yhdistetty_kuluma: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_yhdistetyn_kuluman_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_yhdistetyn_kuluman_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_yhdistetyn_kuluman_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_yhdistetyn_kuluman_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_poikkileikkauspinta_ala: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_poikkileikkauspinta_ala: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_poikkileikkauspinta_alan_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_poikkileikkauspinta_alan_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_poikkileikkauspinta_alan_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_poikkileikkauspinta_alan_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_sisapuolinen_purse: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_sisapuolinen_purse: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_sisapuolisen_purseen_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_sisapuolisen_purseen_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_sisapuolisen_purseen_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_sisapuolisen_purseen_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_ulkopuolinen_purse: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_ulkopuolinen_purse: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_ulkopuolisen_purseen_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_ulkopuolisen_purseen_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_ulkopuolisen_purseen_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_ulkopuolisen_purseen_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  tehollinen_kartiokkuus: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  tehollisen_kartiokkuuden_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  tehollisen_kartiokkuuden_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_kiskon_kallistuksen_kiintea_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_kiskon_kallistuksen_kiintea_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_kiskon_kallistuksen_kiintea_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_kiskon_kallistuksen_kiintea_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_pystysuoran_kuluman_kiintea_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_pystysuoran_kuluman_kiintea_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_pystysuoran_kuluman_kiintea_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_pystysuoran_kuluman_kiintea_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_sisapuolisen_sivuttaisk_kiintea_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_sisapuolisen_sivuttaisk_kiintea_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_sisapuolisen_sivuttaisk_kiintea_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_sisapuolisen_sivuttaisk_kiintea_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_ulkopuolisen_sivuttaisk_kiintea_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_ulkopuolisen_sivuttaisk_kiintea_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_ulkopuolisen_sivuttaisk_kiintea_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_ulkopuolisen_sivuttaisk_kiintea_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_45_kuluman_kiintea_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_45_kuluman_kiintea_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_45_kuluman_kiintea_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_45_kuluman_kiintea_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_yhdistetyn_kuluman_kiintea_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_yhdistetyn_kuluman_kiintea_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_yhdistetyn_kuluman_kiintea_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_yhdistetyn_kuluman_kiintea_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_poikkileikkauspinta_alan_kiintea_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_poikkileikkauspinta_alan_kiintea_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_poikkileikkauspint_alan_kiintea_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_poikkileikkauspint_alan_kiintea_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_sisapuolisen_purseen_kiintea_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_sisapuolisen_purseen_kiintea_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_sisapuolisen_purseen_kiintea_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_sisapuolisen_purseen_kiintea_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_ulkopuolisen_purseen_kiintea_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_ulkopuolisen_purseen_kiintea_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_ulkopulisen_purseen_kiintea_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_ulkopuolisen_purseen_kiintea_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  tehollisen_kartiokkuuden_kiintea_keskiarvo: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  tehollisen_kartiokkuuden_kiintea_keskihajonta: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  vasen_poikkipinta_alan_poikkeama: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  oikea_poikkipinta_alan_poikkeama: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
  rp_ajonopeus: zcsv.number(
    z.number().or(z.nan()).optional(),
  ),
});

export type IRp = z.infer<typeof rpSchema>;
