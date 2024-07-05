import { zcsv } from 'zod-csv';

import { z } from 'zod';

/*
"SSCount","Track","Location [km+m]","Latitude","Longitude","Ajonopeus [Km/h]","T-Sight 600.Ballast slope_L [°]","T-Sight 600.Ballast width_L [mm]","T-Sight 600.Ballast height_L [mm]","T-Sight 600.Ballast slope_R [°]","T-Sight 600.Ballast width_R [mm]","T-Sight 600.Ballast height_R [mm]","T-Sight 600.Platform_Center_H_L [mm]","T-Sight 600.Platform_Run_V_L [mm]","T-Sight 600.Platform_Center_H_R [mm]","T-Sight 600.Platform_Run_V_R [mm]","T-Sight 600.FIN1 Kin Min Distance [mm]","T-Sight 600.FIN1 Kin LeftRail Min Dist [mm]","T-Sight 600.FIN1 Kin RightRail Min Dist [mm]","T-Sight 600.SG MT Kin Min Distance [mm]","T-Sight 600.SG MT Kin LeftRail Min Distance [mm]","T-Sight 600.SG MT Kin RightRail Min Distance [mm]","T-Sight 600.SG ST Kin Min Distance [mm]","T-Sight 600.SG ST Kin LeftRail Min Distance [mm]","T-Sight 600.SG ST Kin RightRail Min Distance [mm]","T-Sight 600.Oversize Kin Min Distance [mm]","T-Sight 600.Oversize Kin LeftRail Min Distance [mm]","T-Sight 600.Oversize Kin RightRail Min Distance [mm]","T-Sight 600.Gauge_AdjacentTrack_Left [mm]","T-Sight 600.Distance_AdjacentTrack_Left [mm]","T-Sight 600.Gauge_AdjacentTrack_Right [mm]","T-Sight 600.Distance_AdjacentTrack_Right [mm]"
*/

export const tsightSchema = z.object({
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
  ballast_slope_l: zcsv.string(
    z.string().optional(),
  ),
  ballast_width_l: zcsv.string(
    z.string().optional(),
  ),
  ballast_height_l: zcsv.string(
    z.string().optional(),
  ),
  ballast_slope_r: zcsv.string(
    z.string().optional(),
  ),
  ballast_width_r: zcsv.string(
    z.string().optional(),
  ),
  ballast_height_r: zcsv.string(
    z.string().optional(),
  ),
  platform_center_h_l: zcsv.string(
    z.string().optional(),
  ),
  platform_run_v_l: zcsv.string(
    z.string().optional(),
  ),
  platform_center_h_r: zcsv.string(
    z.string().optional(),
  ),
  platform_run_v_r: zcsv.string(
    z.string().optional(),
  ),
  fin1_kin_min_distance: zcsv.string(
    z.string().optional(),
  ),
  fin1_kin_leftrail_min_dist: zcsv.string(
    z.string().optional(),
  ),
  fin1_kin_rightrail_min_dist: zcsv.string(
    z.string().optional(),
  ),
  sg_mt_kin_min_distance: zcsv.string(
    z.string().optional(),
  ),
  sg_mt_kin_leftrail_min_distance: zcsv.string(
    z.string().optional(),
  ),
  sg_mt_kin_rightrail_min_distance: zcsv.string(
    z.string().optional(),
  ),
  sg_st_kin_min_distance: zcsv.string(
    z.string().optional(),
  ),
  sg_st_kin_leftrail_min_distance: zcsv.string(
    z.string().optional(),
  ),
  sg_st_kin_rightrail_min_distance: zcsv.string(
    z.string().optional(),
  ),
  oversize_kin_min_distance: zcsv.string(
    z.string().optional(),
  ),
  oversize_kin_leftrail_min_distance: zcsv.string(
    z.string().optional(),
  ),
  oversize_kin_rightrail_min_distance: zcsv.string(
    z.string().optional(),
  ),
  gauge_adjacenttrack_left: zcsv.string(
    z.string().optional(),
  ),
  distance_adjacenttrack_left: zcsv.string(
    z.string().optional(),
  ),
  gauge_adjacenttrack_right: zcsv.string(
    z.string().optional(),
  ),
  distance_adjacenttrack_right: zcsv.string(
    z.string().optional(),
  ),
});

export type ITsight = z.infer<typeof tsightSchema>;
