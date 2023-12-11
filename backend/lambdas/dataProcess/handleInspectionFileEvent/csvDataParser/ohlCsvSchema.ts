import { zcsv } from '../../../../utils/zod-csv/zcsv';
import { z } from 'zod';

/*
"SSCount","Track","Location [km+m]","Latitude","Longitude","Ajonopeus [Km/h]","Over Head Line Geometry and Wear.Siksak 1 [mm]","Over Head Line Geometry and Wear.Siksak 2 [mm]","Over Head Line Geometry and Wear.Korkeus 1 [mm]","Over Head Line Geometry and Wear.Korkeus 2 [mm]","Over Head Line Geometry and Wear.Jäännöspaksuus 1 [mm]","Over Head Line Geometry and Wear.Jäännöspaksuus 2 [mm]","Over Head Line Geometry and Wear.Risteävien Ajolankojen Etäisyys [mm]","Over Head Line Geometry and Wear.Height Gradient [mm/m]","Over Head Line Geometry and Wear.Pinnan Leveys 1 [mm]","Over Head Line Geometry and Wear.Pinnan Leveys 2 [mm]","Over Head Line Geometry and Wear.Pinnan Leveyden Keskiarvo 1 [mm]","Over Head Line Geometry and Wear.Pinnan Leveyden Keskiarvo 2 [mm]","Over Head Line Geometry and Wear.Pinnan Leveyden Keskihajonta 1 [mm]","Over Head Line Geometry and Wear.Pinnan Leveyden Keskihajonta 2 [mm]","Over Head Line Geometry and Wear.Jäännöspinta-ala 1 [mm^2]","Over Head Line Geometry and Wear.Jäännöspinta-ala 2 [mm^2]","Over Head Line Geometry and Wear.Jäännöspinta-alan Keskiarvo 1 [mm^2]","Over Head Line Geometry and Wear.Jäännöspinta-alan Keskiarvo 2 [mm^2]","Over Head Line Geometry and Wear.Residual Area StdDev 1 [mm^2]","Over Head Line Geometry and Wear.Residual Area StdDev 2 [mm^2]","Over Head Line Geometry and Wear.Pole","Over Head Line Geometry and Wear.Korkeuden Poikkeama [mm]","Over Head Line Geometry and Wear.Siksakkin Poikkeama [mm]","Over Head Line Geometry and Wear.Pituuskaltevuus [mm/m]","Over Head Line Geometry and Wear.Ajonopeus [Km/h]","Over Head Line Geometry and Wear.Right Wire Wear 2 [mm]","Over Head Line Geometry and Wear.Stagger Box_OHL [mm]","Over Head Line Geometry and Wear.Height Box_OHL [mm]"
*/

export const ohlSchema = z.object({
  sscount: zcsv.number(),
  track: zcsv.string(),
  location: zcsv.string(),
  latitude: zcsv.string(),
  longitude: zcsv.string(),
  ajonopeus: zcsv.number(),
  siksak_1: zcsv.number(),
  siksak_2: zcsv.number(),
  korkeus_1: zcsv.number(),
  korkeus_2: zcsv.number(),
  jaannospaksuus_1: zcsv.number(),
  jaannospaksuus_2: zcsv.number(),
  risteavien_ajolankojen_etaisyys: zcsv.number(),
  height_gradient: zcsv.number(),
  pinnan_leveys_1: zcsv.number(),
  pinnan_leveys_2: zcsv.number(),
  pinnan_leveyden_keskiarvo_1: zcsv.number(),
  pinnan_leveyden_keskiarvo_2: zcsv.number(),
  pinnan_leveyden_keskihajonta_1: zcsv.number(),
  pinnan_leveyden_keskihajonta_2: zcsv.number(),
  jaannospinta_ala_1: zcsv.number(),
  jaannospinta_ala_2: zcsv.number(),
  jaannospinta_alan_keskiarvo_1: zcsv.number(),
  jaannospinta_alan_keskiarvo_2: zcsv.number(),
  residual_area_stddev_1: zcsv.number(),
  residual_area_stddev_2: zcsv.number(),
  pole: zcsv.number(),
  korkeuden_poikkeama: zcsv.number(),
  siksakkin_poikkeama: zcsv.number(),
  pituuskaltevuus: zcsv.number(),
  ohl_ajonopeus: zcsv.number(),
  right_wire_wear_2: zcsv.number(),
  stagger_box_ohl: zcsv.number(),
  height_box_ohl: zcsv.number(),
});

export type IOhl = z.infer<typeof ohlSchema>;
