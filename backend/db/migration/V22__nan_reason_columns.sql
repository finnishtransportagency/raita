DROP TYPE NAN_REASON;
CREATE TYPE NAN_REASON AS ENUM  ('INV_VALUE','NAN_VALUE','NULL_VALUE','INF_VALUE','MINUS_INF_VALUE','UNKNOWN_VALUE');

alter table ams_mittaus

  ADD COLUMN oikea_pystysuuntainen_kiihtyvyys_c1_nan_reason NAN_REASON,
  ADD COLUMN vasen_pystysuuntainen_kiihtyvyys_c1_nan_reason NAN_REASON,
  ADD COLUMN oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu_nan_reason NAN_REASON,
  ADD COLUMN vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu_nan_reason NAN_REASON,
  ADD COLUMN oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN oikea_poikittainen_kiihtyvyys_c1_nan_reason NAN_REASON,
  ADD COLUMN vasen_poikittainen_kiihtyvyys_c1_nan_reason NAN_REASON,
  ADD COLUMN oikea_poikittainen_kiihtyvyys_c1_suodatettu_nan_reason NAN_REASON,
  ADD COLUMN vasen_poikittainen_kiihtyvyys_c1_suodatettu_nan_reason NAN_REASON,
  ADD COLUMN oikea_poikittainen_kiihtyvyys_c1_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN vasen_poikittainen_kiihtyvyys_c1_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN pystysuuntainen_kiihtyvyys_c2_nan_reason NAN_REASON,
  ADD COLUMN pystysuuntainen_kiihtyvyys_c2_suodatettu_nan_reason NAN_REASON,
  ADD COLUMN poikittainen_kiihtyvyys_c2_nan_reason NAN_REASON,
  ADD COLUMN poikittainen_kiihtyvyys_c2_suodatettu_nan_reason NAN_REASON,
  ADD COLUMN transversal_acceleration_c2_mean_to_peak_nan_reason NAN_REASON,
  ADD COLUMN pystysuuntainen_kiihtyvyys_c3_nan_reason NAN_REASON,
  ADD COLUMN pystysuuntainen_kiihtyvyys_c3_suodatettu_nan_reason NAN_REASON,
  ADD COLUMN poikittainen_kiihtyvyys_c3_nan_reason NAN_REASON,
  ADD COLUMN poikittainen_kiihtyvyys_c3_suodatettu_nan_reason NAN_REASON,
  ADD COLUMN transversal_acceleration_c3_mean_to_peak_nan_reason NAN_REASON,
  ADD COLUMN ams_ajonopeus_nan_reason NAN_REASON;



alter table ohl_mittaus

  ADD COLUMN ajonopeus_nan_reason NAN_REASON,
  ADD COLUMN siksak_1_nan_reason NAN_REASON,
  ADD COLUMN siksak_2_nan_reason NAN_REASON,
  ADD COLUMN korkeus_1_nan_reason NAN_REASON,
  ADD COLUMN korkeus_2_nan_reason NAN_REASON,
  ADD COLUMN jaannospaksuus_1_nan_reason NAN_REASON,
  ADD COLUMN jaannospaksuus_2_nan_reason NAN_REASON,
  ADD COLUMN risteavien_ajolankojen_etaisyys_nan_reason NAN_REASON,
  ADD COLUMN height_gradient_nan_reason NAN_REASON,
  ADD COLUMN pinnan_leveys_1_nan_reason NAN_REASON,
  ADD COLUMN pinnan_leveys_2_nan_reason NAN_REASON,
  ADD COLUMN pinnan_leveyden_keskiarvo_1_nan_reason NAN_REASON,
  ADD COLUMN pinnan_leveyden_keskiarvo_2_nan_reason NAN_REASON,
  ADD COLUMN pinnan_leveyden_keskihajonta_1_nan_reason NAN_REASON,
  ADD COLUMN pinnan_leveyden_keskihajonta_2_nan_reason NAN_REASON,
  ADD COLUMN jaannospinta_ala_1_nan_reason NAN_REASON,
  ADD COLUMN jaannospinta_ala_2_nan_reason NAN_REASON,
  ADD COLUMN jaannospinta_alan_keskiarvo_1_nan_reason NAN_REASON,
  ADD COLUMN jaannospinta_alan_keskiarvo_2_nan_reason NAN_REASON,
  ADD COLUMN residual_area_stddev_1_nan_reason NAN_REASON,
  ADD COLUMN residual_area_stddev_2_nan_reason NAN_REASON,
  ADD COLUMN pole_nan_reason NAN_REASON,
  ADD COLUMN korkeuden_poikkeama_nan_reason NAN_REASON,
  ADD COLUMN siksakkin_poikkeama_nan_reason NAN_REASON,
  ADD COLUMN pituuskaltevuus_nan_reason NAN_REASON,
  ADD COLUMN right_wire_wear_2_nan_reason NAN_REASON,
  ADD COLUMN stagger_box_ohl_nan_reason NAN_REASON,
  ADD COLUMN height_box_ohl_nan_reason NAN_REASON,
  ADD COLUMN ohl_ajonopeus_nan_reason NAN_REASON;




alter table pi_mittaus

  ADD COLUMN accz_1_1_nan_reason NAN_REASON,
  ADD COLUMN accz_1_2_nan_reason NAN_REASON,
  ADD COLUMN accz_2_1_nan_reason NAN_REASON,
  ADD COLUMN accz_2_2_nan_reason NAN_REASON,
  ADD COLUMN f_1_1_nan_reason NAN_REASON,
  ADD COLUMN f_1_2_nan_reason NAN_REASON,
  ADD COLUMN f_2_1_nan_reason NAN_REASON,
  ADD COLUMN f_2_2_nan_reason NAN_REASON,
  ADD COLUMN fint_nan_reason NAN_REASON,
  ADD COLUMN fcomp_nan_reason NAN_REASON,
  ADD COLUMN fext_nan_reason NAN_REASON,
  ADD COLUMN stagger_nan_reason NAN_REASON,
  ADD COLUMN height_ws_nan_reason NAN_REASON;




alter table rc_mittaus

  ADD COLUMN oikea_raiteen_aallon_rms_10_30mm_nan_reason NAN_REASON,
  ADD COLUMN vasen_raiteen_aallon_rms_10_30mm_nan_reason NAN_REASON,
  ADD COLUMN oikea_raiteen_aallon_rms_30_100mm_nan_reason NAN_REASON,
  ADD COLUMN vasen_raiteen_aallon_rms_30_100mm_nan_reason NAN_REASON,
  ADD COLUMN oikea_raiteen_aallon_rms_100_300mm_nan_reason NAN_REASON,
  ADD COLUMN vasen_raiteen_aallon_rms_100_300mm_nan_reason NAN_REASON,
  ADD COLUMN oikea_raiteen_aallon_rms_300_1000mm_nan_reason NAN_REASON,
  ADD COLUMN vasen_raiteen_aallon_rms_300_1000mm_nan_reason NAN_REASON,
  ADD COLUMN oikea_raiteen_aallon_rms_10_30mm_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN vasen_raiteen_aallon_rms_10_30mm_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN oikea_raiteen_aallon_rms_30_100mm_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN vasen_raiteen_aallon_rms_30_100mm_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN oikea_raiteen_aallon_rms_100_300mm_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN vasen_raiteen_aallon_rms_100_300mm_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN oikea_raiteen_aallon_rms_300_1000mm_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN vasen_raiteen_aallon_rms_300_1000mm_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN oikea_raiteen_aallon_rms_10_30mm_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN vasen_raiteen_aallon_rms_10_30mm_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN oikea_raiteen_aallon_rms_30_100mm_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN vasen_raiteen_aallon_rms_30_100mm_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN oikea_raiteen_aallon_rms_10_300mm_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN vasen_raiteen_aallon_rms_100_300mm_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN oikea_raiteen_aallon_rms_300_1000mm_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN vasen_raiteen_aallon_rms_300_1000_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN vasen_raiteen_aallonrms10_30mm_kiintea_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN oikea_raiteen_aallonrms10_30mm_kiintea_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN vasen_raiteen_aallonrms10_30mm_kiintea_keskihaj_nan_reason NAN_REASON,
  ADD COLUMN oikea_raiteen_aallonrms10_30mm_kiintea_keskihaj_nan_reason NAN_REASON,
  ADD COLUMN vasen_raiteen_aallonrms30_100mm_kiintea_keskiarv_nan_reason NAN_REASON,
  ADD COLUMN oikea_raiteen_aallonrms30_100mm_kiintea_keskiarv_nan_reason NAN_REASON,
  ADD COLUMN vasen_raiteen_aallonrms30_100mm_kiintea_keskihaj_nan_reason NAN_REASON,
  ADD COLUMN oikea_raiteen_aallonrms30_100mm_kiintea_keskihaj_nan_reason NAN_REASON,
  ADD COLUMN vasen_raiteen_aallonrms100_300mm_kiintea_keskiar_nan_reason NAN_REASON,
  ADD COLUMN oikea_raiteen_aallonrms100_300mm_kiintea_keskiar_nan_reason NAN_REASON,
  ADD COLUMN vasen_raiteen_aallonrms100_300mm_kiintea_keskiha_nan_reason NAN_REASON,
  ADD COLUMN oikea_raiteen_aallonrms100_300mm_kiintea_keskiha_nan_reason NAN_REASON,
  ADD COLUMN vasen_raiteen_aallonrms300_1000mm_kiintea_keskia_nan_reason NAN_REASON,
  ADD COLUMN oikea_raiteen_aallonrms300_1000mm_kiintea_keskia_nan_reason NAN_REASON,
  ADD COLUMN vasen_raiteen_aallonrms300_1000mm_kiintea_keskih_nan_reason NAN_REASON,
  ADD COLUMN oikea_raiteen_aallonrms300_1000mm_kiintea_keskih_nan_reason NAN_REASON;




alter table rp_mittaus

  ADD COLUMN vasen_pystysuora_kuluma_nan_reason NAN_REASON,
  ADD COLUMN oikea_pystysuora_kuluma_nan_reason NAN_REASON,
  ADD COLUMN vasen_pystysuora_kuluman_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN oikea_pystysuora_kuluman_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN vasen_pystysuora_kuluman_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN oikea_pystysuora_kuluman_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN vasen_sisapuolinen_sivuttaiskuluma_nan_reason NAN_REASON,
  ADD COLUMN oikea_sisapuolinen_sivuttaiskuluma_nan_reason NAN_REASON,
  ADD COLUMN vasen_sisapuolisen_sivuttaiskuluman_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN oikea_sisapuolisen_sivuttaiskuluman_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN vasen_sisapuolisen_sivuttaiskuluman_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN oikea_sisapuolisen_sivuttaiskuluman_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN vasen_ulkoinen_sivuttaiskuluma_nan_reason NAN_REASON,
  ADD COLUMN oikea_ulkoinen_sivuttaiskuluma_nan_reason NAN_REASON,
  ADD COLUMN vasen_ulkoisen_sivuttaiskuluman_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN oikea_ulkoisen_sivuttaiskuluman_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN vasen_ulkoisen_sivuttaiskuluman_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN oikea_ulkoisen_sivuttaiskuluman_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN vasen_kallistus_nan_reason NAN_REASON,
  ADD COLUMN oikea_kallistus_nan_reason NAN_REASON,
  ADD COLUMN vasen_kallistuksen_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN oikea_kallistuksen_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN vasen_kallistuksen_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN oikea_kallistuksen_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN vasen_45_kuluma_nan_reason NAN_REASON,
  ADD COLUMN oikea_45_kuluma_nan_reason NAN_REASON,
  ADD COLUMN vasen_45_kuluman_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN oikea_45_kuluman_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN vasen_45_kuluman_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN oikea_45_kuluman_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN vasen_yhdistetty_kuluma_nan_reason NAN_REASON,
  ADD COLUMN oikea_yhdistetty_kuluma_nan_reason NAN_REASON,
  ADD COLUMN vasen_yhdistetyn_kuluman_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN oikea_yhdistetyn_kuluman_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN vasen_yhdistetyn_kuluman_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN oikea_yhdistetyn_kuluman_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN vasen_poikkileikkauspinta_ala_nan_reason NAN_REASON,
  ADD COLUMN oikea_poikkileikkauspinta_ala_nan_reason NAN_REASON,
  ADD COLUMN vasen_poikkileikkauspinta_alan_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN oikea_poikkileikkauspinta_alan_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN vasen_poikkileikkauspinta_alan_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN oikea_poikkileikkauspinta_alan_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN vasen_sisapuolinen_purse_nan_reason NAN_REASON,
  ADD COLUMN oikea_sisapuolinen_purse_nan_reason NAN_REASON,
  ADD COLUMN vasen_sisapuolisen_purseen_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN oikea_sisapuolisen_purseen_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN vasen_sisapuolisen_purseen_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN oikea_sisapuolisen_purseen_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN vasen_ulkopuolinen_purse_nan_reason NAN_REASON,
  ADD COLUMN oikea_ulkopuolinen_purse_nan_reason NAN_REASON,
  ADD COLUMN vasen_ulkopuolisen_purseen_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN oikea_ulkopuolisen_purseen_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN vasen_ulkopuolisen_purseen_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN oikea_ulkopuolisen_purseen_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN tehollinen_kartiokkuus_nan_reason NAN_REASON,
  ADD COLUMN tehollisen_kartiokkuuden_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN tehollisen_kartiokkuuden_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN vasen_kiskon_kallistuksen_kiintea_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN oikea_kiskon_kallistuksen_kiintea_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN vasen_kiskon_kallistuksen_kiintea_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN oikea_kiskon_kallistuksen_kiintea_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN vasen_pystysuoran_kuluman_kiintea_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN oikea_pystysuoran_kuluman_kiintea_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN vasen_pystysuoran_kuluman_kiintea_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN oikea_pystysuoran_kuluman_kiintea_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN vasen_sisapuolisen_sivuttaisk_kiintea_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN oikea_sisapuolisen_sivuttaisk_kiintea_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN vasen_sisapuolisen_sivuttaisk_kiintea_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN oikea_sisapuolisen_sivuttaisk_kiintea_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN vasen_ulkopuolisen_sivuttaisk_kiintea_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN oikea_ulkopuolisen_sivuttaisk_kiintea_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN vasen_ulkopuolisen_sivuttaisk_kiintea_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN oikea_ulkopuolisen_sivuttaisk_kiintea_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN vasen_45_kuluman_kiintea_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN oikea_45_kuluman_kiintea_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN vasen_45_kuluman_kiintea_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN oikea_45_kuluman_kiintea_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN vasen_yhdistetyn_kuluman_kiintea_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN oikea_yhdistetyn_kuluman_kiintea_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN vasen_yhdistetyn_kuluman_kiintea_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN oikea_yhdistetyn_kuluman_kiintea_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN vasen_poikkileikkauspinta_alan_kiintea_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN oikea_poikkileikkauspinta_alan_kiintea_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN vasen_poikkileikkauspint_alan_kiintea_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN oikea_poikkileikkauspint_alan_kiintea_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN vasen_sisapuolisen_purseen_kiintea_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN oikea_sisapuolisen_purseen_kiintea_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN vasen_sisapuolisen_purseen_kiintea_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN oikea_sisapuolisen_purseen_kiintea_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN vasen_ulkopuolisen_purseen_kiintea_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN oikea_ulkopuolisen_purseen_kiintea_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN vasen_ulkopulisen_purseen_kiintea_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN oikea_ulkopuolisen_purseen_kiintea_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN tehollisen_kartiokkuuden_kiintea_keskiarvo_nan_reason NAN_REASON,
  ADD COLUMN tehollisen_kartiokkuuden_kiintea_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN vasen_poikkipinta_alan_poikkeama_nan_reason NAN_REASON,
  ADD COLUMN oikea_poikkipinta_alan_poikkeama_nan_reason NAN_REASON,
  ADD COLUMN rp_ajonopeus_nan_reason NAN_REASON;




alter table tg_mittaus

  ADD COLUMN raideleveyden_poikkeama_nan_reason NAN_REASON,
  ADD COLUMN kallistus_nan_reason NAN_REASON,
  ADD COLUMN kallistuksen_poikkeama_nan_reason NAN_REASON,
  ADD COLUMN kierous_nan_reason NAN_REASON,
  ADD COLUMN kaarevuus_nan_reason NAN_REASON,
  ADD COLUMN raideleveyden_poikkeaman_muutos_nan_reason NAN_REASON,
  ADD COLUMN kierouden_poikkeama_nan_reason NAN_REASON,
  ADD COLUMN vasen_korkeuspoikkeama_d1_nan_reason NAN_REASON,
  ADD COLUMN vasen_korkeuspoikkeama_d2_nan_reason NAN_REASON,
  ADD COLUMN oikea_korkeuspoikkeama_d2_nan_reason NAN_REASON,
  ADD COLUMN vasen_korkeuspoikkeama_d3_nan_reason NAN_REASON,
  ADD COLUMN oikea_korkeuspoikkeama_d3_nan_reason NAN_REASON,
  ADD COLUMN vasen_nuolikorkeuspoikkeama_d1_nan_reason NAN_REASON,
  ADD COLUMN oikea_nuolikorkeuspoikkeama_d1_nan_reason NAN_REASON,
  ADD COLUMN vasen_nuolikorkeuspoikkeama_d2_nan_reason NAN_REASON,
  ADD COLUMN oikea_nuolikorkeuspoikkeama_d2_nan_reason NAN_REASON,
  ADD COLUMN vasen_nuolikorkeuspoikkeama_d3_nan_reason NAN_REASON,
  ADD COLUMN oikea_nuolikorkeuspoikkeama_d3_nan_reason NAN_REASON,
  ADD COLUMN gradient_nan_reason NAN_REASON,
  ADD COLUMN raideleveyden_nan_reason NAN_REASON,
  ADD COLUMN oikea_korkeuspoikkeama_d1_nan_reason NAN_REASON,
  ADD COLUMN raideleveyden_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN kallistus_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN kierouden_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN vasen_korkeuspoikkeama_d1_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN oikea_korkeuspoikkeama_d1_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN vasen_nuolikorkeus_d1_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN oikea_nuolikorkeus_d1_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN vasen_korkeuspoikkema_d0_nan_reason NAN_REASON,
  ADD COLUMN oikea_korkeuspoikkema_d0_nan_reason NAN_REASON,
  ADD COLUMN vasen_korkeuspoikkema_d0_keskihajonta_nan_reason NAN_REASON,
  ADD COLUMN oikea_korkeuspoikkema_d0_keskihajonta_nan_reason NAN_REASON;




alter table tsight_mittaus

  ADD COLUMN ballast_slope_l_nan_reason NAN_REASON,
  ADD COLUMN ballast_width_l_nan_reason NAN_REASON,
  ADD COLUMN ballast_height_l_nan_reason NAN_REASON,
  ADD COLUMN ballast_slope_r_nan_reason NAN_REASON,
  ADD COLUMN ballast_width_r_nan_reason NAN_REASON,
  ADD COLUMN ballast_height_r_nan_reason NAN_REASON,
  ADD COLUMN platform_center_h_l_nan_reason NAN_REASON,
  ADD COLUMN platform_run_v_l_nan_reason NAN_REASON,
  ADD COLUMN platform_center_h_r_nan_reason NAN_REASON,
  ADD COLUMN platform_run_v_r_nan_reason NAN_REASON,
  ADD COLUMN fin1_kin_min_distance_nan_reason NAN_REASON,
  ADD COLUMN fin1_kin_leftrail_min_dist_nan_reason NAN_REASON,
  ADD COLUMN fin1_kin_rightrail_min_dist_nan_reason NAN_REASON,
  ADD COLUMN sg_mt_kin_min_distance_nan_reason NAN_REASON,
  ADD COLUMN sg_mt_kin_leftrail_min_distance_nan_reason NAN_REASON,
  ADD COLUMN sg_mt_kin_rightrail_min_distance_nan_reason NAN_REASON,
  ADD COLUMN sg_st_kin_min_distance_nan_reason NAN_REASON,
  ADD COLUMN sg_st_kin_leftrail_min_distance_nan_reason NAN_REASON,
  ADD COLUMN sg_st_kin_rightrail_min_distance_nan_reason NAN_REASON,
  ADD COLUMN oversize_kin_min_distance_nan_reason NAN_REASON,
  ADD COLUMN oversize_kin_leftrail_min_distance_nan_reason NAN_REASON,
  ADD COLUMN oversize_kin_rightrail_min_distance_nan_reason NAN_REASON,
  ADD COLUMN gauge_adjacenttrack_left_nan_reason NAN_REASON,
  ADD COLUMN distance_adjacenttrack_left_nan_reason NAN_REASON,
  ADD COLUMN gauge_adjacenttrack_right_nan_reason NAN_REASON,
  ADD COLUMN distance_adjacenttrack_right_nan_reason NAN_REASON;


