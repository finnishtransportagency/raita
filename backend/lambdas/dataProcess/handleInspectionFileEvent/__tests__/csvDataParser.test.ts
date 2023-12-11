import { parseAMSCSVData } from '../csvDataParser/amsCsvDataParser';
import {insertRaporttiData, parseCSVData} from "../csvDataParser/csvDataParser";
import {undefined} from "zod";

const amsCsv =
  '"Running Date","22/11/2022 7:44:40 AM"\n' +
  '"SSCount","Track","Location [km+m]","Latitude","Longitude","Ajonopeus [Km/h]","Running Dynamics.Oikea Pystysuuntainen Kiihtyvyys C1 [m/s^2]","Running Dynamics.Vasen Pystysuuntainen Kiihtyvyys C1 [m/s^2]","Running Dynamics.Oikea Pystysuuntainen Kiihtyvyys C1 Suodatettu [m/s^2]","Running Dynamics.Vasen Pystysuuntainen Kiihtyvyys C1 Suodatettu [m/s^2]","Running Dynamics.Oikea Pystysuuntainen Kiihtyvyys C1 Keskihajonta [m/s^2]","Running Dynamics.Vasen Pystysuuntainen Kiihtyvyys C1 Keskihajonta [m/s^2]","Running Dynamics.Oikea Poikittainen Kiihtyvyys C1 [m/s^2]","Running Dynamics.Vasen Poikittainen Kiihtyvyys C1 [m/s^2]","Running Dynamics.Oikea Poikittainen Kiihtyvyys C1 Suodatettu [m/s^2]","Running Dynamics.Vasen Poikittainen Kiihtyvyys C1 Suodatettu [m/s^2]","Running Dynamics.Oikea Poikittainen Kiihtyvyys C1 Keskihajonta [m/s^2]","Running Dynamics.Vasen Poikittainen Kiihtyvyys C1 Keskihajonta [m/s^2]","Running Dynamics.Pystysuuntainen Kiihtyvyys C2 [m/s^2]","Running Dynamics.Pystysuuntainen Kiihtyvyys C2 Suodatettu [m/s^2]","Running Dynamics.Poikittainen Kiihtyvyys C2 [m/s^2]","Running Dynamics.Poikittainen Kiihtyvyys C2 Suodatettu [m/s^2]","Running Dynamics.Transversal Acceleration C2 Mean-to-Peak [m/s^2]","Running Dynamics.Pystysuuntainen Kiihtyvyys C3 [m/s^2]","Running Dynamics.Pystysuuntainen Kiihtyvyys C3 Suodatettu [m/s^2]","Running Dynamics.Poikittainen Kiihtyvyys C3 [m/s^2]","Running Dynamics.Poikittainen Kiihtyvyys C3 Suodatettu [m/s^2]","Running Dynamics.Transversal Acceleration C3 Mean-to-Peak [m/s^2]","Running Dynamics.Ajonopeus [Km/h]"\n' +
  '318103,"008 KOKOL LR",630+0850.00,"64.07646857° N","24.54062901° E",55.985,-21.7708,26.3496,14.6794,14.1478,8.1315,8.0237,-4.1229,-6.3282,3.1816,-3.5781,1.3801,1.7761,2.2629,2.1137,-4.7717,-2.7778,-1.3045,1.3953,0.5937,1.2821,0.5037,0.3869,56\n' +
  '318104,"008 KOKOL LR",630+0850.25,"64.07647082° N","24.54062896° E",55.955,29.2801,29.5273,16.7167,17.0519,8.1699,7.9743,3.8653,-6.4757,2.8971,-4.6735,1.3761,1.7859,2.1084,1.5889,2.7095,-2.0110,-1.0043,1.9055,0.3789,1.4189,0.6535,0.2594,56\n' +
  '318105,"008 KOKOL LR",630+0850.50,"64.07647308° N","24.54062891° E",55.939,-29.2653,23.2646,-26.4762,-14.8906,8.4049,8.0362,4.1007,5.2723,-2.2401,4.5284,1.3860,1.7973,2.4118,2.1124,-2.5522,-1.9687,-1.3425,2.0056,-0.5608,1.6471,0.6996,0.2019,56\n' +
  '318106,"008 KOKOL LR",630+0850.75,"64.07647533° N","24.54062885° E",55.938,-20.9017,-21.8595,13.2977,15.9086,8.4101,8.0505,4.0499,-4.9934,-2.2320,-3.1739,1.3767,1.7917,2.5858,2.0813,2.1109,0.8900,-1.1602,-1.8402,-0.5512,1.3017,0.6939,0.1295,56\n' +
  '318107,"008 KOKOL LR",630+0851.00,"64.07647756° N","24.54062880° E",55.924,-21.2956,21.9569,14.8956,12.2093,8.3666,7.9174,-3.6308,4.0280,2.7983,2.0624,1.3882,1.7930,2.9541,2.8539,-2.6747,-1.8791,-1.2058,1.6617,-0.3302,1.8971,0.8156,0.1039,56\n' +
  '318108,"008 KOKOL LR",630+0851.25,"64.07647979° N","24.54062875° E",55.925,-23.1085,25.8125,-21.9575,-12.1894,8.3251,7.8952,3.0163,-4.6372,2.5206,-2.8624,1.3800,1.8019,3.2062,3.0976,-3.2225,-1.4226,-2.0412,1.6744,-0.3927,2.0022,0.7377,0.0205,56';

const amsCsvError =
  '"Running Date","22/11/2022 7:44:40 AM"\n' +
  '"SSCount","Track","Location [km+m]","Latitude","Longitude","Ajonopeus [Km/h]","Running Dynamics.Vasen Pystysuuntainen Kiihtyvyys C1 [m/s^2]","Running Dynamics.Oikea Pystysuuntainen Kiihtyvyys C1 Suodatettu [m/s^2]","Running Dynamics.Vasen Pystysuuntainen Kiihtyvyys C1 Suodatettu [m/s^2]","Running Dynamics.Oikea Pystysuuntainen Kiihtyvyys C1 Keskihajonta [m/s^2]","Running Dynamics.Vasen Pystysuuntainen Kiihtyvyys C1 Keskihajonta [m/s^2]","Running Dynamics.Oikea Poikittainen Kiihtyvyys C1 [m/s^2]","Running Dynamics.Vasen Poikittainen Kiihtyvyys C1 [m/s^2]","Running Dynamics.Oikea Poikittainen Kiihtyvyys C1 Suodatettu [m/s^2]","Running Dynamics.Vasen Poikittainen Kiihtyvyys C1 Suodatettu [m/s^2]","Running Dynamics.Oikea Poikittainen Kiihtyvyys C1 Keskihajonta [m/s^2]","Running Dynamics.Vasen Poikittainen Kiihtyvyys C1 Keskihajonta [m/s^2]","Running Dynamics.Pystysuuntainen Kiihtyvyys C2 [m/s^2]","Running Dynamics.Pystysuuntainen Kiihtyvyys C2 Suodatettu [m/s^2]","Running Dynamics.Poikittainen Kiihtyvyys C2 [m/s^2]","Running Dynamics.Poikittainen Kiihtyvyys C2 Suodatettu [m/s^2]","Running Dynamics.Transversal Acceleration C2 Mean-to-Peak [m/s^2]","Running Dynamics.Pystysuuntainen Kiihtyvyys C3 [m/s^2]","Running Dynamics.Pystysuuntainen Kiihtyvyys C3 Suodatettu [m/s^2]","Running Dynamics.Poikittainen Kiihtyvyys C3 [m/s^2]","Running Dynamics.Poikittainen Kiihtyvyys C3 Suodatettu [m/s^2]","Running Dynamics.Transversal Acceleration C3 Mean-to-Peak [m/s^2]","Running Dynamics.Ajonopeus [Km/h]"\n' +
  '318103,"008 KOKOL LR",630+0850.00,"64.07646857° N","24.54062901° E",55.985, 26.3496,14.6794,14.1478,8.1315,8.0237,-4.1229,-6.3282,3.1816,-3.5781,1.3801,1.7761,2.2629,2.1137,-4.7717,-2.7778,-1.3045,1.3953,0.5937,1.2821,0.5037,0.3869,56\n';


describe('insert raportti success', () => {
  test('success: normal run', async () => {
    const result = await insertRaporttiData("hello","ams",{});
  });
});

describe('handle ams file success', () => {
  test('success: normal run', async () => {
    const result = await parseCSVData("AMS_20221122_008_KOKOL_LR_630_630.csv", {contentType: "csv", fileBody: amsCsv, tags: {}},{});
  });
});

  describe('parseAMSCSV success', () => {
  test('success: normal run', async () => {
    const result = await parseAMSCSVData(amsCsv, 3);
    expect(result.success).toBe(true);
    expect(result.header[6]).toBe('oikea_pystysuuntainen_kiihtyvyys_c1');
    expect(result.validRows[5].oikea_poikittainen_kiihtyvyys_c1).toBe(3.0163);
    expect(result.validRows.length).toBe(6);
    expect(result.allRows.length).toBe(6);
  });
});

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
