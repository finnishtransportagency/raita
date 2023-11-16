import {zcsv} from "zod-csv";
import {z} from "zod";

const schema = z.object({
    SSCount: zcsv.string(z.string().min(3)),
    age: zcsv.number(),
})

'"SSCount","Track","Location [km+m]","Latitude","Longitude","Ajonopeus [Km/h]","Running Dynamics.Oikea Pystysuuntainen Kiihtyvyys C1 [m/s^2]","Running Dynamics.Vasen Pystysuuntainen Kiihtyvyys C1 [m/s^2]","Running Dynamics.Oikea Pystysuuntainen Kiihtyvyys C1 Suodatettu [m/s^2]","Running Dynamics.Vasen Pystysuuntainen Kiihtyvyys C1 Suodatettu [m/s^2]","Running Dynamics.Oikea Pystysuuntainen Kiihtyvyys C1 Keskihajonta [m/s^2]","Running Dynamics.Vasen Pystysuuntainen Kiihtyvyys C1 Keskihajonta [m/s^2]","Running Dynamics.Oikea Poikittainen Kiihtyvyys C1 [m/s^2]","Running Dynamics.Vasen Poikittainen Kiihtyvyys C1 [m/s^2]","Running Dynamics.Oikea Poikittainen Kiihtyvyys C1 Suodatettu [m/s^2]","Running Dynamics.Vasen Poikittainen Kiihtyvyys C1 Suodatettu [m/s^2]","Running Dynamics.Oikea Poikittainen Kiihtyvyys C1 Keskihajonta [m/s^2]","Running Dynamics.Vasen Poikittainen Kiihtyvyys C1 Keskihajonta [m/s^2]","Running Dynamics.Pystysuuntainen Kiihtyvyys C2 [m/s^2]","Running Dynamics.Pystysuuntainen Kiihtyvyys C2 Suodatettu [m/s^2]","Running Dynamics.Poikittainen Kiihtyvyys C2 [m/s^2]","Running Dynamics.Poikittainen Kiihtyvyys C2 Suodatettu [m/s^2]","Running Dynamics.Transversal Acceleration C2 Mean-to-Peak [m/s^2]","Running Dynamics.Pystysuuntainen Kiihtyvyys C3 [m/s^2]","Running Dynamics.Pystysuuntainen Kiihtyvyys C3 Suodatettu [m/s^2]","Running Dynamics.Poikittainen Kiihtyvyys C3 [m/s^2]","Running Dynamics.Poikittainen Kiihtyvyys C3 Suodatettu [m/s^2]","Running Dynamics.Transversal Acceleration C3 Mean-to-Peak [m/s^2]","Running Dynamics.Ajonopeus [Km/h]"\n' +
'318103,"008 KOKOL LR",630+0850.00,"64.07646857° N","24.54062901° E",55.985,-21.7708,26.3496,14.6794,14.1478,8.1315,8.0237,-4.1229,-6.3282,3.1816,-3.5781,1.3801,1.7761,2.2629,2.1137,-4.7717,-2.7778,-1.3045,1.3953,0.5937,1.2821,0.5037,0.3869,56\n' +



    ss_count integer NOT NULL,
    rataosoite rataosoite,
    sijainti geography(point),
    ajonopeus decimal -- ajonopeus

oikea_pystysuuntainen_kiihtyvyys_c1 decimal,                    -- Running Dynamics.Oikea Pystysuuntainen Kiihtyvyys C1 [m/s^2]
vasen_pystysuuntainen_kiihtyvyys_c1 decimal,                    -- Running Dynamics.Vasen Pystysuuntainen Kiihtyvyys C1 [m/s^2]
oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu decimal,         -- Running Dynamics.Oikea Pystysuuntainen Kiihtyvyys C1 Suodatettu [m/s^2]
vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu decimal,         -- Running Dynamics.Vasen Pystysuuntainen Kiihtyvyys C1 Suodatettu [m/s^2]
oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta decimal,       -- Running Dynamics.Oikea Pystysuuntainen Kiihtyvyys C1 Keskihajonta [m/s^2]
vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta decimal,       -- Running Dynamics.Vasen Pystysuuntainen Kiihtyvyys C1 Keskihajonta [m/s^2]
oikea_poikittainen_kiihtyvyys_c1 decimal,                       -- Running Dynamics.Oikea Poikittainen Kiihtyvyys C1 [m/s^2]
vasen_poikittainen_kiihtyvyys_c1 decimal,                       -- Running Dynamics.Vasen Poikittainen Kiihtyvyys C1 [m/s^2]
oikea_poikittainen_kiihtyvyys_c1_suodatettu decimal,            -- Running Dynamics.Oikea Poikittainen Kiihtyvyys C1 Suodatettu [m/s^2]
vasen_poikittainen_kiihtyvyys_c1_suodatettu decimal,            -- Running Dynamics.Vasen Poikittainen Kiihtyvyys C1 Suodatettu [m/s^2]
oikea_poikittainen_kiihtyvyys_c1_keskihajonta decimal,          -- Running Dynamics.Oikea Poikittainen Kiihtyvyys C1 Keskihajonta [m/s^2]
vasen_poikittainen_kiihtyvyys_c1_keskihajonta decimal,          -- Running Dynamics.Vasen Poikittainen Kiihtyvyys C1 Keskihajonta [m/s^2]
pystysuuntainen_kiihtyvyys_c2 decimal,                          -- Running Dynamics.Pystysuuntainen Kiihtyvyys C2 [m/s^2]
pystysuuntainen_kiihtyvyys_c2_suodatettu decimal,               -- Running Dynamics.Pystysuuntainen Kiihtyvyys C2 Suodatettu [m/s^2]
poikittainen_kiihtyvyys_c2 decimal,                             -- Running Dynamics.Poikittainen Kiihtyvyys C2 [m/s^2]
poikittainen_kiihtyvyys_c2_suodatettu decimal,                  -- Running Dynamics.Poikittainen Kiihtyvyys C2 Suodatettu [m/s^2]
transversal_acceleration_c2_mean_to_peak decimal,               -- Running Dynamics.Transversal Acceleration C2 Mean-to-Peak [m/s^2]
pystysuuntainen_kiihtyvyys_c3 decimal,                          -- Running Dynamics.Pystysuuntainen Kiihtyvyys C3 [m/s^2]
pystysuuntainen_kiihtyvyys_c3_suodatettu decimal,               -- Running Dynamics.Pystysuuntainen Kiihtyvyys C3 Suodatettu [m/s^2]
poikittainen_kiihtyvyys_c3 decimal,                             -- Running Dynamics.Poikittainen Kiihtyvyys C3 [m/s^2]
poikittainen_kiihtyvyys_c3_suodatettu decimal,                  -- Running Dynamics.Poikittainen Kiihtyvyys C3 Suodatettu [m/s^2]
transversal_acceleration_c3_mean_to_peak decimal,               -- Running Dynamics.Transversal Acceleration C3 Mean-to-Peak [m/s^2]
ams_ajonopeus integer                                           --Running Dynamics.Ajonopeus [Km/h]
