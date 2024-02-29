import { zcsv } from '../../../../../utils/zod-csv/zcsv';
import { z } from 'zod';

/*
"SSCount","Track","Location [km+m]","Latitude","Longitude","Ajonopeus [Km/h]","Over Head Line Geometry and Wear.Siksak 1 [mm]","Over Head Line Geometry and Wear.Siksak 2 [mm]","Over Head Line Geometry and Wear.Korkeus 1 [mm]","Over Head Line Geometry and Wear.Korkeus 2 [mm]","Over Head Line Geometry and Wear.Jäännöspaksuus 1 [mm]","Over Head Line Geometry and Wear.Jäännöspaksuus 2 [mm]","Over Head Line Geometry and Wear.Risteävien Ajolankojen Etäisyys [mm]","Over Head Line Geometry and Wear.Height Gradient [mm/m]","Over Head Line Geometry and Wear.Pinnan Leveys 1 [mm]","Over Head Line Geometry and Wear.Pinnan Leveys 2 [mm]","Over Head Line Geometry and Wear.Pinnan Leveyden Keskiarvo 1 [mm]","Over Head Line Geometry and Wear.Pinnan Leveyden Keskiarvo 2 [mm]","Over Head Line Geometry and Wear.Pinnan Leveyden Keskihajonta 1 [mm]","Over Head Line Geometry and Wear.Pinnan Leveyden Keskihajonta 2 [mm]","Over Head Line Geometry and Wear.Jäännöspinta-ala 1 [mm^2]","Over Head Line Geometry and Wear.Jäännöspinta-ala 2 [mm^2]","Over Head Line Geometry and Wear.Jäännöspinta-alan Keskiarvo 1 [mm^2]","Over Head Line Geometry and Wear.Jäännöspinta-alan Keskiarvo 2 [mm^2]","Over Head Line Geometry and Wear.Residual Area StdDev 1 [mm^2]","Over Head Line Geometry and Wear.Residual Area StdDev 2 [mm^2]","Over Head Line Geometry and Wear.Pole","Over Head Line Geometry and Wear.Korkeuden Poikkeama [mm]","Over Head Line Geometry and Wear.Siksakkin Poikkeama [mm]","Over Head Line Geometry and Wear.Pituuskaltevuus [mm/m]","Over Head Line Geometry and Wear.Ajonopeus [Km/h]","Over Head Line Geometry and Wear.Right Wire Wear 2 [mm]","Over Head Line Geometry and Wear.Stagger Box_OHL [mm]","Over Head Line Geometry and Wear.Height Box_OHL [mm]"
*/

export const ohlSchema = z.object({
  sscount: zcsv.number(z.number().optional()),
  track: zcsv.string(),
  location: zcsv.string(),
  latitude: zcsv.string(),
  longitude: zcsv.string(),
  ajonopeus: zcsv.number(),
  siksak_1: zcsv.number(z.number().optional()),
  siksak_2: zcsv.number(z.number().optional()),
  korkeus_1: zcsv.number(z.number().optional()),
  korkeus_2: zcsv.number(z.number().optional()),
  jaannospaksuus_1: zcsv.number(z.number().optional()),
  jaannospaksuus_2: zcsv.number(z.number().optional()),
  risteavien_ajolankojen_etaisyys: zcsv.number(z.number().optional()),
  height_gradient: zcsv.number(z.number().optional()),
  pinnan_leveys_1: zcsv.number(z.number().optional()),
  pinnan_leveys_2: zcsv.number(z.number().optional()),
  pinnan_leveyden_keskiarvo_1: zcsv.number(z.number().optional()),
  pinnan_leveyden_keskiarvo_2: zcsv.number(z.number().optional()),
  pinnan_leveyden_keskihajonta_1: zcsv.number(z.number().optional()),
  pinnan_leveyden_keskihajonta_2: zcsv.number(z.number().optional()),
  jaannospinta_ala_1: zcsv.number(z.number().optional()),
  jaannospinta_ala_2: zcsv.number(z.number().optional()),
  jaannospinta_alan_keskiarvo_1: zcsv.number(z.number().optional()),
  jaannospinta_alan_keskiarvo_2: zcsv.number(z.number().optional()),
  residual_area_stddev_1: zcsv.number(z.number().optional()),
  residual_area_stddev_2: zcsv.number(z.number().optional()),
  pole: zcsv.number(z.number().optional()),
  korkeuden_poikkeama: zcsv.number(z.number().optional()),
  siksakkin_poikkeama: zcsv.number(z.number().optional()),
  pituuskaltevuus: zcsv.number(z.number().optional()),
  ohl_ajonopeus: zcsv.number(z.number().optional()),
  right_wire_wear_2: zcsv.number(z.number().optional()),
  stagger_box_ohl: zcsv.number(z.number().optional()),
  height_box_ohl: zcsv.number(z.number().optional()),
});

export type IOhl = z.infer<typeof ohlSchema>;
