import {
  insertRaporttiData,
  parseCSVFile,
} from '../csvDataParser';
import { amsSchema } from '../csvSchemas/amsCsvSchema';

const amsCsv =
  '"Running Date","22/11/2022 7:44:40 AM"\r\n' +
  '"SSCount","Track","Location [km+m]","Latitude","Longitude","Ajonopeus [Km/h]","Running Dynamics.Oikea Pystysuuntainen Kiihtyvyys C1 [m/s^2]","Running Dynamics.Vasen Pystysuuntainen Kiihtyvyys C1 [m/s^2]","Running Dynamics.Oikea Pystysuuntainen Kiihtyvyys C1 Suodatettu [m/s^2]","Running Dynamics.Vasen Pystysuuntainen Kiihtyvyys C1 Suodatettu [m/s^2]","Running Dynamics.Oikea Pystysuuntainen Kiihtyvyys C1 Keskihajonta [m/s^2]","Running Dynamics.Vasen Pystysuuntainen Kiihtyvyys C1 Keskihajonta [m/s^2]","Running Dynamics.Oikea Poikittainen Kiihtyvyys C1 [m/s^2]","Running Dynamics.Vasen Poikittainen Kiihtyvyys C1 [m/s^2]","Running Dynamics.Oikea Poikittainen Kiihtyvyys C1 Suodatettu [m/s^2]","Running Dynamics.Vasen Poikittainen Kiihtyvyys C1 Suodatettu [m/s^2]","Running Dynamics.Oikea Poikittainen Kiihtyvyys C1 Keskihajonta [m/s^2]","Running Dynamics.Vasen Poikittainen Kiihtyvyys C1 Keskihajonta [m/s^2]","Running Dynamics.Pystysuuntainen Kiihtyvyys C2 [m/s^2]","Running Dynamics.Pystysuuntainen Kiihtyvyys C2 Suodatettu [m/s^2]","Running Dynamics.Poikittainen Kiihtyvyys C2 [m/s^2]","Running Dynamics.Poikittainen Kiihtyvyys C2 Suodatettu [m/s^2]","Running Dynamics.Transversal Acceleration C2 Mean-to-Peak [m/s^2]","Running Dynamics.Pystysuuntainen Kiihtyvyys C3 [m/s^2]","Running Dynamics.Pystysuuntainen Kiihtyvyys C3 Suodatettu [m/s^2]","Running Dynamics.Poikittainen Kiihtyvyys C3 [m/s^2]","Running Dynamics.Poikittainen Kiihtyvyys C3 Suodatettu [m/s^2]","Running Dynamics.Transversal Acceleration C3 Mean-to-Peak [m/s^2]","Running Dynamics.Ajonopeus [Km/h]"\r\n' +
  '318103,"008 KOKOL LR",630+0850.00,"64.07646857° N","24.54062901° E",55.985,-21.7708,26.3496,14.6794,14.1478,8.1315,8.0237,-4.1229,-6.3282,3.1816,-3.5781,1.3801,1.7761,2.2629,2.1137,-4.7717,-2.7778,-1.3045,1.3953,0.5937,1.2821,0.5037,0.3869,56\r\n' +
  '318104,"008 KOKOL LR",630+0850.25,"64.07647082° N","24.54062896° E",55.955,29.2801,29.5273,16.7167,17.0519,8.1699,7.9743,3.8653,-6.4757,2.8971,-4.6735,1.3761,1.7859,2.1084,1.5889,2.7095,-2.0110,-1.0043,1.9055,0.3789,1.4189,0.6535,0.2594,56\r\n' +
  '318105,"008 KOKOL LR",630+0850.50,"64.07647308° N","24.54062891° E",55.939,-29.2653,23.2646,-26.4762,-14.8906,8.4049,8.0362,4.1007,5.2723,-2.2401,4.5284,1.3860,1.7973,2.4118,2.1124,-2.5522,-1.9687,-1.3425,2.0056,-0.5608,1.6471,0.6996,0.2019,56\r\n' +
  '318106,"008 KOKOL LR",630+0850.75,"64.07647533° N","24.54062885° E",55.938,-20.9017,-21.8595,13.2977,15.9086,8.4101,8.0505,4.0499,-4.9934,-2.2320,-3.1739,1.3767,1.7917,2.5858,2.0813,2.1109,0.8900,-1.1602,-1.8402,-0.5512,1.3017,0.6939,0.1295,56\r\n' +
  '318107,"008 KOKOL LR",630+0851.00,"64.07647756° N","24.54062880° E",55.924,-21.2956,21.9569,14.8956,12.2093,8.3666,7.9174,-3.6308,4.0280,2.7983,2.0624,1.3882,1.7930,2.9541,2.8539,-2.6747,-1.8791,-1.2058,1.6617,-0.3302,1.8971,0.8156,0.1039,56\r\n' +
  '318108,"008 KOKOL LR",630+0851.25,"64.07647979° N","24.54062875° E",55.925,-23.1085,25.8125,-21.9575,-12.1894,8.3251,7.8952,3.0163,-4.6372,2.5206,-2.8624,1.3800,1.8019,3.2062,3.0976,-3.2225,-1.4226,-2.0412,1.6744,-0.3927,2.0022,0.7377,0.0205,56';

const amsCsvError =
  '"Running Date","22/11/2022 7:44:40 AM"\r\n' +
  '"SSCount","Track","Location [km+m]","Latitude","Longitude","Ajonopeus [Km/h]","Running Dynamics.Vasen Pystysuuntainen Kiihtyvyys C1 [m/s^2]","Running Dynamics.Oikea Pystysuuntainen Kiihtyvyys C1 Suodatettu [m/s^2]","Running Dynamics.Vasen Pystysuuntainen Kiihtyvyys C1 Suodatettu [m/s^2]","Running Dynamics.Oikea Pystysuuntainen Kiihtyvyys C1 Keskihajonta [m/s^2]","Running Dynamics.Vasen Pystysuuntainen Kiihtyvyys C1 Keskihajonta [m/s^2]","Running Dynamics.Oikea Poikittainen Kiihtyvyys C1 [m/s^2]","Running Dynamics.Vasen Poikittainen Kiihtyvyys C1 [m/s^2]","Running Dynamics.Oikea Poikittainen Kiihtyvyys C1 Suodatettu [m/s^2]","Running Dynamics.Vasen Poikittainen Kiihtyvyys C1 Suodatettu [m/s^2]","Running Dynamics.Oikea Poikittainen Kiihtyvyys C1 Keskihajonta [m/s^2]","Running Dynamics.Vasen Poikittainen Kiihtyvyys C1 Keskihajonta [m/s^2]","Running Dynamics.Pystysuuntainen Kiihtyvyys C2 [m/s^2]","Running Dynamics.Pystysuuntainen Kiihtyvyys C2 Suodatettu [m/s^2]","Running Dynamics.Poikittainen Kiihtyvyys C [m/s^2]","Running Dynamics.Poikittainen Kiihtyvyys C2 Suodatettu [m/s^2]","Running Dynamics.Transversal Acceleration C2 Mean-to-Peak [m/s^2]","Running Dynamics.Pystysuuntainen Kiihtyvyys C3 [m/s^2]","Running Dynamics.Pystysuuntainen Kiihtyvyys C3 Suodatettu [m/s^2]","Running Dynamics.Poikittainen Kiihtyvyys C3 [m/s^2]","Running Dynamics.Poikittainen Kiihtyvyys C3 Suodatettu [m/s^2]","Running Dynamics.Transversal Acceleration C3 Mean-to-Peak [m/s^2]","Running Dynamics.Ajonopeus [Km/h]"\r\n' +
  '318102,"008 KOKOL LR",630+0850.50,"64.07647308° N","24.54062891° E",55.939,-29.2653,23.2646,-26.4762,-14.8906,8.4049,8.0362,4.1007,5.2723,-2.2401,4.5284,1.3860,1.7973,2.4118,2.1124,-2.5522,-1.9687,-1.3425,2.0056,-0.5608,1.6471,0.6996,0.2019,56\r\n' +
  '318103,"008 KOKOL LR",630+0850.00,"","24.54062901° E",55.985, 26.3496,14.6794,14.1478,8.1315,8.0237,-4.1229,-6.3282,3.1816,-3.5781,1.3801,1.7761,2.2629,2.1137,-4.7717,-2.7778,-1.3045,1.3953,0.5937,1.2821,0.5037,0.3869,56\r\n' +
  '318104,"008 KOKOL LR",630+0850.00,"","24.54062901° E",55.985, 26.3496,14.6794,14.1478,8.1315,8.0237,-4.1229,-6.3282,3.1816,-3.5781,1.3801,1.7761,2.2629,2.1137,-4.7717,-2.7778,-1.3045,1.3953,0.5937,1.2821,0.5037,0.3869,56\r\n';

const tsightCsv: string =
  '"Running Date","22/11/2022 7:44:40 AM"\r\n' +
  '"SSCount","Track","Location [km+m]","Latitude","Longitude","Ajonopeus [Km/h]","T-Sight 600.Ballast slope_L [°]","T-Sight 600.Ballast width_L [mm]","T-Sight 600.Ballast height_L [mm]","T-Sight 600.Ballast slope_R [°]","T-Sight 600.Ballast width_R [mm]","T-Sight 600.Ballast height_R [mm]","T-Sight 600.Platform_Center_H_L [mm]","T-Sight 600.Platform_Run_V_L [mm]","T-Sight 600.Platform_Center_H_R [mm]","T-Sight 600.Platform_Run_V_R [mm]","T-Sight 600.FIN1 Kin Min Distance [mm]","T-Sight 600.FIN1 Kin LeftRail Min Dist [mm]","T-Sight 600.FIN1 Kin RightRail Min Dist [mm]","T-Sight 600.SG MT Kin Min Distance [mm]","T-Sight 600.SG MT Kin LeftRail Min Distance [mm]","T-Sight 600.SG MT Kin RightRail Min Distance [mm]","T-Sight 600.SG ST Kin Min Distance [mm]","T-Sight 600.SG ST Kin LeftRail Min Distance [mm]","T-Sight 600.SG ST Kin RightRail Min Distance [mm]","T-Sight 600.Oversize Kin Min Distance [mm]","T-Sight 600.Oversize Kin LeftRail Min Distance [mm]","T-Sight 600.Oversize Kin RightRail Min Distance [mm]","T-Sight 600.Gauge_AdjacentTrack_Left [mm]","T-Sight 600.Distance_AdjacentTrack_Left [mm]","T-Sight 600.Gauge_AdjacentTrack_Right [mm]","T-Sight 600.Distance_AdjacentTrack_Right [mm]"\r\n' +
  '129292,"003 KRRRP 253",224+0203.00,"61.74474494° N","23.39751494° E",62.539,-22.49492264,-1925,675,8.82016468,2542,1292,NaN,,,,,,,,,,,,,,,,0,0.00,0,0.00\r\n' +
  '129293,"003 KRRRP 253",224+0203.25,"61.74474688° N","23.39751262° E",62.537,-21.25092697,-1901,651,6.46627712,2707,1457,,,,,,,,,,,,,,,,,0,0.00,0,0.00\r\n' +
  '129294,"003 KRRRP 253",224+0203.50,"61.74474882° N","23.39751029° E",62.541,-21.20094299,-1922,672,-9.04385471,951,-299,,,,,810,,,510,,,510,,,380,,,0,0.00,0,0.00\r\n' +
  '129295,"003 KRRRP 253",224+0203.75,"61.74475076° N","23.39750796° E",62.549,-22.05341911,-1932,682,9.18755913,2433,1183,,,,,,,,,,,,,,,,,0,0.00,0,0.00\r\n' +
  '129296,"003 KRRRP 253",224+0204.00,"61.74475271° N","23.39750564° E",62.546,-21.14999771,-1894,644,6.16541433,2777,1527,,,,,,,,,,,,,,,,,0,0.00,0,0.00\r\n' +
  '129297,"003 KRRRP 253",224+0204.25,"61.74475465° N","23.39750331° E",62.534,-23.89974213,-1948,698,7.75561905,2691,1441,,,,,,,,,,,,,,,,,0,0.00,0,0.00\r\n' +
  '129298,"003 KRRRP 253",224+0204.50,"61.74475659° N","23.39750099° E",62.517,-22.87596130,-1939,689,7.22121572,2710,1460,,,,,,,,,,,,,,,,,0,0.00,0,0.00\r\n' +
  '129299,"003 KRRRP 253",224+0204.75,"61.74475853° N","23.39749865° E",62.516,-23.52712059,-1976,726,-19.35003662,1595,345,,,,,,,,,,,,,,,,,0,0.00,0,0.00\r\n' +
  '129300,"003 KRRRP 253",224+0205.00,"61.74476048° N","23.39749630° E",62.499,-21.49841690,-1966,716,-26.26303673,1764,514,,,,,,,,,,,,,,,,,0,0.00,0,0.00';


const tgCsv: string =
  '"Running Date","22/11/2022 7:44:40 AM"\r\n' +
  '"SSCount","Track","Location [km+m]","Latitude","Longitude","Ajonopeus [Km/h]","TG Master.Raideleveyden Poikkeama [mm]","TG Master.Kallistus [mm]","TG Master.Kallistuksen Poikkeama [mm]","TG Master.Kierous [mm]","TG Master.Kaarevuus [10000/m]","TG Master.Raideleveyden Poikkeaman Muutos [mm/m]","TG Master.Kierouden Poikkeama [mm]","TG Master.Vasen Korkeuspoikkeama D1 [mm]","TG Master.Vasen Korkeuspoikkeama D2 [mm]","TG Master.Oikea Korkeuspoikkeama D2 [mm]","TG Master.Vasen Korkeuspoikkeama D3 [mm]","TG Master.Oikea Korkeuspoikkeama D3 [mm]","TG Master.Vasen Nuolikorkeuspoikkeama D1 [mm]","TG Master.Oikea Nuolikorkeuspoikkeama D1 [mm]","TG Master.Vasen Nuolikorkeuspoikkeama D2 [mm]","TG Master.Oikea Nuolikorkeuspoikkeama D2 [mm]","TG Master.Vasen Nuolikorkeuspoikkeama D3 [mm]","TG Master.Oikea Nuolikorkeuspoikkeama D3 [mm]","TG Master.Gradient [‰]","TG Master.Raideleveyden [mm]","TG Master.Oikea Korkeuspoikkeama D1 [mm]","TG Master.Raideleveyden Keskihajonta [mm]","TG Master.Kallistus Keskihajonta [mm]","TG Master.Kierouden Keskihajonta [mm]","TG Master.Vasen Korkeuspoikkeama D1 Keskihajonta [mm]","TG Master.Oikea Korkeuspoikkeama D1 Keskihajonta [mm]","TG Master.Vasen Nuolikorkeus D1 Keskihajonta [mm]","TG Master.Oikea Nuolikorkeus D1 Keskihajonta [mm]","TG Master.Vasen Korkeuspoikkema D0 [mm]","TG Master.Oikea Korkeuspoikkema D0 [mm]","TG Master.Vasen Korkeuspoikkema D0 Keskihajonta [mm]","TG Master.Oikea Korkeuspoikkema D0 Keskihajonta [mm]"\r\n' +
  '294966,"006 LHRP 2",130+0100.00,"60.97625075° N","25.65622864° E",40.872,-0.82,-0.76,-0.41,1.39,-1.82,0.08,1.29,-0.91,4.08,4.03,4.69,5.36,-0.13,0.43,-1.04,-0.69,-13.96,-13.50,-0.43,1523.18,-0.68,0.88,2.23,1.59,1.27,1.13,1.23,1.22,-0.10,0.03,0.16,0.17\r\n' +
  '294967,"006 LHRP 2",130+0100.25,"60.97625061° N","25.65623323° E",40.873,-0.79,-0.59,-0.24,1.30,-1.82,0.05,1.20,-0.83,4.13,4.07,4.83,5.49,-0.17,0.39,-1.02,-0.67,-13.86,-13.40,-0.43,1523.21,-0.77,0.88,2.22,1.59,1.27,1.13,1.23,1.22,-0.01,0.05,0.16,0.17\r\n' +
  '294968,"006 LHRP 2",130+0100.00,"60.97625046° N","25.65623782° E",40.867,-0.73,-0.40,-0.05,1.10,-1.82,-0.06,1.01,-0.74,4.19,4.10,4.97,5.62,-0.19,0.35,-1.00,-0.65,-13.76,-13.29,-0.43,1523.27,-0.86,0.88,2.22,1.59,1.27,1.13,1.23,1.22,0.05,-0.01,0.16,0.17\r\n' +
  '294969,"006 LHRP 2",130+0100.25,"60.97625031° N","25.65624241° E",40.863,-0.80,-0.17,0.17,1.00,-1.82,-0.05,0.90,-0.65,4.25,4.14,5.11,5.74,-0.20,0.31,-0.98,-0.63,-13.65,-13.18,-0.43,1523.20,-0.93,0.88,2.21,1.59,1.27,1.13,1.23,1.22,0.13,-0.08,0.16,0.17\r\n' +
  '294970,"006 LHRP 2",130+0100.50,"60.97625017° N","25.65624700° E",40.862,-0.88,-0.01,0.33,0.89,-1.82,-0.01,0.79,-0.57,4.30,4.18,5.25,5.87,-0.21,0.28,-0.96,-0.60,-13.55,-13.08,-0.43,1523.12,-0.99,0.87,2.21,1.59,1.27,1.13,1.23,1.22,0.19,-0.09,0.16,0.17\r\n' +
  '294971,"006 LHRP 2",130+0100.75,"60.97624998° N","25.65625159° E",40.858,-0.84,0.02,0.35,0.86,-1.82,0.06,0.75,-0.50,4.36,4.21,5.38,5.99,-0.20,0.24,-0.93,-0.58,-13.45,-12.97,-0.43,1523.16,-1.01,0.87,2.21,1.59,1.27,1.13,1.23,1.22,0.21,-0.09,0.16,0.17\r\n' +
  '294972,"006 LHRP 2",130+0101.00,"60.97624980° N","25.65625618° E",40.860,-0.74,0.15,0.47,0.53,-1.82,0.22,0.41,-0.46,4.41,4.25,5.51,6.11,-0.20,0.21,-0.91,-0.56,-13.34,-12.86,-0.43,1523.26,-1.01,0.87,2.20,1.59,1.27,1.13,1.23,1.22,0.21,-0.13,0.16,0.17\r\n' +
  '294973,"006 LHRP 2",130+0101.25,"60.97624962° N","25.65626077° E",40.858,-0.74,0.22,0.54,0.41,-1.82,0.37,0.27,-0.44,4.46,4.28,5.63,6.22,-0.20,0.16,-0.88,-0.53,-13.23,-12.75,-0.43,1523.26,-0.97,0.87,2.20,1.59,1.27,1.13,1.23,1.22,0.21,-0.15,0.16,0.17\r\n' +
  '294974,"006 LHRP 2",130+0101.50,"60.97624943° N","25.65626536° E",40.860,-0.66,0.14,0.44,0.28,-1.82,0.19,0.11,-0.44,4.51,4.32,5.76,6.34,-0.21,0.11,-0.85,-0.51,-13.13,-12.64,-0.43,1523.34,-0.89,0.87,2.19,1.59,1.27,1.13,1.23,1.22,0.19,-0.09,0.16,0.17\r\n' +
  '294975,"006 LHRP 2",130+0101.75,"60.97624927° N","25.65626994° E",40.858,-0.47,-0.04,0.26,0.19,-1.82,0.09,0.00,-0.45,4.56,4.35,5.88,6.45,-0.23,0.04,-0.82,-0.48,-13.02,-12.53,-0.43,1523.53,-0.79,0.86,2.19,1.59,1.27,1.13,1.23,1.22,0.12,0.01,0.16,0.17\r\n' +
  '294976,"006 LHRP 2",130+0102.00,"60.97624912° N","25.65627453° E",40.861,-0.54,-0.16,0.12,0.13,-1.81,0.12,-0.09,-0.47,4.61,4.38,5.99,6.56,-0.27,-0.04,-0.79,-0.46,-12.91,-12.42,-0.43,1523.46,-0.68,0.86,2.19,1.59,1.27,1.13,1.23,1.22,0.03,0.08,0.16,0.17\r\n' +
  '294977,"006 LHRP 2",130+0102.25,"60.97624897° N","25.65627911° E",40.857,-0.64,-0.24,0.03,0.17,-1.81,0.00,-0.07,-0.49,4.66,4.42,6.11,6.66,-0.32,-0.12,-0.76,-0.43,-12.80,-12.31,-0.43,1523.36,-0.56,0.86,2.18,1.59,1.27,1.13,1.23,1.22,-0.05,0.09,0.16,0.17';

const rpCsv: string =
  '"Running Date","22/11/2022 7:44:40 AM"\r\n' +
  '"SSCount","Track","Location [km+m]","Latitude","Longitude","Ajonopeus [Km/h]","Rail Profile.Vasen Pystysuora Kuluma [mm]","Rail Profile.Oikea Pystysuora Kuluma [mm]","Rail Profile.Vasen Pystysuora Kuluman Keskiarvo [mm]","Rail Profile.Oikea Pystysuora Kuluman Keskiarvo [mm]","Rail Profile.Vasen Pystysuora Kuluman Keskihajonta [mm]","Rail Profile.Oikea Pystysuora Kuluman Keskihajonta [mm]","Rail Profile.Vasen Sisäpuolinen Sivuttaiskuluma [mm]","Rail Profile.Oikea Sisäpuolinen Sivuttaiskuluma [mm]","Rail Profile.Vasen Sisäpuolisen Sivuttaiskuluman Keskiarvo [mm]","Rail Profile.Oikea Sisäpuolisen Sivuttaiskuluman Keskiarvo [mm]","Rail Profile.Vasen Sisäpuolisen Sivuttaiskuluman Keskihajonta [mm]","Rail Profile.Oikea Sisäpuolisen Sivuttaiskuluman Keskihajonta [mm]","Rail Profile.Vasen Ulkoinen Sivuttaiskuluma [mm]","Rail Profile.Oikea Ulkoinen Sivuttaiskuluma [mm]","Rail Profile.Vasen Ulkoisen Sivuttaiskuluman Keskiarvo [mm]","Rail Profile.Oikea Ulkoisen Sivuttaiskuluman Keskiarvo [mm]","Rail Profile.Vasen Ulkoisen Sivuttaiskuluman Keskihajonta [mm]","Rail Profile.Oikea Ulkoisen Sivuttaiskuluman Keskihajonta [mm]","Rail Profile.Vasen Kallistus [°]","Rail Profile.Oikea Kallistus [°]","Rail Profile.Vasen Kallistuksen Keskiarvo [°]","Rail Profile.Oikea Kallistuksen Keskiarvo [°]","Rail Profile.Vasen Kallistuksen Keskihajonta [°]","Rail Profile.Oikea Kallistuksen Keskihajonta [°]","Rail Profile.Vasen 45° Kuluma [mm]","Rail Profile.Oikea 45° Kuluma [mm]","Rail Profile.Vasen 45° Kuluman Keskiarvo [mm]","Rail Profile.Oikea 45° Kuluman Keskiarvo [mm]","Rail Profile.Vasen 45° Kuluman Keskihajonta [mm]","Rail Profile.Oikea 45° Kuluman Keskihajonta [mm]","Rail Profile.Vasen Yhdistetty Kuluma [mm]","Rail Profile.Oikea Yhdistetty Kuluma [mm]","Rail Profile.Vasen Yhdistetyn Kuluman Keskiarvo [mm]","Rail Profile.Oikea Yhdistetyn Kuluman Keskiarvo [mm]","Rail Profile.Vasen Yhdistetyn Kuluman Keskihajonta [mm]","Rail Profile.Oikea Yhdistetyn Kuluman Keskihajonta [mm]","Rail Profile.Vasen Poikkileikkauspinta-Ala [mm^2]","Rail Profile.Oikea Poikkileikkauspinta-Ala [mm^2]","Rail Profile.Vasen Poikkileikkauspinta-Alan Keskiarvo [mm^2]","Rail Profile.Oikea Poikkileikkauspinta-Alan Keskiarvo [mm^2]","Rail Profile.Vasen Poikkileikkauspinta-Alan Keskihajonta [mm^2]","Rail Profile.Oikea Poikkileikkauspinta-Alan Keskihajonta [mm^2]","Rail Profile.Vasen Sisäpuolinen Purse [mm]","Rail Profile.Oikea Sisäpuolinen Purse [mm]","Rail Profile.Vasen Sisäpuolisen Purseen Keskiarvo [mm]","Rail Profile.Oikea Sisäpuolisen Purseen Keskiarvo [mm]","Rail Profile.Vasen Sisäpuolisen Purseen Keskihajonta [mm]","Rail Profile.Oikea Sisäpuolisen Purseen Keskihajonta [mm]","Rail Profile.Vasen Ulkopuolinen Purse [mm]","Rail Profile.Oikea Ulkopuolinen Purse [mm]","Rail Profile.Vasen Ulkopuolisen Purseen Keskiarvo [mm]","Rail Profile.Oikea Ulkopuolisen Purseen Keskiarvo [mm]","Rail Profile.Vasen Ulkopuolisen Purseen Keskihajonta [mm]","Rail Profile.Oikea Ulkopuolisen Purseen Keskihajonta [mm]","Rail Profile.Tehollinen Kartiokkuus","Rail Profile.Tehollisen Kartiokkuuden Keskiarvo","Rail Profile.Tehollisen Kartiokkuuden Keskihajonta","Rail Profile.Vasen Kiskon Kallistuksen Kiinteä Keskiarvo [°]","Rail Profile.Oikea Kiskon Kallistuksen Kiinteä Keskiarvo [°]","Rail Profile.Vasen Kiskon Kallistuksen Kiinteä Keskihajonta [°]","Rail Profile.Oikea Kiskon Kallistuksen Kiinteä Keskihajonta [°]","Rail Profile.Vasen Pystysuoran Kuluman Kiinteä Keskiarvo [mm]","Rail Profile.Oikea Pystysuoran Kuluman Kiinteä Keskiarvo [mm]","Rail Profile.Vasen Pystysuoran Kuluman Kiinteä Keskihajonta [mm]","Rail Profile.Oikea Pystysuoran Kuluman Kiinteä Keskihajonta [mm]","Rail Profile.Vasen Sisäpuolisen Sivuttaisk Kiinteä Keskiarvo [mm]","Rail Profile.Oikea Sisäpuolisen Sivuttaisk Kiinteä Keskiarvo [mm]","Rail Profile.Vasen Sisäpuolisen Sivuttaisk Kiinteä Keskihajonta [mm]","Rail Profile.Oikea Sisäpuolisen Sivuttaisk Kiinteä Keskihajonta [mm]","Rail Profile.Vasen Ulkopuolisen Sivuttaisk Kiinteä Keskiarvo [mm]","Rail Profile.Oikea Ulkopuolisen Sivuttaisk Kiinteä Keskiarvo [mm]","Rail Profile.Vasen Ulkopuolisen Sivuttaisk Kiinteä Keskihajonta [mm]","Rail Profile.Oikea Ulkopuolisen Sivuttaisk Kiinteä Keskihajonta [mm]","Rail Profile.Vasen 45° Kuluman Kiinteä Keskiarvo [mm]","Rail Profile.Oikea 45° Kuluman Kiinteä Keskiarvo [mm]","Rail Profile.Vasen 45° Kuluman Kiinteä Keskihajonta [mm]","Rail Profile.Oikea 45° Kuluman Kiinteä Keskihajonta [mm]","Rail Profile.Vasen Yhdistetyn Kuluman Kiinteä Keskiarvo [mm]","Rail Profile.Oikea Yhdistetyn Kuluman Kiinteä Keskiarvo [mm]","Rail Profile.Vasen Yhdistetyn Kuluman Kiinteä Keskihajonta [mm]","Rail Profile.Oikea Yhdistetyn Kuluman Kiinteä Keskihajonta [mm]","Rail Profile.Vasen Poikkileikkauspinta-Alan Kiinteä Keskiarvo [mm^2]","Rail Profile.Oikea Poikkileikkauspinta-Alan Kiinteä Keskiarvo [mm^2]","Rail Profile.Vasen Poikkileikkauspint-Alan Kiinteä Keskihajonta [mm^2]","Rail Profile.Oikea Poikkileikkauspint-Alan Kiinteä Keskihajonta [mm^2]","Rail Profile.Vasen Sisäpuolisen Purseen Kiinteä Keskiarvo [mm]","Rail Profile.Oikea Sisäpuolisen Purseen Kiinteä Keskiarvo [mm]","Rail Profile.Vasen Sisäpuolisen Purseen Kiinteä Keskihajonta [mm]","Rail Profile.Oikea Sisäpuolisen Purseen Kiinteä Keskihajonta [mm]","Rail Profile.Vasen Ulkopuolisen Purseen Kiinteä Keskiarvo [mm]","Rail Profile.Oikea Ulkopuolisen Purseen Kiinteä Keskiarvo [mm]","Rail Profile.Vasen Ulkopulisen Purseen Kiinteä Keskihajonta [mm]","Rail Profile.Oikea Ulkopuolisen Purseen Kiinteä Keskihajonta [mm]","Rail Profile.Tehollisen Kartiokkuuden Kiinteä Keskiarvo","Rail Profile.Tehollisen Kartiokkuuden Kiinteä Keskihajonta","Rail Profile.Vasen Poikkipinta-Alan Poikkeama [mm^2]","Rail Profile.Oikea Poikkipinta-Alan Poikkeama [mm^2]","Rail Profile.Ajonopeus [Km/h]"\r\n' +
  '299974,"003 TL V628-V626",148+0671.00,"61.17816172° N","23.84195551° E",42.151,3.288,1.372,2.284,1.302,0.588,0.346,-0.839,-0.105,-0.406,-0.313,0.358,0.409,-0.727,0.556,-0.246,0.319,0.258,0.540,1.217,1.216,1.349,1.365,0.176,0.110,3.379,1.591,1.986,1.187,0.887,0.564,2.504,1.597,1.959,1.305,0.549,0.298,2411.733,2415.867,2414.337,2416.562,1.784,0.828,0.000,0.192,0.010,0.145,0.025,0.084,0.000,0.000,0.000,0.001,0.001,0.003,0.0216,0.0158,0.0029,1.347,1.438,0.159,0.103,2.569,0.915,0.292,0.297,-0.046,-0.305,0.393,0.530,-0.225,0.501,0.201,0.472,2.489,0.851,0.403,0.376,2.434,1.013,0.261,0.286,1600.000,1600.000,0.753,0.892,0.009,0.077,0.025,0.087,0.001,0.000,0.001,0.001,0.094,0.064,8.5243,4.3905,42.15\r\n' +
  '299975,"003 TL V628-V626",148+0671.25,"61.17816258° N","23.84195121° E",42.149,3.288,1.372,2.283,1.303,0.588,0.345,-0.839,-0.105,-0.408,-0.316,0.357,0.415,-0.727,0.556,-0.247,0.320,0.259,0.542,1.217,1.216,1.349,1.364,0.176,0.110,3.379,1.591,1.982,1.185,0.888,0.568,2.504,1.597,1.955,1.305,0.550,0.297,2411.733,2415.867,2414.346,2416.560,1.787,0.826,0.000,0.192,0.010,0.146,0.025,0.083,0.000,0.000,0.000,0.001,0.001,0.003,0.0171,0.0152,0.0096,1.347,1.438,0.159,0.103,2.569,0.915,0.292,0.297,-0.046,-0.305,0.393,0.530,-0.225,0.501,0.201,0.472,2.489,0.851,0.403,0.376,2.434,1.013,0.261,0.286,1600.000,1600.000,0.753,0.892,0.009,0.077,0.025,0.087,0.001,0.000,0.001,0.001,0.094,0.064,8.5243,4.3905,42.15\r\n' +
  '299976,"003 TL V628-V626",148+0671.50,"61.17816343° N","23.84194690° E",42.141,3.288,1.372,2.281,1.304,0.588,0.344,-0.839,-0.105,-0.410,-0.319,0.355,0.422,-0.727,0.556,-0.248,0.322,0.260,0.544,1.217,1.216,1.349,1.364,0.176,0.111,3.379,1.591,1.978,1.183,0.890,0.571,2.504,1.597,1.952,1.306,0.550,0.296,2411.733,2415.867,2414.355,2416.559,1.790,0.824,0.000,0.192,0.010,0.146,0.025,0.083,0.000,0.000,0.000,0.001,0.001,0.003,0.0363,0.0216,0.0086,1.347,1.438,0.159,0.103,2.569,0.915,0.292,0.297,-0.046,-0.305,0.393,0.530,-0.225,0.501,0.201,0.472,2.489,0.851,0.403,0.376,2.434,1.013,0.261,0.286,1600.000,1600.000,0.753,0.892,0.009,0.077,0.025,0.087,0.001,0.000,0.001,0.001,0.094,0.064,8.5243,4.3905,42.14\r\n' +
  '299977,"003 TL V628-V626",148+0671.75,"61.17816428° N","23.84194260° E",42.137,3.288,1.372,2.279,1.305,0.588,0.342,-0.839,-0.105,-0.412,-0.322,0.354,0.428,-0.727,0.556,-0.248,0.323,0.260,0.546,1.217,1.216,1.350,1.363,0.176,0.111,3.379,1.591,1.974,1.181,0.891,0.574,2.504,1.597,1.949,1.306,0.550,0.296,2411.733,2415.867,2414.364,2416.557,1.792,0.821,0.000,0.192,0.010,0.147,0.025,0.083,0.000,0.000,0.000,0.001,0.001,0.003,0.0301,0.0171,0.0082,1.347,1.438,0.159,0.103,2.569,0.915,0.292,0.297,-0.046,-0.305,0.393,0.530,-0.225,0.501,0.201,0.472,2.489,0.851,0.403,0.376,2.434,1.013,0.261,0.286,1600.000,1600.000,0.753,0.892,0.009,0.077,0.025,0.087,0.001,0.000,0.001,0.001,0.094,0.064,8.5243,4.3905,42.14\r\n' +
  '299978,"003 TL V628-V626",148+0672.00,"61.17816516° N","23.84193831° E",42.142,3.288,1.372,2.277,1.307,0.588,0.341,-0.839,-0.105,-0.414,-0.325,0.352,0.434,-0.727,0.556,-0.249,0.325,0.261,0.547,1.217,1.216,1.350,1.363,0.176,0.112,3.379,1.591,1.970,1.179,0.893,0.577,2.504,1.597,1.946,1.307,0.550,0.295,2411.733,2415.867,2414.373,2416.555,1.795,0.819,0.000,0.192,0.010,0.147,0.025,0.083,0.000,0.000,0.000,0.001,0.001,0.003,0.0247,0.0363,0.0099,1.347,1.438,0.159,0.103,2.569,0.915,0.292,0.297,-0.046,-0.305,0.393,0.530,-0.225,0.501,0.201,0.472,2.489,0.851,0.403,0.376,2.434,1.013,0.261,0.286,1600.000,1600.000,0.753,0.892,0.009,0.077,0.025,0.087,0.001,0.000,0.001,0.001,0.094,0.064,8.5243,4.3905,42.14\r\n' +
  '299979,"003 TL V628-V626",148+0672.25,"61.17816605° N","23.84193404° E",42.134,3.288,1.372,2.276,1.308,0.589,0.340,-0.839,-0.105,-0.416,-0.328,0.351,0.439,-0.727,0.556,-0.250,0.326,0.261,0.549,1.217,1.216,1.350,1.362,0.176,0.112,3.379,1.591,1.966,1.178,0.894,0.580,2.504,1.597,1.943,1.307,0.551,0.294,2411.733,2415.867,2414.382,2416.553,1.797,0.816,0.000,0.192,0.010,0.148,0.025,0.083,0.000,0.000,0.000,0.001,0.001,0.003,0.0130,0.0301,0.0090,1.347,1.438,0.159,0.103,2.569,0.915,0.292,0.297,-0.046,-0.305,0.393,0.530,-0.225,0.501,0.201,0.472,2.489,0.851,0.403,0.376,2.434,1.013,0.261,0.286,1600.000,1600.000,0.753,0.892,0.009,0.077,0.025,0.087,0.001,0.000,0.001,0.001,0.094,0.064,8.5243,4.3905,42.13\r\n' +
  '299980,"003 TL V628-V626",148+0672.50,"61.17816694° N","23.84192977° E",42.129,3.288,1.372,2.274,1.309,0.589,0.338,-0.839,-0.105,-0.418,-0.331,0.349,0.445,-0.727,0.556,-0.251,0.328,0.262,0.551,1.217,1.216,1.350,1.361,0.176,0.112,3.379,1.591,1.962,1.176,0.896,0.583,2.504,1.597,1.940,1.308,0.551,0.293,2411.733,2415.867,2414.391,2416.552,1.800,0.814,0.000,0.192,0.010,0.148,0.025,0.083,0.000,0.000,0.000,0.001,0.001,0.003,0.0117,0.0247,0.0063,1.347,1.438,0.159,0.103,2.569,0.915,0.292,0.297,-0.046,-0.305,0.393,0.530,-0.225,0.501,0.201,0.472,2.489,0.851,0.403,0.376,2.434,1.013,0.261,0.286,1600.000,1600.000,0.753,0.892,0.009,0.077,0.025,0.087,0.001,0.000,0.001,0.001,0.094,0.064,8.5243,4.3905,42.13\r\n' +
  '299981,"003 TL V628-V626",148+0672.75,"61.17816783° N","23.84192550° E",42.124,3.288,1.372,2.272,1.310,0.589,0.337,-0.839,-0.105,-0.420,-0.334,0.348,0.451,-0.727,0.556,-0.252,0.329,0.263,0.553,1.217,1.216,1.350,1.361,0.176,0.113,3.379,1.591,1.958,1.174,0.898,0.586,2.504,1.597,1.936,1.308,0.551,0.293,2411.733,2415.867,2414.399,2416.550,1.802,0.811,0.000,0.192,0.010,0.149,0.025,0.082,0.000,0.000,0.000,0.001,0.001,0.003,0.0117,0.0130,0.0007,1.347,1.438,0.159,0.103,2.569,0.915,0.292,0.297,-0.046,-0.305,0.393,0.530,-0.225,0.501,0.201,0.472,2.489,0.851,0.403,0.376,2.434,1.013,0.261,0.286,1600.000,1600.000,0.753,0.892,0.009,0.077,0.025,0.087,0.001,0.000,0.001,0.001,0.094,0.064,8.5243,4.3905,42.12\r\n' +
  '299982,"003 TL V628-V626",148+0673.00,"61.17816872° N","23.84192123° E",42.134,3.288,1.372,2.270,1.311,0.589,0.336,-0.839,-0.105,-0.422,-0.337,0.347,0.456,-0.727,0.556,-0.252,0.331,0.263,0.554,1.217,1.216,1.350,1.360,0.176,0.113,3.379,1.591,1.954,1.172,0.899,0.589,2.504,1.597,1.933,1.308,0.551,0.292,2411.733,2415.867,2414.408,2416.548,1.805,0.808,0.000,0.192,0.010,0.149,0.025,0.082,0.000,0.000,0.000,0.001,0.001,0.003,0.0115,0.0117,0.0002,1.347,1.438,0.159,0.103,2.569,0.915,0.292,0.297,-0.046,-0.305,0.393,0.530,-0.225,0.501,0.201,0.472,2.489,0.851,0.403,0.376,2.434,1.013,0.261,0.286,1600.000,1600.000,0.753,0.892,0.009,0.077,0.025,0.087,0.001,0.000,0.001,0.001,0.094,0.064,8.5243,4.3905,42.13\r\n' +
  '299983,"003 TL V628-V626",148+0673.25,"61.17816957° N","23.84191696° E",42.138,3.288,1.372,2.268,1.313,0.589,0.334,-0.839,-0.105,-0.424,-0.340,0.345,0.461,-0.727,0.556,-0.253,0.332,0.264,0.556,1.217,1.216,1.350,1.360,0.176,0.114,3.379,1.591,1.951,1.171,0.901,0.592,2.504,1.597,1.930,1.309,0.551,0.291,2411.733,2415.867,2414.417,2416.546,1.807,0.806,0.000,0.192,0.010,0.150,0.025,0.082,0.000,0.000,0.000,0.001,0.001,0.003,0.0114,0.0117,0.0001,1.347,1.438,0.159,0.103,2.569,0.915,0.292,0.297,-0.046,-0.305,0.393,0.530,-0.225,0.501,0.201,0.472,2.489,0.851,0.403,0.376,2.434,1.013,0.261,0.286,1600.000,1600.000,0.753,0.892,0.009,0.077,0.025,0.087,0.001,0.000,0.001,0.001,0.094,0.064,8.5243,4.3905,42.14\r\n' +
  '299984,"003 TL V628-V626",148+0673.50,"61.17817043° N","23.84191269° E",42.148,3.288,1.372,2.267,1.314,0.589,0.333,-0.839,-0.105,-0.426,-0.342,0.344,0.467,-0.727,0.556,-0.254,0.333,0.264,0.558,1.217,1.216,1.350,1.359,0.176,0.114,3.379,1.591,1.947,1.169,0.903,0.595,2.504,1.597,1.927,1.309,0.551,0.291,2411.733,2415.867,2414.426,2416.544,1.810,0.803,0.000,0.192,0.010,0.150,0.025,0.082,0.000,0.000,0.000,0.001,0.001,0.003,0.0115,0.0115,0.0003,1.347,1.438,0.159,0.103,2.569,0.915,0.292,0.297,-0.046,-0.305,0.393,0.530,-0.225,0.501,0.201,0.472,2.489,0.851,0.403,0.376,2.434,1.013,0.261,0.286,1600.000,1600.000,0.753,0.892,0.009,0.077,0.025,0.087,0.001,0.000,0.001,0.001,0.094,0.064,8.5243,4.3905,42.15';

const rcCsv: string =
  '"Running Date","22/11/2022 7:44:40 AM"\r\n' +
  '"SSCount","Track","Location [km+m]","Latitude","Longitude","Ajonopeus [Km/h]","Rail Corrugation.Oikea Raiteen Aallon RMS [10-30]mm [µm]","Rail Corrugation.Vasen Raiteen Aallon RMS [10-30]mm [µm]","Rail Corrugation.Oikea Raiteen Aallon RMS [30-100]mm [µm]","Rail Corrugation.Vasen Raiteen Aallon RMS [30-100]mm [µm]","Rail Corrugation.Oikea Raiteen Aallon RMS [100-300]mm [µm]","Rail Corrugation.Vasen Raiteen Aallon RMS [100-300]mm [µm]","Rail Corrugation.Oikea Raiteen Aallon RMS [300-1000]mm [µm]","Rail Corrugation.Vasen Raiteen Aallon RMS [300-1000]mm [µm]","Rail Corrugation.Oikea Raiteen Aallon RMS [10-30]mm Keskiarvo [µm]","Rail Corrugation.Vasen Raiteen Aallon RMS [10-30]mm Keskiarvo [µm]","Rail Corrugation.Oikea Raiteen Aallon RMS [30-100]mm Keskiarvo [µm]","Rail Corrugation.Vasen Raiteen Aallon RMS [30-100]mm Keskiarvo [µm]","Rail Corrugation.Oikea Raiteen Aallon RMS [100-300]mm Keskiarvo [µm]","Rail Corrugation.Vasen Raiteen Aallon RMS [100-300]mm Keskiarvo [µm]","Rail Corrugation.Oikea Raiteen Aallon RMS [300-1000]mm Keskiarvo [µm]","Rail Corrugation.Vasen Raiteen Aallon RMS [300-1000]mm Keskiarvo [µm]","Rail Corrugation.Oikea Raiteen Aallon RMS [10-30]mm Keskihajonta [µm]","Rail Corrugation.Vasen Raiteen Aallon RMS [10-30]mm Keskihajonta [µm]","Rail Corrugation.Oikea Raiteen Aallon RMS [30-100]mm Keskihajonta [µm]","Rail Corrugation.Vasen Raiteen Aallon RMS [30-100]mm Keskihajonta [µm]","Rail Corrugation.Oikea Raiteen Aallon RMS [10-300]mm Keskihajonta [µm]","Rail Corrugation.Vasen Raiteen Aallon RMS [100-300]mm Keskihajonta [µm]","Rail Corrugation.Oikea Raiteen Aallon RMS [300-1000]mm Keskihajonta [µm]","Rail Corrugation.Vasen Raiteen Aallon RMS [300-1000] Keskihajonta [µm]","Rail Corrugation.Vasen Raiteen AallonRMS[10-30]mm Kiinteä Keskiarvo [µm]","Rail Corrugation.Oikea Raiteen AallonRMS[10-30]mm Kiinteä Keskiarvo [µm]","Rail Corrugation.Vasen Raiteen AallonRMS[10-30]mm Kiinteä Keskihaj [µm]","Rail Corrugation.Oikea Raiteen AallonRMS[10-30]mm Kiinteä Keskihaj [µm]","Rail Corrugation.Vasen Raiteen AallonRMS[30-100]mm Kiinteä Keskiarv [µm]","Rail Corrugation.Oikea Raiteen AallonRMS[30-100]mm Kiinteä Keskiarv [µm]","Rail Corrugation.Vasen Raiteen AallonRMS[30-100]mm Kiinteä Keskihaj [µm]","Rail Corrugation.Oikea Raiteen AallonRMS[30-100]mm Kiinteä Keskihaj [µm]","Rail Corrugation.Vasen Raiteen AallonRMS[100-300]mm Kiinteä Keskiar [µm]","Rail Corrugation.Oikea Raiteen AallonRMS[100-300]mm Kiinteä Keskiar [µm]","Rail Corrugation.Vasen Raiteen AallonRMS[100-300]mm Kiinteä Keskiha [µm]","Rail Corrugation.Oikea Raiteen AallonRMS[100-300]mm Kiinteä Keskiha [µm]","Rail Corrugation.Vasen Raiteen AallonRMS[300-1000]mm Kiinteä Keskia [µm]","Rail Corrugation.Oikea Raiteen AallonRMS[300-1000]mm Kiinteä Keskia [µm]","Rail Corrugation.Vasen Raiteen AallonRMS[300-1000]mm Kiinteä Keskih [µm]","Rail Corrugation.Oikea Raiteen AallonRMS[300-1000]mm Kiinteä Keskih [µm]"\r\n' +
  '3602,"008 KHG V911-V913",622+0896.00,"64.02422615° N","24.43978963° E",32.712,0.5800,3.5200,2.0000,6.4600,3.3000,5.8800,13.8200,10.0800,1.6353,1.2886,4.7452,2.7071,11.4934,2.0446,35.6436,10.0213,3.1258,0.8097,10.4332,1.4532,20.0564,1.2318,33.3636,6.9853,1.106,2.001,0.648,3.619,2.183,6.273,1.117,12.643,1.617,19.589,0.963,37.283,9.916,64.646,5.325,73.667\r\n' +
  '3603,"008 KHG V911-V913",622+0895.75,"64.02422459° N","24.43978596° E",32.717,0.5800,3.5200,2.0000,6.4600,3.3000,5.8800,13.8200,10.0800,1.6356,1.2893,4.7466,2.7029,11.4979,2.0463,35.7666,10.0476,3.1258,0.8094,10.4329,1.4557,20.0556,1.2308,33.3447,6.9900,1.106,2.001,0.648,3.619,2.183,6.273,1.117,12.643,1.617,19.589,0.963,37.283,9.916,64.646,5.325,73.667\r\n' +
  '3604,"008 KHG V911-V913",622+0895.50,"64.02422303° N","24.43978229° E",32.718,0.0800,3.4800,1.7800,5.6000,3.2800,5.0000,11.3400,10.3400,1.6378,1.2886,4.7466,2.7026,11.4972,2.0472,35.9002,10.0751,3.1252,0.8098,10.4329,1.4559,20.0557,1.2302,33.3321,6.9956,1.106,2.001,0.648,3.619,2.183,6.273,1.117,12.643,1.617,19.589,0.963,37.283,9.916,64.646,5.325,73.667\r\n' +
  '3605,"008 KHG V911-V913",622+0895.25,"64.02422147° N","24.43977862° E",32.715,0.0800,3.4800,1.7800,5.6000,3.2800,5.0000,11.3400,10.3400,1.6400,1.2879,4.7466,2.7024,11.4966,2.0481,36.0337,10.1026,3.1247,0.8102,10.4329,1.4560,20.0559,1.2295,33.3191,7.0012,1.106,2.001,0.648,3.619,2.183,6.273,1.117,12.643,1.617,19.589,0.963,37.283,9.916,64.646,5.325,73.667\r\n' +
  '3606,"008 KHG V911-V913",622+0895.00,"64.02421992° N","24.43977495° E",32.709,0.9200,2.1400,1.3800,3.2000,3.1600,4.9600,9.3000,10.0000,1.6398,1.2875,4.7463,2.7025,11.4923,2.0481,36.1791,10.1315,3.1248,0.8103,10.4330,1.4560,20.0570,1.2295,33.3146,7.0057,1.106,2.001,0.648,3.619,2.183,6.273,1.117,12.643,1.617,19.589,0.963,37.283,9.916,64.646,5.325,73.667\r\n' +
  '3607,"008 KHG V911-V913",622+0894.75,"64.02421836° N","24.43977128° E",32.706,0.9200,2.1400,1.3800,3.2000,3.1600,4.9600,9.3000,10.0000,1.6395,1.2872,4.7461,2.7025,11.4881,2.0481,36.3245,10.1605,3.1249,0.8105,10.4331,1.4560,20.0582,1.2295,33.3094,7.0101,1.106,2.001,0.648,3.619,2.183,6.273,1.117,12.643,1.617,19.589,0.963,37.283,9.916,64.646,5.325,73.667\r\n' +
  '3608,"008 KHG V911-V913",622+0894.50,"64.02421680° N","24.43976761° E",32.699,0.6800,1.8400,1.9400,3.8200,4.5200,3.4000,9.0000,10.0000,1.6402,1.2888,4.7461,2.7023,11.4841,2.0505,36.4830,10.1890,3.1248,0.8097,10.4331,1.4561,20.0592,1.2284,33.3157,7.0147,1.106,2.001,0.648,3.619,2.183,6.273,1.117,12.643,1.617,19.589,0.963,37.283,9.916,64.646,5.325,73.667\r\n' +
  '3609,"008 KHG V911-V913",622+0894.25,"64.02421524° N","24.43976394° E",32.694,0.6800,1.8400,1.9400,3.8200,4.5200,3.4000,9.0000,10.0000,1.6409,1.2904,4.7461,2.7022,11.4802,2.0529,36.6416,10.2175,3.1247,0.8090,10.4331,1.4561,20.0603,1.2273,33.3212,7.0192,1.106,2.001,0.648,3.619,2.183,6.273,1.117,12.643,1.617,19.589,0.963,37.283,9.916,64.646,5.325,73.667\r\n' +
  '3610,"008 KHG V911-V913",622+0894.00,"64.02421368° N","24.43976023° E",32.688,0.3000,2.5200,1.8000,5.7200,5.0000,4.0000,8.6000,10.5000,1.6423,1.2905,4.7471,2.7014,11.4787,2.0565,36.8175,10.2466,3.1244,0.8090,10.4328,1.4564,20.0606,1.2263,33.3447,7.0231,1.106,2.001,0.648,3.619,2.183,6.273,1.117,12.643,1.617,19.589,0.963,37.283,9.916,64.646,5.325,73.667\r\n' +
  '3611,"008 KHG V911-V913",622+0893.75,"64.02421212° N","24.43975651° E",32.693,0.3000,2.5200,1.8000,5.7200,5.0000,4.0000,8.6000,10.5000,1.6437,1.2906,4.7481,2.7006,11.4771,2.0601,36.9934,10.2758,3.1241,0.8089,10.4324,1.4567,20.0610,1.2253,33.3673,7.0269,1.106,2.001,0.648,3.619,2.183,6.273,1.117,12.643,1.617,19.589,0.963,37.283,9.916,64.646,5.325,73.667\r\n' +
  '3612,"008 KHG V911-V913",622+0893.50,"64.02421056° N","24.43975279° E",32.685,0.1600,1.6600,2.0000,6.8800,5.5400,3.3000,9.2600,14.2000,1.6463,1.2914,4.7488,2.7001,11.4790,2.0651,37.1931,10.3058,3.1231,0.8091,10.4323,1.4567,20.0606,1.2251,33.4203,7.0299,1.106,2.001,0.648,3.619,2.183,6.273,1.117,12.643,1.617,19.589,0.963,37.283,9.916,64.646,5.325,73.667\r\n' +
  '3613,"008 KHG V911-V913",622+0893.25,"64.02420900° N","24.43974910° E",32.681,0.1600,1.6600,2.0000,6.8800,5.5400,3.3000,9.2600,14.2000,1.6489,1.2922,4.7495,2.6996,11.4810,2.0701,37.3928,10.3358,3.1222,0.8093,10.4321,1.4567,20.0602,1.2248,33.4721,7.0328,1.106,2.001,0.648,3.619,2.183,6.273,1.117,12.643,1.617,19.589,0.963,37.283,9.916,64.646,5.325,73.667\r\n' +
  '3614,"008 KHG V911-V913",622+0893.00,"64.02420744° N","24.43974542° E",32.682,0.6000,4.1400,2.0000,7.3400,4.9000,3.0000,11.5000,15.3000,1.6520,1.2923,4.7477,2.7011,11.4895,2.0738,37.6373,10.3658,3.1216,0.8093,10.4325,1.4561,20.0588,1.2238,33.5992,7.0356,1.106,2.001,0.648,3.619,2.183,6.273,1.117,12.643,1.617,19.589,0.963,37.283,9.916,64.646,5.325,73.667';

const piCsv: string =
  '"Running Date","22/11/2022 7:44:40 AM"\r\n' +
  '"SSCount","Track","Location [km+m]","Latitude","Longitude","Ajonopeus [Km/h]","Pantograph/Catenary Interaction.AccZ 1.1 [m/s^2]","Pantograph/Catenary Interaction.AccZ 1.2 [m/s^2]","Pantograph/Catenary Interaction.AccZ 2.1 [m/s^2]","Pantograph/Catenary Interaction.AccZ 2.2 [m/s^2]","Pantograph/Catenary Interaction.F 1.1 [N]","Pantograph/Catenary Interaction.F 1.2 [N]","Pantograph/Catenary Interaction.F 2.1 [N]","Pantograph/Catenary Interaction.F 2.2 [N]","Pantograph/Catenary Interaction.FInt [N]","Pantograph/Catenary Interaction.FComp [N]","Pantograph/Catenary Interaction.FExt [N]","Pantograph/Catenary Interaction.Stagger [mm]","Pantograph/Catenary Interaction.Height WS [mm]"\r\n' +
  '242348,"006 LHRP 1",130+0500.00,"60.97626774° N","25.66358446° E",42.897,0.3274,0.8127,-0.1709,0.6935,11.7668,28.0949,18.9888,18.7523,39.7417,75.4279,37.7411,122,2735\r\n' +
  '242349,"006 LHRP 1",130+0499.75,"60.97626803° N","25.66357989° E",42.906,0.3955,-0.4331,0.6089,0.8052,11.6976,28.1539,19.7476,20.0664,39.8515,77.1193,39.8140,114,2735\r\n' +
  '242350,"006 LHRP 1",130+0499.50,"60.97626831° N","25.66357530° E",42.912,0.3910,0.7564,0.7145,0.4417,12.5091,28.3903,20.3911,20.1408,40.8995,79.1892,40.4391,111,2735\r\n' +
  '242351,"006 LHRP 1",130+0499.25,"60.97626859° N","25.66357072° E",42.911,-0.4304,0.7583,-0.6698,0.3635,12.7121,29.0062,21.5986,20.7427,41.6554,85.0721,42.3413,117,2734\r\n' +
  '242352,"006 LHRP 1",130+0499.00,"60.97626887° N","25.66356614° E",42.908,-0.3951,-0.6374,-0.4570,-0.8177,12.5395,28.7299,22.3933,21.0537,41.2693,85.3529,43.2952,136,2734\r\n' +
  '242353,"006 LHRP 1",130+0498.75,"60.97626915° N","25.66356155° E",42.911,0.1839,0.4531,-0.7043,-1.3113,12.1043,29.0598,18.3063,20.9654,41.1641,80.9532,38.0618,150,2733\r\n' +
  '242354,"006 LHRP 1",130+0498.50,"60.97626947° N","25.66355697° E",42.913,-0.6655,-1.3723,-0.7893,0.8571,12.1383,29.1574,19.3638,20.7951,41.2923,82.3805,39.8427,123,2732\r\n' +
  '242355,"006 LHRP 1",130+0498.25,"60.97626978° N","25.66355239° E",42.907,-0.6662,-1.3649,-0.4840,-1.0772,11.9792,27.5697,18.9833,21.4185,39.4958,82.3466,39.8901,126,2734\r\n' +
  '242356,"006 LHRP 1",130+0498.00,"60.97627010° N","25.66354782° E",42.902,-0.7892,0.6947,-0.4878,-1.0791,12.0322,27.5101,18.1227,21.0608,39.4027,80.5706,39.0638,132,2732\r\n' +
  '242357,"006 LHRP 1",130+0497.75,"60.97627041° N","25.66354324° E",42.888,-0.7099,-1.0953,-0.5387,-0.6233,11.8390,27.8167,17.0836,20.8829,39.4051,79.2862,37.4875,157,2734\r\n' +
  '242358,"006 LHRP 1",130+0497.50,"60.97627072° N","25.66353866° E",42.901,0.2183,-0.9671,-0.6716,-0.7345,10.9927,27.3654,15.2601,21.2080,38.3581,77.8599,36.0379,188,2735\r\n' +
  '242359,"006 LHRP 1",130+0497.25,"60.97627100° N","25.66353408° E",42.897,-0.5172,-0.9165,-0.6338,0.6894,11.0836,26.4350,19.1210,21.5321,37.1888,78.9756,40.5709,181,2735\r\n' +
  '242360,"006 LHRP 1",130+0497.00,"60.97627128° N","25.66352950° E",42.899,-0.4389,-0.9661,0.6160,-1.0279,10.9332,26.1537,18.9262,21.4080,36.8090,78.8003,40.3343,171,2735\r\n' +
  '242361,"006 LHRP 1",130+0496.75,"60.97627156° N","25.66352492° E",42.899,-0.3367,-0.6233,-0.6442,-0.7890,10.6632,26.2197,15.0933,21.1805,36.8256,73.6705,35.6858,172,2735';

const ohlCsv: string =
  '"Running Date","22/11/2022 7:44:40 AM"\r\n' +
  '"SSCount","Track","Location [km+m]","Latitude","Longitude","Ajonopeus [Km/h]","Over Head Line Geometry and Wear.Siksak 1 [mm]","Over Head Line Geometry and Wear.Siksak 2 [mm]","Over Head Line Geometry and Wear.Korkeus 1 [mm]","Over Head Line Geometry and Wear.Korkeus 2 [mm]","Over Head Line Geometry and Wear.Jäännöspaksuus 1 [mm]","Over Head Line Geometry and Wear.Jäännöspaksuus 2 [mm]","Over Head Line Geometry and Wear.Risteävien Ajolankojen Etäisyys [mm]","Over Head Line Geometry and Wear.Height Gradient [mm/m]","Over Head Line Geometry and Wear.Pinnan Leveys 1 [mm]","Over Head Line Geometry and Wear.Pinnan Leveys 2 [mm]","Over Head Line Geometry and Wear.Pinnan Leveyden Keskiarvo 1 [mm]","Over Head Line Geometry and Wear.Pinnan Leveyden Keskiarvo 2 [mm]","Over Head Line Geometry and Wear.Pinnan Leveyden Keskihajonta 1 [mm]","Over Head Line Geometry and Wear.Pinnan Leveyden Keskihajonta 2 [mm]","Over Head Line Geometry and Wear.Jäännöspinta-ala 1 [mm^2]","Over Head Line Geometry and Wear.Jäännöspinta-ala 2 [mm^2]","Over Head Line Geometry and Wear.Jäännöspinta-alan Keskiarvo 1 [mm^2]","Over Head Line Geometry and Wear.Jäännöspinta-alan Keskiarvo 2 [mm^2]","Over Head Line Geometry and Wear.Residual Area StdDev 1 [mm^2]","Over Head Line Geometry and Wear.Residual Area StdDev 2 [mm^2]","Over Head Line Geometry and Wear.Pole","Over Head Line Geometry and Wear.Korkeuden Poikkeama [mm]","Over Head Line Geometry and Wear.Siksakkin Poikkeama [mm]","Over Head Line Geometry and Wear.Pituuskaltevuus [mm/m]","Over Head Line Geometry and Wear.Ajonopeus [Km/h]","Over Head Line Geometry and Wear.Right Wire Wear 2 [mm]","Over Head Line Geometry and Wear.Stagger Box_OHL [mm]","Over Head Line Geometry and Wear.Height Box_OHL [mm]"\r\n' +
  '25517,"006 KVRP 847",194+0418.00,"60.86960023° N","26.75759324° E",32.731,-56.26,,6198.96,,9.84,,0.00,0.20,5.45,,5.24,,0.21,,77.21,,0.31,,77.54,,0.0000,,,,33,,-20.10,2016.15\r\n' +
  '25518,"006 KVRP 847",194+0417.75,"60.86959982° N","26.75758871° E",32.738,-57.17,,6199.19,,9.86,,0.00,0.20,5.41,,5.23,,0.21,,77.28,,0.31,,77.54,,0.0000,,,,33,,-19.93,2016.42\r\n' +
  '25519,"006 KVRP 847",194+0417.50,"60.86959938° N","26.75758420° E",32.728,-55.77,,6198.35,,9.85,,0.00,0.20,5.44,,5.24,,0.21,,77.23,,0.31,,77.54,,0.0000,,,,33,,-18.15,2015.61\r\n' +
  '25520,"006 KVRP 847",194+0417.25,"60.86959892° N","26.75757971° E",32.730,-56.39,,6200.31,,9.83,,0.00,0.20,5.50,,5.24,,0.21,,77.13,,0.30,,77.53,,0.0000,,,,33,,-18.42,2017.71\r\n' +
  '25521,"006 KVRP 847",194+0417.00,"60.86959847° N","26.75757523° E",32.741,-56.33,,6201.18,,9.83,,0.00,0.20,5.51,,5.24,,0.20,,77.11,,0.30,,77.53,,0.0000,,,,33,,-18.06,2018.83\r\n' +
  '25522,"006 KVRP 847",194+0416.75,"60.86959801° N","26.75757074° E",32.752,-56.31,,6200.56,,9.85,,0.00,0.20,5.42,,5.24,,0.21,,77.26,,0.31,,77.54,,0.0000,,,,33,,-17.96,2018.56\r\n' +
  '25523,"006 KVRP 847",194+0416.50,"60.86959759° N","26.75756620° E",32.749,-56.38,,6202.64,,9.89,,0.00,0.20,5.30,,5.23,,0.23,,77.46,,0.33,,77.54,,0.0000,,,,33,,-18.08,2020.96\r\n' +
  '25524,"006 KVRP 847",194+0416.25,"60.86959718° N","26.75756166° E",32.740,-56.89,,6200.95,,9.89,,0.00,0.20,5.28,,5.22,,0.25,,77.48,,0.35,,77.55,,0.0000,,,,33,,-18.83,2019.58\r\n' +
  '25525,"006 KVRP 847",194+0416.00,"60.86959677° N","26.75755713° E",32.743,-56.46,,6205.61,,9.87,,0.00,0.20,5.35,,5.21,,0.27,,77.37,,0.37,,77.57,,0.0000,,,,33,,-18.69,2024.56\r\n' +
  '25526,"006 KVRP 847",194+0415.75,"60.86959634° N","26.75755259° E",32.751,-55.99,,6207.10,,9.86,,0.00,0.20,5.40,,5.20,,0.28,,77.30,,0.39,,77.58,,0.0000,,,,33,,-18.72,2026.36\r\n' +
  '25527,"006 KVRP 847",194+0415.50,"60.86959588° N","26.75754806° E",32.765,-56.12,,6203.99,,9.86,,0.00,0.20,5.39,,5.19,,0.30,,77.32,,0.40,,77.59,,0.0000,,,,33,,-19.43,2023.57\r\n' +
  '25528,"006 KVRP 847",194+0415.25,"60.86959542° N","26.75754352° E",32.763,-56.67,,6206.22,,9.84,,0.00,0.20,5.45,,5.18,,0.32,,77.21,,0.43,,77.60,,0.0000,,,,33,,-20.55,2026.14\r\n' +
  '25529,"006 KVRP 847",194+0415.00,"60.86959497° N","26.75753899° E",32.765,-55.91,,6204.75,,9.89,,0.00,0.20,5.31,,5.17,,0.34,,77.43,,0.45,,77.62,,0.0000,,,,33,,-20.48,2025.01';

describe('insert raportti success', () => {
  test('success: normal run', async () => {
    // const result = await insertRaporttiData('hello', 'ams', {});
  });
});

describe('handle ams file success', () => {
  test('success: normal run', async () => {
    const result = await parseCSVFile(
      'AMS_20221122_008_KOKOL_LR_630_630.csv',
      { contentType: 'csv', fileBody: amsCsv, tags: {} },
      {},
    );
  });
});

describe('handle ams file error', () => {
  test('success: normal run', async () => {
    const result = await parseCSVFile(
      'AMS_20231122_008_KOKOL_LR_630_630.csv',
      { contentType: 'csv', fileBody: amsCsvError, tags: {} },
      {},
    );
  });
});

describe('handle ohl file success', () => {
  test('success: normal run', async () => {
    const result = await parseCSVFile(
      'OHL_20221003_006_KVRP_847_193_194.csv',
      { contentType: 'csv', fileBody: ohlCsv, tags: {} },
      {},
    );
  });
});

describe('handle pi file success', () => {
  test('success: normal run', async () => {
    const result = await parseCSVFile(
      'PI_20221125_006_LHRP_1_130_130.csv',
      { contentType: 'csv', fileBody: piCsv, tags: {} },
      {},
    );
  });
});

describe('handle rc file success', () => {
  test('success: normal run', async () => {
    const result = await parseCSVFile(
      'RC_20221022_008_KHG_V911-V913_622_622.csv',
      { contentType: 'csv', fileBody: rcCsv, tags: {} },
      {},
    );
  });
});

describe('handle rp file success', () => {
  test('success: normal run', async () => {
    const result = await parseCSVFile(
      'RP_20220704_003_TL_V628-V626_148_148.csv',
      { contentType: 'csv', fileBody: rpCsv, tags: {} },
      {},
    );
  });
});

describe('handle tg file success', () => {
  test('success: normal run', async () => {
    const result = await parseCSVFile(
      'TG_20221129_006_LHRP_2_130_130.csv',
      { contentType: 'csv', fileBody: tgCsv, tags: {} },
      {},
    );
  });
});

describe('handle tsight file success', () => {
  test('success: normal run', async () => {
    const result = await parseCSVFile(
      'TSIGHT_20221010_003_KRRRP_253_224_225.csv',
      { contentType: 'csv', fileBody: tsightCsv, tags: {} },
      {},
    );
  });
});

/*describe('parseAMSCSV success', () => {
  test('success: normal run', async () => {
    const result = await parseCSVFile(amsCsv, 3, "ams_mittaus", amsSchema);
    expect(result.success).toBe(true);
    expect(result.header[6]).toBe('oikea_pystysuuntainen_kiihtyvyys_c1');
    expect(result.validRows[5].oikea_poikittainen_kiihtyvyys_c1).toBe(3.0163);
    expect(result.validRows.length).toBe(6);
    expect(result.allRows.length).toBe(6);
  });
});*/

/*describe('parseAMSCSV error', () => {
  test('success: error run', async () => {
    const result = await parseAMSCSVData(amsCsvError);
    expect(result.success).toBe(false);
    if (!(result.success)) {
      expect(result.errors.header?.errorCode).toBe("MISSING_COLUMN");
    }
    expect(result.validRows.length).toBe(0);
    expect(result.allRows.length).toBe(1);
  });
});*/
