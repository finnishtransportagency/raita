import { zcsv } from 'zod-csv';

import { z } from 'zod';

/*
"SSCount","Track","Location [km+m]","Latitude","Longitude","Ajonopeus [Km/h]","Over Head Line Geometry and Wear.Siksak 1 [mm]","Over Head Line Geometry and Wear.Siksak 2 [mm]","Over Head Line Geometry and Wear.Korkeus 1 [mm]","Over Head Line Geometry and Wear.Korkeus 2 [mm]","Over Head Line Geometry and Wear.Jäännöspaksuus 1 [mm]","Over Head Line Geometry and Wear.Jäännöspaksuus 2 [mm]","Over Head Line Geometry and Wear.Risteävien Ajolankojen Etäisyys [mm]","Over Head Line Geometry and Wear.Height Gradient [mm/m]","Over Head Line Geometry and Wear.Pinnan Leveys 1 [mm]","Over Head Line Geometry and Wear.Pinnan Leveys 2 [mm]","Over Head Line Geometry and Wear.Pinnan Leveyden Keskiarvo 1 [mm]","Over Head Line Geometry and Wear.Pinnan Leveyden Keskiarvo 2 [mm]","Over Head Line Geometry and Wear.Pinnan Leveyden Keskihajonta 1 [mm]","Over Head Line Geometry and Wear.Pinnan Leveyden Keskihajonta 2 [mm]","Over Head Line Geometry and Wear.Jäännöspinta-ala 1 [mm^2]","Over Head Line Geometry and Wear.Jäännöspinta-ala 2 [mm^2]","Over Head Line Geometry and Wear.Jäännöspinta-alan Keskiarvo 1 [mm^2]","Over Head Line Geometry and Wear.Jäännöspinta-alan Keskiarvo 2 [mm^2]","Over Head Line Geometry and Wear.Residual Area StdDev 1 [mm^2]","Over Head Line Geometry and Wear.Residual Area StdDev 2 [mm^2]","Over Head Line Geometry and Wear.Pole","Over Head Line Geometry and Wear.Korkeuden Poikkeama [mm]","Over Head Line Geometry and Wear.Siksakkin Poikkeama [mm]","Over Head Line Geometry and Wear.Pituuskaltevuus [mm/m]","Over Head Line Geometry and Wear.Ajonopeus [Km/h]","Over Head Line Geometry and Wear.Right Wire Wear 2 [mm]","Over Head Line Geometry and Wear.Stagger Box_PI [mm]","Over Head Line Geometry and Wear.Height Box_PI [mm]"
*/

export const piSchema = z.object({
  sscount: zcsv.number(z.number().optional()),
  track: zcsv.string(),
  location: zcsv.string(),
  latitude: zcsv.string(z.string().optional()),
  longitude: zcsv.string(z.string().optional()),
  ajonopeus: zcsv.number(z.number().optional()),
  accz_1_1: zcsv.number(z.number().optional()),
  accz_1_2: zcsv.number(z.number().optional()),
  accz_2_1: zcsv.number(z.number().optional()),
  accz_2_2: zcsv.number(z.number().optional()),
  f_1_1: zcsv.number(z.number().optional()),
  f_1_2: zcsv.number(z.number().optional()),
  f_2_1: zcsv.number(z.number().optional()),
  f_2_2: zcsv.number(z.number().optional()),
  fint: zcsv.number(z.number().optional()),
  fcomp: zcsv.number(z.number().optional()),
  fext: zcsv.number(z.number().optional()),
  stagger: zcsv.number(z.number().optional()),
  height_ws: zcsv.number(z.number().optional()),
});

export type IPi = z.infer<typeof piSchema>;
