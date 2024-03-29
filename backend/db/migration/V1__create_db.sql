CREATE TYPE jarjestelma AS ENUM ('AMS', 'OHL', 'PI', 'RC', 'RP', 'TG', 'TSIGHT');

CREATE TYPE rataosoite AS (
    rataosuus_numero character varying(40), -- for example '006'
    rataosuus_nimi character varying(40), -- for example 'LHRP'
    raide_numero integer, -- for example 2
    rata_kilometri integer, -- for example 130
    rata_metrit DECIMAL -- for example 100.00
    );

CREATE TABLE raportti(
                                   id integer NOT NULL,
                                   tiedostonimi character varying(40), -- for example 'HL_20210723_009_OVRP_1_226_228.csv'
                                   tiedostotyyppi character varying(40), -- for example 'csv'
                                   tarkastusvaunu character varying(40), -- for example 'Meeri'
                                   zip_vastaanotto_vuosi  timestamp NOT NULL,
                                   zip_vastaanotto_pvm  timestamp NOT NULL,
                                   zip_tiedostonimi character varying(500), -- for example '0210723_TG_AMS_OHL_CW_RC_Report...'
                                   kampanja character varying(200), -- for example 'Summer Campaign_July 2021-02Aug2021'
                                   rataosuus_numero character varying(40), -- for example '006'
                                   raportointiosuus character varying(40), -- for example 'LHRP'
                                   raide_numero integer, -- for example 2
                                   aloitus_rata_kilometri integer, -- for example 130
                                   lopetus_rata_kilometri integer, -- for example 130
                                   jarjestelma jarjestelma, -- for example 'OHL'
                                   tarkastusajon_tunniste character varying(40), -- for example '20221024_170457'
                                   raportin_kategoria character varying(40), -- for example 'TextualReports'
                                   vuosi  timestamp NOT NULL,
                                   pvm  timestamp NOT NULL,
                                   tiedoston_koko_kb decimal
);

ALTER TABLE raportti
    ADD CONSTRAINT raportti_pkey PRIMARY KEY (id);


CREATE TABLE mittaus (
                                   id integer NOT NULL,
                                   raportti_id integer NOT NULL,
                                   running_date timestamp NOT NULL,
                                   jarjestelma jarjestelma,
                                   ss_count integer NOT NULL,
                                   rataosoite rataosoite,
                                   sijainti geography(point),
                                   ajonopeus decimal -- ajonopeus
);


ALTER TABLE mittaus
    ADD CONSTRAINT mittaus_raportti_id_fkey FOREIGN KEY (raportti_id) REFERENCES raportti(id);

CREATE TABLE ams_mittaus(
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
) INHERITS (mittaus);

ALTER TABLE ams_mittaus
    ADD CONSTRAINT ams_mittaus_raportti_id_fkey FOREIGN KEY (raportti_id) REFERENCES raportti(id);

CREATE TABLE ohl_mittaus(
                                      siksak_1 decimal,                                -- Over Head Line Geometry and Wear.Siksak 1 [mm]
                                      siksak_2 decimal,                                -- Over Head Line Geometry and Wear.Siksak 2 [mm]
                                      korkeus_1 decimal,                               -- Over Head Line Geometry and Wear.Korkeus 1 [mm]
                                      korkeus_2 decimal,                               -- Over Head Line Geometry and Wear.Korkeus 2 [mm]
                                      jaannospaksuus_1 decimal,                        -- Over Head Line Geometry and Wear.Jäännöspaksuus 1 [mm]
                                      jaannospaksuus_2 decimal,                        -- Over Head Line Geometry and Wear.Jäännöspaksuus 2 [mm]
                                      risteavien_ajolankojen_etaisyys decimal,         -- Over Head Line Geometry and Wear.Risteävien Ajolankojen Etäisyys [mm]
                                      height_gradient decimal,                         -- Over Head Line Geometry and Wear.Height Gradient [mm/m]
                                      pinnan_leveys_1 decimal,                         -- Over Head Line Geometry and Wear.Pinnan Leveys 1 [mm]
                                      pinnan_leveys_2 decimal,                         -- Over Head Line Geometry and Wear.Pinnan Leveys 2 [mm]
                                      pinnan_leveyden_keskiarvo_1 decimal,             -- Over Head Line Geometry and Wear.Pinnan Leveyden Keskiarvo 1 [mm]
                                      pinnan_leveyden_keskiarvo_2 decimal,             -- Over Head Line Geometry and Wear.Pinnan Leveyden Keskiarvo 2 [mm]
                                      pinnan_leveyden_keskihajonta_1 decimal,          -- Over Head Line Geometry and Wear.Pinnan Leveyden Keskihajonta 1 [mm]
                                      pinnan_leveyden_keskihajonta_2 decimal,          -- Over Head Line Geometry and Wear.Pinnan Leveyden Keskihajonta 2 [mm]
                                      jaannospinta_ala_1 decimal,                      -- Over Head Line Geometry and Wear.Jäännöspinta-ala 1 [mm^2]
                                      jaannospinta_ala_2 decimal,                      -- Over Head Line Geometry and Wear.Jäännöspinta-ala 2 [mm^2]
                                      jaannospinta_alan_keskiarvo_1 decimal,           -- Over Head Line Geometry and Wear.Jäännöspinta-alan Keskiarvo 1 [mm^2]
                                      jaannospinta_alan_keskiarvo_2 decimal,           -- Over Head Line Geometry and Wear.Jäännöspinta-alan Keskiarvo 2 [mm^2]
                                      residual_area_stddev_1 decimal,                  -- Over Head Line Geometry and Wear.Residual Area StdDev 1 [mm^2]
                                      residual_area_stddev_2 decimal,                  -- Over Head Line Geometry and Wear.Residual Area StdDev 2 [mm^2]
                                      pole decimal,                                    -- Over Head Line Geometry and Wear.Pole
                                      korkeuden_poikkeama decimal,                     -- Over Head Line Geometry and Wear.Korkeuden Poikkeama [mm]
                                      siksakkin_poikkeama decimal,                     -- Over Head Line Geometry and Wear.Siksakkin Poikkeama [mm]
                                      pituuskaltevuus decimal,                         -- Over Head Line Geometry and Wear.Pituuskaltevuus [mm/m]
                                      ajonopeus decimal,                               -- Over Head Line Geometry and Wear.Ajonopeus [Km/h]
                                      right_wire_wear_2 decimal,                       -- Over Head Line Geometry and Wear.Right Wire Wear 2 [mm]
                                      stagger_box_ohl decimal,                         -- Over Head Line Geometry and Wear.Stagger Box_OHL [mm]
                                      height_box_ohl decimal                           -- Over Head Line Geometry and Wear.Height Box_OHL [mm]
) INHERITS (mittaus);

ALTER TABLE ohl_mittaus
    ADD CONSTRAINT ohl_mittaus_raportti_id_fkey FOREIGN KEY (raportti_id) REFERENCES raportti(id);

CREATE TABLE pi_mittaus(
                                     accz_1_1 decimal,     -- Pantograph/Catenary Interaction.AccZ 1.1 [m/s^2]
                                     accz_1_2 decimal,     -- Pantograph/Catenary Interaction.AccZ 1.2 [m/s^2]
                                     accz_2_1 decimal,     -- Pantograph/Catenary Interaction.AccZ 2.1 [m/s^2]
                                     accz_2_2 decimal,     -- Pantograph/Catenary Interaction.AccZ 2.2 [m/s^2]
                                     f_1_1 decimal,        -- Pantograph/Catenary Interaction.F 1.1 [N]
                                     f_1_2 decimal,        -- Pantograph/Catenary Interaction.F 1.2 [N]
                                     f_2_1 decimal,        -- Pantograph/Catenary Interaction.F 2.1 [N]
                                     f_2_2 decimal,        -- Pantograph/Catenary Interaction.F 2.2 [N]
                                     fint decimal,         -- Pantograph/Catenary Interaction.FInt [N]
                                     fcomp decimal,        -- Pantograph/Catenary Interaction.FComp [N]
                                     fext decimal,         -- Pantograph/Catenary Interaction.FExt [N]
                                     stagger decimal,      -- Pantograph/Catenary Interaction.Stagger [mm]
                                     height_ws decimal            -- Pantograph/Catenary Interaction.Height WS [mm]
) INHERITS (mittaus);

ALTER TABLE pi_mittaus
    ADD CONSTRAINT pi_mittaus_raportti_id_fkey FOREIGN KEY (raportti_id) REFERENCES raportti(id);

CREATE TABLE rc_mittaus(
                                     oikea_raiteen_aallon_rms_10_30mm decimal,                    -- Rail Corrugation.Oikea Raiteen Aallon RMS [10-30]mm [µm]
                                     vasen_raiteen_aallon_rms_10_30mm decimal,                    -- Rail Corrugation.Vasen Raiteen Aallon RMS [10-30]mm [µm]
                                     oikea_raiteen_aallon_rms_30_100mm decimal,                   -- Rail Corrugation.Oikea Raiteen Aallon RMS [30-100]mm [µm]
                                     vasen_raiteen_aallon_rms_30_100mm decimal,                   -- Rail Corrugation.Vasen Raiteen Aallon RMS [30-100]mm [µm]
                                     oikea_raiteen_aallon_rms_100_300mm decimal,                  -- Rail Corrugation.Oikea Raiteen Aallon RMS [100-300]mm [µm]
                                     vasen_raiteen_aallon_rms_100_300mm decimal,                  -- Rail Corrugation.Vasen Raiteen Aallon RMS [100-300]mm [µm]
                                     oikea_raiteen_aallon_rms_300_1000mm decimal,                 -- Rail Corrugation.Oikea Raiteen Aallon RMS [300-1000]mm [µm]
                                     vasen_raiteen_aallon_rms_300_1000mm decimal,                 -- Rail Corrugation.Vasen Raiteen Aallon RMS [300-1000]mm [µm]
                                     oikea_raiteen_aallon_rms_10_30mm_keskiarvo decimal,          -- Rail Corrugation.Oikea Raiteen Aallon RMS [10-30]mm Keskiarvo [µm]
                                     vasen_raiteen_aallon_rms_10_30mm_keskiarvo decimal,          -- Rail Corrugation.Vasen Raiteen Aallon RMS [10-30]mm Keskiarvo [µm]
                                     oikea_raiteen_aallon_rms_30_100mm_keskiarvo decimal,         -- Rail Corrugation.Oikea Raiteen Aallon RMS [30-100]mm Keskiarvo [µm]
                                     vasen_raiteen_aallon_rms_30_100mm_keskiarvo decimal,         -- Rail Corrugation.Vasen Raiteen Aallon RMS [30-100]mm Keskiarvo [µm]
                                     oikea_raiteen_aallon_rms_100_300mm_keskiarvo decimal,        -- Rail Corrugation.Oikea Raiteen Aallon RMS [100-300]mm Keskiarvo [µm]
                                     vasen_raiteen_aallon_rms_100_300mm_keskiarvo decimal,        -- Rail Corrugation.Vasen Raiteen Aallon RMS [100-300]mm Keskiarvo [µm]
                                     oikea_raiteen_aallon_rms_300_1000mm_keskiarvo decimal,       -- Rail Corrugation.Oikea Raiteen Aallon RMS [300-1000]mm Keskiarvo [µm]
                                     vasen_raiteen_aallon_rms_300_1000mm_keskiarvo decimal,       -- Rail Corrugation.Vasen Raiteen Aallon RMS [300-1000]mm Keskiarvo [µm]
                                     oikea_raiteen_aallon_rms_10_30mm_keskihajonta decimal,       -- Rail Corrugation.Oikea Raiteen Aallon RMS [10-30]mm Keskihajonta [µm]
                                     vasen_raiteen_aallon_rms_10_30mm_keskihajonta decimal,       -- Rail Corrugation.Vasen Raiteen Aallon RMS [10-30]mm Keskihajonta [µm]
                                     oikea_raiteen_aallon_rms_30_100mm_keskihajonta decimal,      -- Rail Corrugation.Oikea Raiteen Aallon RMS [30-100]mm Keskihajonta [µm]
                                     vasen_raiteen_aallon_rms_30_100mm_keskihajonta decimal,      -- Rail Corrugation.Vasen Raiteen Aallon RMS [30-100]mm Keskihajonta [µm]
                                     oikea_raiteen_aallon_rms_10_300mm_keskihajonta decimal,      -- Rail Corrugation.Oikea Raiteen Aallon RMS [10-300]mm Keskihajonta [µm]  HUOM TODO pitäis olla varmaan 100-300?
                                     vasen_raiteen_aallon_rms_100_300mm_keskihajonta decimal,     -- Rail Corrugation.Vasen Raiteen Aallon RMS [100-300]mm Keskihajonta [µm]
                                     oikea_raiteen_aallon_rms_300_1000mm_keskihajonta decimal,    -- Rail Corrugation.Oikea Raiteen Aallon RMS [300-1000]mm Keskihajonta [µm]
                                     vasen_raiteen_aallon_rms_300_1000_keskihajonta decimal,      -- Rail Corrugation.Vasen Raiteen Aallon RMS [300-1000] Keskihajonta [µm]
                                     vasen_raiteen_aallonrms10_30mm_kiintea_keskiarvo decimal,    -- Rail Corrugation.Vasen Raiteen AallonRMS[10-30]mm Kiinteä Keskiarvo [µm]
                                     oikea_raiteen_aallonrms10_30mm_kiintea_keskiarvo decimal,    -- Rail Corrugation.Oikea Raiteen AallonRMS[10-30]mm Kiinteä Keskiarvo [µm]
                                     vasen_raiteen_aallonrms10_30mm_kiintea_keskihaj decimal,     -- Rail Corrugation.Vasen Raiteen AallonRMS[10-30]mm Kiinteä Keskihaj [µm]
                                     oikea_raiteen_aallonrms10_30mm_kiintea_keskihaj decimal,     -- Rail Corrugation.Oikea Raiteen AallonRMS[10-30]mm Kiinteä Keskihaj [µm]
                                     vasen_raiteen_aallonrms30_100mm_kiintea_keskiarv decimal,    -- Rail Corrugation.Vasen Raiteen AallonRMS[30-100]mm Kiinteä Keskiarv [µm]
                                     oikea_raiteen_aallonrms30_100mm_kiintea_keskiarv decimal,    -- Rail Corrugation.Oikea Raiteen AallonRMS[30-100]mm Kiinteä Keskiarv [µm]
                                     vasen_raiteen_aallonrms30_100mm_kiintea_keskihaj decimal,    -- Rail Corrugation.Vasen Raiteen AallonRMS[30-100]mm Kiinteä Keskihaj [µm]
                                     oikea_raiteen_aallonrms30_100mm_kiintea_keskihaj decimal,    -- Rail Corrugation.Oikea Raiteen AallonRMS[30-100]mm Kiinteä Keskihaj [µm]
                                     vasen_raiteen_aallonrms100_300mm_kiintea_keskiar decimal,    -- Rail Corrugation.Vasen Raiteen AallonRMS[100-300]mm Kiinteä Keskiar [µm]
                                     oikea_raiteen_aallonrms100_300mm_kiintea_keskiar decimal,    -- Rail Corrugation.Oikea Raiteen AallonRMS[100-300]mm Kiinteä Keskiar [µm]
                                     vasen_raiteen_aallonrms100_300mm_kiintea_keskiha decimal,    -- Rail Corrugation.Vasen Raiteen AallonRMS[100-300]mm Kiinteä Keskiha [µm]
                                     oikea_raiteen_aallonrms100_300mm_kiintea_keskiha decimal,    -- Rail Corrugation.Oikea Raiteen AallonRMS[100-300]mm Kiinteä Keskiha [µm]
                                     vasen_raiteen_aallonrms300_1000mm_kiintea_keskia decimal,    -- Rail Corrugation.Vasen Raiteen AallonRMS[300-1000]mm Kiinteä Keskia [µm]
                                     oikea_raiteen_aallonrms300_1000mm_kiintea_keskia decimal,    -- Rail Corrugation.Oikea Raiteen AallonRMS[300-1000]mm Kiinteä Keskia [µm]
                                     vasen_raiteen_aallonrms300_1000mm_kiintea_keskih decimal,    -- Rail Corrugation.Vasen Raiteen AallonRMS[300-1000]mm Kiinteä Keskih [µm]
                                     oikea_raiteen_aallonrms300_1000mm_kiintea_keskih decimal     -- Rail Corrugation.Oikea Raiteen AallonRMS[300-1000]mm Kiinteä Keskih [µm]
) INHERITS (mittaus);

ALTER TABLE rc_mittaus
    ADD CONSTRAINT rc_mittaus_raportti_id_fkey FOREIGN KEY (raportti_id) REFERENCES raportti(id);

CREATE TABLE rp_mittaus(
                                     vasen_pystysuora_kuluma decimal,                                   -- Rail Profile.Vasen Pystysuora Kuluma [mm]
                                     oikea_pystysuora_kuluma decimal,                                   -- Rail Profile.Oikea Pystysuora Kuluma [mm]
                                     vasen_pystysuora_kuluman_keskiarvo decimal,                        -- Rail Profile.Vasen Pystysuora Kuluman Keskiarvo [mm]
                                     oikea_pystysuora_kuluman_keskiarvo              decimal,                        -- Rail Profile.Oikea Pystysuora Kuluman Keskiarvo [mm]
                                     vasen_pystysuora_kuluman_keskihajonta decimal,                     -- Rail Profile.Vasen Pystysuora Kuluman Keskihajonta [mm]
                                     oikea_pystysuora_kuluman_keskihajonta decimal,                     -- Rail Profile.Oikea Pystysuora Kuluman Keskihajonta [mm]
                                     vasen_sisapuolinen_sivuttaiskuluma decimal,                        -- Rail Profile.Vasen Sisäpuolinen Sivuttaiskuluma [mm]
                                     oikea_sisapuolinen_sivuttaiskuluma decimal,                        -- Rail Profile.Oikea Sisäpuolinen Sivuttaiskuluma [mm]
                                     vasen_sisapuolisen_sivuttaiskuluman_keskiarvo decimal,             -- Rail Profile.Vasen Sisäpuolisen Sivuttaiskuluman Keskiarvo [mm]
                                     oikea_sisapuolisen_sivuttaiskuluman_keskiarvo decimal,             -- Rail Profile.Oikea Sisäpuolisen Sivuttaiskuluman Keskiarvo [mm]
                                     vasen_sisapuolisen_sivuttaiskuluman_keskihajonta decimal,          -- Rail Profile.Vasen Sisäpuolisen Sivuttaiskuluman Keskihajonta [mm]
                                     oikea_sisapuolisen_sivuttaiskuluman_keskihajonta decimal,          -- Rail Profile.Oikea Sisäpuolisen Sivuttaiskuluman Keskihajonta [mm]
                                     vasen_ulkoinen_sivuttaiskuluma decimal,                            -- Rail Profile.Vasen Ulkoinen Sivuttaiskuluma [mm]
                                     oikea_ulkoinen_sivuttaiskuluma decimal,                            -- Rail Profile.Oikea Ulkoinen Sivuttaiskuluma [mm]
                                     vasen_ulkoisen_sivuttaiskuluman_keskiarvo decimal,                 -- Rail Profile.Vasen Ulkoisen Sivuttaiskuluman Keskiarvo [mm]
                                     oikea_ulkoisen_sivuttaiskuluman_keskiarvo decimal,                 -- Rail Profile.Oikea Ulkoisen Sivuttaiskuluman Keskiarvo [mm]
                                     vasen_ulkoisen_sivuttaiskuluman_keskihajonta decimal,              -- Rail Profile.Vasen Ulkoisen Sivuttaiskuluman Keskihajonta [mm]
                                     oikea_ulkoisen_sivuttaiskuluman_keskihajonta decimal,              -- Rail Profile.Oikea Ulkoisen Sivuttaiskuluman Keskihajonta [mm]
                                     vasen_kallistus decimal,                                           -- Rail Profile.Vasen Kallistus [°]
                                     oikea_kallistus decimal,                                           -- Rail Profile.Oikea Kallistus [°]
                                     vasen_kallistuksen_keskiarvo decimal,                              -- Rail Profile.Vasen Kallistuksen Keskiarvo [°]
                                     oikea_kallistuksen_keskiarvo decimal,                              -- Rail Profile.Oikea Kallistuksen Keskiarvo [°]
                                     vasen_kallistuksen_keskihajonta decimal,                           -- Rail Profile.Vasen Kallistuksen Keskihajonta [°]
                                     oikea_kallistuksen_keskihajonta decimal,                           -- Rail Profile.Oikea Kallistuksen Keskihajonta [°]
                                     vasen_45_kuluma decimal,                                           -- Rail Profile.Vasen 45° Kuluma [mm]
                                     oikea_45_kuluma decimal,                                           -- Rail Profile.Oikea 45° Kuluma [mm]
                                     vasen_45_kuluman_keskiarvo decimal,                                -- Rail Profile.Vasen 45° Kuluman Keskiarvo [mm]
                                     oikea_45_kuluman_keskiarvo decimal,                                -- Rail Profile.Oikea 45° Kuluman Keskiarvo [mm]
                                     vasen_45_kuluman_keskihajonta decimal,                             -- Rail Profile.Vasen 45° Kuluman Keskihajonta [mm]
                                     oikea_45_kuluman_keskihajonta decimal,                             -- Rail Profile.Oikea 45° Kuluman Keskihajonta [mm]
                                     vasen_yhdistetty_kuluma decimal,                                   -- Rail Profile.Vasen Yhdistetty Kuluma [mm]
                                     oikea_yhdistetty_kuluma decimal,                                   -- Rail Profile.Oikea Yhdistetty Kuluma [mm]
                                     vasen_yhdistetyn_kuluman_keskiarvo decimal,                        -- Rail Profile.Vasen Yhdistetyn Kuluman Keskiarvo [mm]
                                     oikea_yhdistetyn_kuluman_keskiarvo decimal,                        -- Rail Profile.Oikea Yhdistetyn Kuluman Keskiarvo [mm]
                                     vasen_yhdistetyn_kuluman_keskihajonta decimal,                     -- Rail Profile.Vasen Yhdistetyn Kuluman Keskihajonta [mm]
                                     oikea_yhdistetyn_kuluman_keskihajonta decimal,                     -- Rail Profile.Oikea Yhdistetyn Kuluman Keskihajonta [mm]
                                     vasen_poikkileikkauspinta_ala decimal,                             -- Rail Profile.Vasen Poikkileikkauspinta-Ala [mm^2]
                                     oikea_poikkileikkauspinta_ala decimal,                             -- Rail Profile.Oikea Poikkileikkauspinta-Ala [mm^2]
                                     vasen_poikkileikkauspinta_alan_keskiarvo decimal,                  -- Rail Profile.Vasen Poikkileikkauspinta-Alan Keskiarvo [mm^2]
                                     oikea_poikkileikkauspinta_alan_keskiarvo decimal,                  -- Rail Profile.Oikea Poikkileikkauspinta-Alan Keskiarvo [mm^2]
                                     vasen_poikkileikkauspinta_alan_keskihajonta decimal,               -- Rail Profile.Vasen Poikkileikkauspinta-Alan Keskihajonta [mm^2]
                                     oikea_poikkileikkauspinta_alan_keskihajonta decimal,               -- Rail Profile.Oikea Poikkileikkauspinta-Alan Keskihajonta [mm^2]
                                     vasen_sisapuolinen_purse decimal,                                  -- Rail Profile.Vasen Sisäpuolinen Purse [mm]
                                     oikea_sisapuolinen_purse decimal,                                  -- Rail Profile.Oikea Sisäpuolinen Purse [mm]
                                     vasen_sisapuolisen_purseen_keskiarvo decimal,                      -- Rail Profile.Vasen Sisäpuolisen Purseen Keskiarvo [mm]
                                     oikea_sisapuolisen_purseen_keskiarvo decimal,                      -- Rail Profile.Oikea Sisäpuolisen Purseen Keskiarvo [mm]
                                     vasen_sisapuolisen_purseen_keskihajonta decimal,                   -- Rail Profile.Vasen Sisäpuolisen Purseen Keskihajonta [mm]
                                     oikea_sisapuolisen_purseen_keskihajonta decimal,                   -- Rail Profile.Oikea Sisäpuolisen Purseen Keskihajonta [mm]
                                     vasen_ulkopuolinen_purse decimal,                                  -- Rail Profile.Vasen Ulkopuolinen Purse [mm]
                                     oikea_ulkopuolinen_purse decimal,                                  -- Rail Profile.Oikea Ulkopuolinen Purse [mm]
                                     vasen_ulkopuolisen_purseen_keskiarvo decimal,                      -- Rail Profile.Vasen Ulkopuolisen Purseen Keskiarvo [mm]
                                     oikea_ulkopuolisen_purseen_keskiarvo decimal,                      -- Rail Profile.Oikea Ulkopuolisen Purseen Keskiarvo [mm]
                                     vasen_ulkopuolisen_purseen_keskihajonta decimal,                   -- Rail Profile.Vasen Ulkopuolisen Purseen Keskihajonta [mm]
                                     oikea_ulkopuolisen_purseen_keskihajonta decimal,                   -- Rail Profile.Oikea Ulkopuolisen Purseen Keskihajonta [mm]
                                     tehollinen_kartiokkuus decimal,                                    -- Rail Profile.Tehollinen Kartiokkuus
                                     tehollisen_kartiokkuuden_keskiarvo decimal,                        -- Rail Profile.Tehollisen Kartiokkuuden Keskiarvo
                                     tehollisen_kartiokkuuden_keskihajonta decimal,                     -- Rail Profile.Tehollisen Kartiokkuuden Keskihajonta
                                     vasen_kiskon_kallistuksen_kiintea_keskiarvo decimal,               -- Rail Profile.Vasen Kiskon Kallistuksen Kiinteä Keskiarvo [°]
                                     oikea_kiskon_kallistuksen_kiintea_keskiarvo decimal,               -- Rail Profile.Oikea Kiskon Kallistuksen Kiinteä Keskiarvo [°]
                                     vasen_kiskon_kallistuksen_kiintea_keskihajonta decimal,            -- Rail Profile.Vasen Kiskon Kallistuksen Kiinteä Keskihajonta [°]
                                     oikea_kiskon_kallistuksen_kiintea_keskihajonta decimal,            -- Rail Profile.Oikea Kiskon Kallistuksen Kiinteä Keskihajonta [°]
                                     vasen_pystysuoran_kuluman_kiintea_keskiarvo decimal,               -- Rail Profile.Vasen Pystysuoran Kuluman Kiinteä Keskiarvo [mm]
                                     oikea_pystysuoran_kuluman_kiintea_keskiarvo decimal,               -- Rail Profile.Oikea Pystysuoran Kuluman Kiinteä Keskiarvo [mm]
                                     vasen_pystysuoran_kuluman_kiintea_keskihajonta decimal,            -- Rail Profile.Vasen Pystysuoran Kuluman Kiinteä Keskihajonta [mm]
                                     oikea_pystysuoran_kuluman_kiintea_keskihajonta decimal,            -- Rail Profile.Oikea Pystysuoran Kuluman Kiinteä Keskihajonta [mm]
                                     vasen_sisapuolisen_sivuttaisk_kiintea_keskiarvo decimal,           -- Rail Profile.Vasen Sisäpuolisen Sivuttaisk Kiinteä Keskiarvo [mm]
                                     oikea_sisapuolisen_sivuttaisk_kiintea_keskiarvo decimal,           -- Rail Profile.Oikea Sisäpuolisen Sivuttaisk Kiinteä Keskiarvo [mm]
                                     vasen_sisapuolisen_sivuttaisk_kiintea_keskihajonta decimal,        -- Rail Profile.Vasen Sisäpuolisen Sivuttaisk Kiinteä Keskihajonta [mm]
                                     oikea_sisapuolisen_sivuttaisk_kiintea_keskihajonta decimal,        -- Rail Profile.Oikea Sisäpuolisen Sivuttaisk Kiinteä Keskihajonta [mm]
                                     vasen_ulkopuolisen_sivuttaisk_kiintea_keskiarvo decimal,           -- Rail Profile.Vasen Ulkopuolisen Sivuttaisk Kiinteä Keskiarvo [mm]
                                     oikea_ulkopuolisen_sivuttaisk_kiintea_keskiarvo decimal,           -- Rail Profile.Oikea Ulkopuolisen Sivuttaisk Kiinteä Keskiarvo [mm]
                                     vasen_ulkopuolisen_sivuttaisk_kiintea_keskihajonta decimal,        -- Rail Profile.Vasen Ulkopuolisen Sivuttaisk Kiinteä Keskihajonta [mm]
                                     oikea_ulkopuolisen_sivuttaisk_kiintea_keskihajonta decimal,        -- Rail Profile.Oikea Ulkopuolisen Sivuttaisk Kiinteä Keskihajonta [mm]
                                     vasen_45_kuluman_kiintea_keskiarvo decimal,                        -- Rail Profile.Vasen 45° Kuluman Kiinteä Keskiarvo [mm]
                                     oikea_45_kuluman_kiintea_keskiarvo decimal,                        -- Rail Profile.Oikea 45° Kuluman Kiinteä Keskiarvo [mm]
                                     vasen_45_kuluman_kiintea_keskihajonta decimal,                     -- Rail Profile.Vasen 45° Kuluman Kiinteä Keskihajonta [mm]
                                     oikea_45_kuluman_kiintea_keskihajonta decimal,                     -- Rail Profile.Oikea 45° Kuluman Kiinteä Keskihajonta [mm]
                                     vasen_yhdistetyn_kuluman_kiintea_keskiarvo decimal,                -- Rail Profile.Vasen Yhdistetyn Kuluman Kiinteä Keskiarvo [mm]
                                     oikea_yhdistetyn_kuluman_kiintea_keskiarvo decimal,                -- Rail Profile.Oikea Yhdistetyn Kuluman Kiinteä Keskiarvo [mm]
                                     vasen_yhdistetyn_kuluman_kiintea_keskihajonta decimal,             -- Rail Profile.Vasen Yhdistetyn Kuluman Kiinteä Keskihajonta [mm]
                                     oikea_yhdistetyn_kuluman_kiintea_keskihajonta decimal,             -- Rail Profile.Oikea Yhdistetyn Kuluman Kiinteä Keskihajonta [mm]
                                     vasen_poikkileikkauspinta_alan_kiintea_keskiarvo decimal,          -- Rail Profile.Vasen Poikkileikkauspinta-Alan Kiinteä Keskiarvo [mm^2]
                                     oikea_poikkileikkauspinta_alan_kiintea_keskiarvo decimal,          -- Rail Profile.Oikea Poikkileikkauspinta-Alan Kiinteä Keskiarvo [mm^2]
                                     vasen_poikkileikkauspint_alan_kiintea_keskihajonta decimal,        -- Rail Profile.Vasen Poikkileikkauspint-Alan Kiinteä Keskihajonta [mm^2]
                                     oikea_poikkileikkauspint_alan_kiintea_keskihajonta decimal,        -- Rail Profile.Oikea Poikkileikkauspint-Alan Kiinteä Keskihajonta [mm^2]
                                     vasen_sisapuolisen_purseen_kiintea_keskiarvo decimal,              -- Rail Profile.Vasen Sisäpuolisen Purseen Kiinteä Keskiarvo [mm]
                                     oikea_sisapuolisen_purseen_kiintea_keskiarvo decimal,              -- Rail Profile.Oikea Sisäpuolisen Purseen Kiinteä Keskiarvo [mm]
                                     vasen_sisapuolisen_purseen_kiintea_keskihajonta decimal,           -- Rail Profile.Vasen Sisäpuolisen Purseen Kiinteä Keskihajonta [mm]
                                     oikea_sisapuolisen_purseen_kiintea_keskihajonta decimal,           -- Rail Profile.Oikea Sisäpuolisen Purseen Kiinteä Keskihajonta [mm]
                                     vasen_ulkopuolisen_purseen_kiintea_keskiarvo decimal,              -- Rail Profile.Vasen Ulkopuolisen Purseen Kiinteä Keskiarvo [mm]
                                     oikea_ulkopuolisen_purseen_kiintea_keskiarvo decimal,              -- Rail Profile.Oikea Ulkopuolisen Purseen Kiinteä Keskiarvo [mm]
                                     vasen_ulkopulisen_purseen_kiintea_keskihajonta decimal,            -- Rail Profile.Vasen Ulkopulisen Purseen Kiinteä Keskihajonta [mm]
                                     oikea_ulkopuolisen_purseen_kiintea_keskihajonta decimal,           -- Rail Profile.Oikea Ulkopuolisen Purseen Kiinteä Keskihajonta [mm]
                                     tehollisen_kartiokkuuden_kiintea_keskiarvo decimal,                -- Rail Profile.Tehollisen Kartiokkuuden Kiinteä Keskiarvo
                                     tehollisen_kartiokkuuden_kiintea_keskihajonta decimal,             -- Rail Profile.Tehollisen Kartiokkuuden Kiinteä Keskihajonta
                                     vasen_poikkipinta_alan_poikkeama decimal,                          -- Rail Profile.Vasen Poikkipinta-Alan Poikkeama [mm^2]
                                     oikea_poikkipinta_alan_poikkeama decimal,                          -- Rail Profile.Oikea Poikkipinta-Alan Poikkeama [mm^2]
                                     rp_ajonopeus decimal 											   -- Rail Profile.Ajonopeus [Km/h]
) INHERITS (mittaus);

ALTER TABLE rp_mittaus
    ADD CONSTRAINT rp_mittaus_raportti_id_fkey FOREIGN KEY (raportti_id) REFERENCES raportti(id);

CREATE TABLE tg_mittaus(
                                     raideleveyden_poikkeama decimal,                           -- TG Master.Raideleveyden Poikkeama [mm]
                                     kallistus decimal,                                         -- TG Master.Kallistus [mm]
                                     kallistuksen_poikkeama decimal,                            -- TG Master.Kallistuksen Poikkeama [mm]
                                     kierous decimal,                                           -- TG Master.Kierous [mm]
                                     kaarevuus decimal,                                         -- TG Master.Kaarevuus [10000/m]
                                     raideleveyden_poikkeaman_muutos decimal,                   -- TG Master.Raideleveyden Poikkeaman Muutos [mm/m]
                                     kierouden_poikkeama decimal,                               -- TG Master.Kierouden Poikkeama [mm]
                                     vasen_korkeuspoikkeama_d1 decimal,                         -- TG Master.Vasen Korkeuspoikkeama D1 [mm]
                                     vasen_korkeuspoikkeama_d2 decimal,                         -- TG Master.Vasen Korkeuspoikkeama D2 [mm]
                                     oikea_korkeuspoikkeama_d2 decimal,                         -- TG Master.Oikea Korkeuspoikkeama D2 [mm]
                                     vasen_korkeuspoikkeama_d3 decimal,                         -- TG Master.Vasen Korkeuspoikkeama D3 [mm]
                                     oikea_korkeuspoikkeama_d3 decimal,                         -- TG Master.Oikea Korkeuspoikkeama D3 [mm]
                                     vasen_nuolikorkeuspoikkeama_d1 decimal,                    -- TG Master.Vasen Nuolikorkeuspoikkeama D1 [mm]
                                     oikea_nuolikorkeuspoikkeama_d1 decimal,                    -- TG Master.Oikea Nuolikorkeuspoikkeama D1 [mm]
                                     vasen_nuolikorkeuspoikkeama_d2 decimal,                    -- TG Master.Vasen Nuolikorkeuspoikkeama D2 [mm]
                                     oikea_nuolikorkeuspoikkeama_d2 decimal,                    -- TG Master.Oikea Nuolikorkeuspoikkeama D2 [mm]
                                     vasen_nuolikorkeuspoikkeama_d3 decimal,                    -- TG Master.Vasen Nuolikorkeuspoikkeama D3 [mm]
                                     oikea_nuolikorkeuspoikkeama_d3 decimal,                    -- TG Master.Oikea Nuolikorkeuspoikkeama D3 [mm]
                                     gradient decimal,                                          -- TG Master.Gradient [‰]
                                     raideleveyden decimal,                                     -- TG Master.Raideleveyden [mm]
                                     oikea_korkeuspoikkeama_d1 decimal,                         -- TG Master.Oikea Korkeuspoikkeama D1 [mm]
                                     raideleveyden_keskihajonta decimal,                        -- TG Master.Raideleveyden Keskihajonta [mm]
                                     kallistus_keskihajonta decimal,                            -- TG Master.Kallistus Keskihajonta [mm]
                                     kierouden_keskihajonta decimal,                            -- TG Master.Kierouden Keskihajonta [mm]
                                     vasen_korkeuspoikkeama_d1_keskihajonta decimal,            -- TG Master.Vasen Korkeuspoikkeama D1 Keskihajonta [mm]
                                     oikea_korkeuspoikkeama_d1_keskihajonta decimal,            -- TG Master.Oikea Korkeuspoikkeama D1 Keskihajonta [mm]
                                     vasen_nuolikorkeus_d1_keskihajonta decimal,                -- TG Master.Vasen Nuolikorkeus D1 Keskihajonta [mm]
                                     oikea_nuolikorkeus_d1_keskihajonta decimal,                -- TG Master.Oikea Nuolikorkeus D1 Keskihajonta [mm]
                                     vasen_korkeuspoikkema_d0 decimal,                          -- TG Master.Vasen Korkeuspoikkema D0 [mm]
                                     oikea_korkeuspoikkema_d0 decimal,                          -- TG Master.Oikea Korkeuspoikkema D0 [mm]
                                     vasen_korkeuspoikkema_d0_keskihajonta decimal,             -- TG Master.Vasen Korkeuspoikkema D0 Keskihajonta [mm]
                                     oikea_korkeuspoikkema_d0_keskihajonta decimal              -- TG Master.Oikea Korkeuspoikkema D0 Keskihajonta [mm]
) INHERITS (mittaus);

ALTER TABLE tg_mittaus
    ADD CONSTRAINT tg_mittaus_raportti_id_fkey FOREIGN KEY (raportti_id) REFERENCES raportti(id);

CREATE TABLE tsight_mittaus(
                                         ballast_slope_l decimal,                                 -- T-Sight 600.Ballast slope_L [°]
                                         ballast_width_l decimal,                                 -- T-Sight 600.Ballast width_L [mm]
                                         ballast_height_l decimal,                                -- T-Sight 600.Ballast height_L [mm]
                                         ballast_slope_r decimal,                                 -- T-Sight 600.Ballast slope_R [°]
                                         ballast_width_r decimal,                                 -- T-Sight 600.Ballast width_R [mm]
                                         ballast_height_r decimal,                                -- T-Sight 600.Ballast height_R [mm]
                                         platform_center_h_l decimal,                             -- T-Sight 600.Platform_Center_H_L [mm]
                                         platform_run_v_l decimal,                                -- T-Sight 600.Platform_Run_V_L [mm]
                                         platform_center_h_r decimal,                             -- T-Sight 600.Platform_Center_H_R [mm]
                                         platform_run_v_r decimal,                                -- T-Sight 600.Platform_Run_V_R [mm]
                                         fin1_kin_min_distance decimal,                           -- T-Sight 600.FIN1 Kin Min Distance [mm]
                                         fin1_kin_leftrail_min_dist decimal,                      -- T-Sight 600.FIN1 Kin LeftRail Min Dist [mm]
                                         fin1_kin_rightrail_min_dist decimal,                     -- T-Sight 600.FIN1 Kin RightRail Min Dist [mm]
                                         sg_mt_kin_min_distance decimal,                          -- T-Sight 600.SG MT Kin Min Distance [mm]
                                         sg_mt_kin_leftrail_min_distance decimal,                 -- T-Sight 600.SG MT Kin LeftRail Min Distance [mm]
                                         sg_mt_kin_rightrail_min_distance decimal,                -- T-Sight 600.SG MT Kin RightRail Min Distance [mm]
                                         sg_st_kin_min_distance decimal,                          -- T-Sight 600.SG ST Kin Min Distance [mm]
                                         sg_st_kin_leftrail_min_distance decimal,                 -- T-Sight 600.SG ST Kin LeftRail Min Distance [mm]
                                         sg_st_kin_rightrail_min_distance decimal,                -- T-Sight 600.SG ST Kin RightRail Min Distance [mm]
                                         oversize_kin_min_distance decimal,                       -- T-Sight 600.Oversize Kin Min Distance [mm]
                                         oversize_kin_leftrail_min_distance decimal,              -- T-Sight 600.Oversize Kin LeftRail Min Distance [mm]
                                         oversize_kin_rightrail_min_distance decimal,             -- T-Sight 600.Oversize Kin RightRail Min Distance [mm]
                                         gauge_adjacenttrack_left decimal,                        -- T-Sight 600.Gauge_AdjacentTrack_Left [mm]
                                         distance_adjacenttrack_left decimal,                     -- T-Sight 600.Distance_AdjacentTrack_Left [mm]
                                         gauge_adjacenttrack_right decimal,                       -- T-Sight 600.Gauge_AdjacentTrack_Right [mm]
                                         distance_adjacenttrack_right decimal                     -- T-Sight 600.Distance_AdjacentTrack_Right [mm]
) INHERITS (mittaus);

ALTER TABLE tsight_mittaus
    ADD CONSTRAINT tsight_mittaus_raportti_id_fkey FOREIGN KEY (raportti_id) REFERENCES raportti(id);
