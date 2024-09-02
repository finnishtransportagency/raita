import { Decimal } from '@prisma/client/runtime/library';
import { jarjestelma } from '@prisma/client';

type AMSMittausData = {
  raportti_id: number;
  running_date: Date;
  jarjestelma?: jarjestelma;
  sscount?: number;
  sijainti?: any; // This might need to be handled differently depending on your "Unsupported" type
  ajonopeus?: Decimal;
  oikea_pystysuuntainen_kiihtyvyys_c1?: Decimal;
  vasen_pystysuuntainen_kiihtyvyys_c1?: Decimal;
  oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu?: Decimal;
  vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu?: Decimal;
  oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta?: Decimal;
  vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta?: Decimal;
  oikea_poikittainen_kiihtyvyys_c1?: Decimal;
  vasen_poikittainen_kiihtyvyys_c1?: Decimal;
  oikea_poikittainen_kiihtyvyys_c1_suodatettu?: Decimal;
  vasen_poikittainen_kiihtyvyys_c1_suodatettu?: Decimal;
  oikea_poikittainen_kiihtyvyys_c1_keskihajonta?: Decimal;
  vasen_poikittainen_kiihtyvyys_c1_keskihajonta?: Decimal;
  pystysuuntainen_kiihtyvyys_c2?: Decimal;
  pystysuuntainen_kiihtyvyys_c2_suodatettu?: Decimal;
  poikittainen_kiihtyvyys_c2?: Decimal;
  poikittainen_kiihtyvyys_c2_suodatettu?: Decimal;
  transversal_acceleration_c2_mean_to_peak?: Decimal;
  pystysuuntainen_kiihtyvyys_c3?: Decimal;
  pystysuuntainen_kiihtyvyys_c3_suodatettu?: Decimal;
  poikittainen_kiihtyvyys_c3?: Decimal;
  poikittainen_kiihtyvyys_c3_suodatettu?: Decimal;
  transversal_acceleration_c3_mean_to_peak?: Decimal;
  ams_ajonopeus?: Decimal;
  track?: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  rataosuus_numero?: string;
  rataosuus_nimi?: string;
  raide_numero?: string;
  rata_kilometri?: number;
  rata_metrit?: Decimal;
  lat?: Decimal;
  long?: Decimal;
  created?: Date;
  modified?: Date;
};

export function convertDataToAMSMittausArray(data: any[]): AMSMittausData[] {
  return data.map(item => ({
    raportti_id: parseInt(item.raportti_id, 10),
    running_date: new Date(item.running_date),
    jarjestelma: item.jarjestelma || undefined,
    sscount: item.sscount ? parseInt(item.sscount, 10) : undefined,
    sijainti: item.sijainti || undefined, // Special handling may be needed for "Unsupported" types
    ajonopeus: item.ajonopeus ? new Decimal(item.ajonopeus) : undefined,
    oikea_pystysuuntainen_kiihtyvyys_c1:
      item.oikea_pystysuuntainen_kiihtyvyys_c1
        ? new Decimal(item.oikea_pystysuuntainen_kiihtyvyys_c1)
        : undefined,
    vasen_pystysuuntainen_kiihtyvyys_c1:
      item.vasen_pystysuuntainen_kiihtyvyys_c1
        ? new Decimal(item.vasen_pystysuuntainen_kiihtyvyys_c1)
        : undefined,
    oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu:
      item.oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu
        ? new Decimal(item.oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu)
        : undefined,
    vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu:
      item.vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu
        ? new Decimal(item.vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu)
        : undefined,
    oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta:
      item.oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta
        ? new Decimal(item.oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta)
        : undefined,
    vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta:
      item.vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta
        ? new Decimal(item.vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta)
        : undefined,
    oikea_poikittainen_kiihtyvyys_c1: item.oikea_poikittainen_kiihtyvyys_c1
      ? new Decimal(item.oikea_poikittainen_kiihtyvyys_c1)
      : undefined,
    vasen_poikittainen_kiihtyvyys_c1: item.vasen_poikittainen_kiihtyvyys_c1
      ? new Decimal(item.vasen_poikittainen_kiihtyvyys_c1)
      : undefined,
    oikea_poikittainen_kiihtyvyys_c1_suodatettu:
      item.oikea_poikittainen_kiihtyvyys_c1_suodatettu
        ? new Decimal(item.oikea_poikittainen_kiihtyvyys_c1_suodatettu)
        : undefined,
    vasen_poikittainen_kiihtyvyys_c1_suodatettu:
      item.vasen_poikittainen_kiihtyvyys_c1_suodatettu
        ? new Decimal(item.vasen_poikittainen_kiihtyvyys_c1_suodatettu)
        : undefined,
    oikea_poikittainen_kiihtyvyys_c1_keskihajonta:
      item.oikea_poikittainen_kiihtyvyys_c1_keskihajonta
        ? new Decimal(item.oikea_poikittainen_kiihtyvyys_c1_keskihajonta)
        : undefined,
    vasen_poikittainen_kiihtyvyys_c1_keskihajonta:
      item.vasen_poikittainen_kiihtyvyys_c1_keskihajonta
        ? new Decimal(item.vasen_poikittainen_kiihtyvyys_c1_keskihajonta)
        : undefined,
    pystysuuntainen_kiihtyvyys_c2: item.pystysuuntainen_kiihtyvyys_c2
      ? new Decimal(item.pystysuuntainen_kiihtyvyys_c2)
      : undefined,
    pystysuuntainen_kiihtyvyys_c2_suodatettu:
      item.pystysuuntainen_kiihtyvyys_c2_suodatettu
        ? new Decimal(item.pystysuuntainen_kiihtyvyys_c2_suodatettu)
        : undefined,
    poikittainen_kiihtyvyys_c2: item.poikittainen_kiihtyvyys_c2
      ? new Decimal(item.poikittainen_kiihtyvyys_c2)
      : undefined,
    poikittainen_kiihtyvyys_c2_suodatettu:
      item.poikittainen_kiihtyvyys_c2_suodatettu
        ? new Decimal(item.poikittainen_kiihtyvyys_c2_suodatettu)
        : undefined,
    transversal_acceleration_c2_mean_to_peak:
      item.transversal_acceleration_c2_mean_to_peak
        ? new Decimal(item.transversal_acceleration_c2_mean_to_peak)
        : undefined,
    pystysuuntainen_kiihtyvyys_c3: item.pystysuuntainen_kiihtyvyys_c3
      ? new Decimal(item.pystysuuntainen_kiihtyvyys_c3)
      : undefined,
    pystysuuntainen_kiihtyvyys_c3_suodatettu:
      item.pystysuuntainen_kiihtyvyys_c3_suodatettu
        ? new Decimal(item.pystysuuntainen_kiihtyvyys_c3_suodatettu)
        : undefined,
    poikittainen_kiihtyvyys_c3: item.poikittainen_kiihtyvyys_c3
      ? new Decimal(item.poikittainen_kiihtyvyys_c3)
      : undefined,
    poikittainen_kiihtyvyys_c3_suodatettu:
      item.poikittainen_kiihtyvyys_c3_suodatettu
        ? new Decimal(item.poikittainen_kiihtyvyys_c3_suodatettu)
        : undefined,
    transversal_acceleration_c3_mean_to_peak:
      item.transversal_acceleration_c3_mean_to_peak
        ? new Decimal(item.transversal_acceleration_c3_mean_to_peak)
        : undefined,
    ams_ajonopeus: item.ams_ajonopeus
      ? new Decimal(item.ams_ajonopeus)
      : undefined,
    track: item.track || undefined,
    location: item.location || undefined,
    latitude: item.latitude || undefined,
    longitude: item.longitude || undefined,
    rataosuus_numero: item.rataosuus_numero || undefined,
    rataosuus_nimi: item.rataosuus_nimi || undefined,
    raide_numero: item.raide_numero || undefined,
    rata_kilometri: item.rata_kilometri
      ? parseInt(item.rata_kilometri, 10)
      : undefined,
    rata_metrit: item.rata_metrit ? new Decimal(item.rata_metrit) : undefined,
    lat: item.lat ? new Decimal(item.lat) : undefined,
    long: item.long ? new Decimal(item.long) : undefined,
    created: item.created ? new Date(item.created) : undefined,
    modified: item.modified ? new Date(item.modified) : undefined,
  }));
}

type OhlMittausData = {
  raportti_id: number;
  running_date: Date;
  jarjestelma?: jarjestelma;
  sscount?: number;
  sijainti?: any; // This might need to be handled differently depending on your "Unsupported" type
  ajonopeus?: Decimal;
  siksak_1?: Decimal;
  siksak_2?: Decimal;
  korkeus_1?: Decimal;
  korkeus_2?: Decimal;
  jaannospaksuus_1?: Decimal;
  jaannospaksuus_2?: Decimal;
  risteavien_ajolankojen_etaisyys?: Decimal;
  height_gradient?: Decimal;
  pinnan_leveys_1?: Decimal;
  pinnan_leveys_2?: Decimal;
  pinnan_leveyden_keskiarvo_1?: Decimal;
  pinnan_leveyden_keskiarvo_2?: Decimal;
  pinnan_leveyden_keskihajonta_1?: Decimal;
  pinnan_leveyden_keskihajonta_2?: Decimal;
  jaannospinta_ala_1?: Decimal;
  jaannospinta_ala_2?: Decimal;
  jaannospinta_alan_keskiarvo_1?: Decimal;
  jaannospinta_alan_keskiarvo_2?: Decimal;
  residual_area_stddev_1?: Decimal;
  residual_area_stddev_2?: Decimal;
  pole?: Decimal;
  korkeuden_poikkeama?: Decimal;
  siksakkin_poikkeama?: Decimal;
  pituuskaltevuus?: Decimal;
  right_wire_wear_2?: Decimal;
  stagger_box_ohl?: Decimal;
  height_box_ohl?: Decimal;
  track?: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  rataosuus_numero?: string;
  rataosuus_nimi?: string;
  raide_numero?: string;
  rata_kilometri?: number;
  rata_metrit?: Decimal;
  ohl_ajonopeus?: Decimal;
  lat?: Decimal;
  long?: Decimal;
  created?: Date;
  modified?: Date;
};

export function convertDataToOhlMittausArray(data: any[]): OhlMittausData[] {
  return data.map(item => ({
    raportti_id: parseInt(item.raportti_id, 10),
    running_date: new Date(item.running_date),
    jarjestelma: item.jarjestelma
      ? (item.jarjestelma as jarjestelma)
      : undefined,
    sscount: item.sscount ? parseInt(item.sscount, 10) : undefined,
    sijainti: item.sijainti || undefined, // Special handling may be needed for "Unsupported" types
    ajonopeus: item.ajonopeus ? new Decimal(item.ajonopeus) : undefined,
    siksak_1: item.siksak_1 ? new Decimal(item.siksak_1) : undefined,
    siksak_2: item.siksak_2 ? new Decimal(item.siksak_2) : undefined,
    korkeus_1: item.korkeus_1 ? new Decimal(item.korkeus_1) : undefined,
    korkeus_2: item.korkeus_2 ? new Decimal(item.korkeus_2) : undefined,
    jaannospaksuus_1: item.jaannospaksuus_1
      ? new Decimal(item.jaannospaksuus_1)
      : undefined,
    jaannospaksuus_2: item.jaannospaksuus_2
      ? new Decimal(item.jaannospaksuus_2)
      : undefined,
    risteavien_ajolankojen_etaisyys: item.risteavien_ajolankojen_etaisyys
      ? new Decimal(item.risteavien_ajolankojen_etaisyys)
      : undefined,
    height_gradient: item.height_gradient
      ? new Decimal(item.height_gradient)
      : undefined,
    pinnan_leveys_1: item.pinnan_leveys_1
      ? new Decimal(item.pinnan_leveys_1)
      : undefined,
    pinnan_leveys_2: item.pinnan_leveys_2
      ? new Decimal(item.pinnan_leveys_2)
      : undefined,
    pinnan_leveyden_keskiarvo_1: item.pinnan_leveyden_keskiarvo_1
      ? new Decimal(item.pinnan_leveyden_keskiarvo_1)
      : undefined,
    pinnan_leveyden_keskiarvo_2: item.pinnan_leveyden_keskiarvo_2
      ? new Decimal(item.pinnan_leveyden_keskiarvo_2)
      : undefined,
    pinnan_leveyden_keskihajonta_1: item.pinnan_leveyden_keskihajonta_1
      ? new Decimal(item.pinnan_leveyden_keskihajonta_1)
      : undefined,
    pinnan_leveyden_keskihajonta_2: item.pinnan_leveyden_keskihajonta_2
      ? new Decimal(item.pinnan_leveyden_keskihajonta_2)
      : undefined,
    jaannospinta_ala_1: item.jaannospinta_ala_1
      ? new Decimal(item.jaannospinta_ala_1)
      : undefined,
    jaannospinta_ala_2: item.jaannospinta_ala_2
      ? new Decimal(item.jaannospinta_ala_2)
      : undefined,
    jaannospinta_alan_keskiarvo_1: item.jaannospinta_alan_keskiarvo_1
      ? new Decimal(item.jaannospinta_alan_keskiarvo_1)
      : undefined,
    jaannospinta_alan_keskiarvo_2: item.jaannospinta_alan_keskiarvo_2
      ? new Decimal(item.jaannospinta_alan_keskiarvo_2)
      : undefined,
    residual_area_stddev_1: item.residual_area_stddev_1
      ? new Decimal(item.residual_area_stddev_1)
      : undefined,
    residual_area_stddev_2: item.residual_area_stddev_2
      ? new Decimal(item.residual_area_stddev_2)
      : undefined,
    pole: item.pole ? new Decimal(item.pole) : undefined,
    korkeuden_poikkeama: item.korkeuden_poikkeama
      ? new Decimal(item.korkeuden_poikkeama)
      : undefined,
    siksakkin_poikkeama: item.siksakkin_poikkeama
      ? new Decimal(item.siksakkin_poikkeama)
      : undefined,
    pituuskaltevuus: item.pituuskaltevuus
      ? new Decimal(item.pituuskaltevuus)
      : undefined,
    right_wire_wear_2: item.right_wire_wear_2
      ? new Decimal(item.right_wire_wear_2)
      : undefined,
    stagger_box_ohl: item.stagger_box_ohl
      ? new Decimal(item.stagger_box_ohl)
      : undefined,
    height_box_ohl: item.height_box_ohl
      ? new Decimal(item.height_box_ohl)
      : undefined,
    track: item.track || undefined,
    location: item.location || undefined,
    latitude: item.latitude || undefined,
    longitude: item.longitude || undefined,
    rataosuus_numero: item.rataosuus_numero || undefined,
    rataosuus_nimi: item.rataosuus_nimi || undefined,
    raide_numero: item.raide_numero || undefined,
    rata_kilometri: item.rata_kilometri
      ? parseInt(item.rata_kilometri, 10)
      : undefined,
    rata_metrit: item.rata_metrit ? new Decimal(item.rata_metrit) : undefined,
    ohl_ajonopeus: item.ohl_ajonopeus
      ? new Decimal(item.ohl_ajonopeus)
      : undefined,
    lat: item.lat ? new Decimal(item.lat) : undefined,
    long: item.long ? new Decimal(item.long) : undefined,
    created: item.created ? new Date(item.created) : undefined,
    modified: item.modified ? new Date(item.modified) : undefined,
  }));
}

type PiMittausData = {
  raportti_id: number;
  running_date: Date;
  jarjestelma?: jarjestelma;
  sscount?: number;
  sijainti?: any; // This might need to be handled differently depending on your "Unsupported" type
  ajonopeus?: Decimal;
  accz_1_1?: Decimal;
  accz_1_2?: Decimal;
  accz_2_1?: Decimal;
  accz_2_2?: Decimal;
  f_1_1?: Decimal;
  f_1_2?: Decimal;
  f_2_1?: Decimal;
  f_2_2?: Decimal;
  fint?: Decimal;
  fcomp?: Decimal;
  fext?: Decimal;
  stagger?: Decimal;
  height_ws?: Decimal;
  track?: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  rataosuus_numero?: string;
  rataosuus_nimi?: string;
  raide_numero?: string;
  rata_kilometri?: number;
  rata_metrit?: Decimal;
  lat?: Decimal;
  long?: Decimal;
  created?: Date;
  modified?: Date;
};

export function convertDataToPiMittausArray(data: any[]): PiMittausData[] {
  return data.map(item => ({
    raportti_id: parseInt(item.raportti_id, 10),
    running_date: new Date(item.running_date),
    jarjestelma: item.jarjestelma || undefined,
    sscount: item.sscount ? parseInt(item.sscount, 10) : undefined,
    sijainti: item.sijainti || undefined, // Special handling may be needed for "Unsupported" types
    ajonopeus: item.ajonopeus ? new Decimal(item.ajonopeus) : undefined,
    accz_1_1: item.accz_1_1 ? new Decimal(item.accz_1_1) : undefined,
    accz_1_2: item.accz_1_2 ? new Decimal(item.accz_1_2) : undefined,
    accz_2_1: item.accz_2_1 ? new Decimal(item.accz_2_1) : undefined,
    accz_2_2: item.accz_2_2 ? new Decimal(item.accz_2_2) : undefined,
    f_1_1: item.f_1_1 ? new Decimal(item.f_1_1) : undefined,
    f_1_2: item.f_1_2 ? new Decimal(item.f_1_2) : undefined,
    f_2_1: item.f_2_1 ? new Decimal(item.f_2_1) : undefined,
    f_2_2: item.f_2_2 ? new Decimal(item.f_2_2) : undefined,
    fint: item.fint ? new Decimal(item.fint) : undefined,
    fcomp: item.fcomp ? new Decimal(item.fcomp) : undefined,
    fext: item.fext ? new Decimal(item.fext) : undefined,
    stagger: item.stagger ? new Decimal(item.stagger) : undefined,
    height_ws: item.height_ws ? new Decimal(item.height_ws) : undefined,
    track: item.track || undefined,
    location: item.location || undefined,
    latitude: item.latitude || undefined,
    longitude: item.longitude || undefined,
    rataosuus_numero: item.rataosuus_numero || undefined,
    rataosuus_nimi: item.rataosuus_nimi || undefined,
    raide_numero: item.raide_numero || undefined,
    rata_kilometri: item.rata_kilometri
      ? parseInt(item.rata_kilometri, 10)
      : undefined,
    rata_metrit: item.rata_metrit ? new Decimal(item.rata_metrit) : undefined,
    lat: item.lat ? new Decimal(item.lat) : undefined,
    long: item.long ? new Decimal(item.long) : undefined,
    created: item.created ? new Date(item.created) : undefined,
    modified: item.modified ? new Date(item.modified) : undefined,
  }));
}

type RcMittausData = {
  raportti_id: number;
  running_date: Date;
  jarjestelma?: jarjestelma;
  sscount?: number;
  sijainti?: any; // This might need to be handled differently depending on your "Unsupported" type
  ajonopeus?: Decimal;
  oikea_raiteen_aallon_rms_10_30mm?: Decimal;
  vasen_raiteen_aallon_rms_10_30mm?: Decimal;
  oikea_raiteen_aallon_rms_30_100mm?: Decimal;
  vasen_raiteen_aallon_rms_30_100mm?: Decimal;
  oikea_raiteen_aallon_rms_100_300mm?: Decimal;
  vasen_raiteen_aallon_rms_100_300mm?: Decimal;
  oikea_raiteen_aallon_rms_300_1000mm?: Decimal;
  vasen_raiteen_aallon_rms_300_1000mm?: Decimal;
  oikea_raiteen_aallon_rms_10_30mm_keskiarvo?: Decimal;
  vasen_raiteen_aallon_rms_10_30mm_keskiarvo?: Decimal;
  oikea_raiteen_aallon_rms_30_100mm_keskiarvo?: Decimal;
  vasen_raiteen_aallon_rms_30_100mm_keskiarvo?: Decimal;
  oikea_raiteen_aallon_rms_100_300mm_keskiarvo?: Decimal;
  vasen_raiteen_aallon_rms_100_300mm_keskiarvo?: Decimal;
  oikea_raiteen_aallon_rms_300_1000mm_keskiarvo?: Decimal;
  vasen_raiteen_aallon_rms_300_1000mm_keskiarvo?: Decimal;
  oikea_raiteen_aallon_rms_10_30mm_keskihajonta?: Decimal;
  vasen_raiteen_aallon_rms_10_30mm_keskihajonta?: Decimal;
  oikea_raiteen_aallon_rms_30_100mm_keskihajonta?: Decimal;
  vasen_raiteen_aallon_rms_30_100mm_keskihajonta?: Decimal;
  oikea_raiteen_aallon_rms_100_300mm_keskihajonta?: Decimal;
  vasen_raiteen_aallon_rms_100_300mm_keskihajonta?: Decimal;
  oikea_raiteen_aallon_rms_300_1000mm_keskihajonta?: Decimal;
  vasen_raiteen_aallon_rms_300_1000mm_keskihajonta?: Decimal;
  vasen_raiteen_aallonrms10_30mm_kiintea_keskiarvo?: Decimal;
  oikea_raiteen_aallonrms10_30mm_kiintea_keskiarvo?: Decimal;
  vasen_raiteen_aallonrms10_30mm_kiintea_keskihaj?: Decimal;
  oikea_raiteen_aallonrms10_30mm_kiintea_keskihaj?: Decimal;
  vasen_raiteen_aallonrms30_100mm_kiintea_keskiarv?: Decimal;
  oikea_raiteen_aallonrms30_100mm_kiintea_keskiarv?: Decimal;
  vasen_raiteen_aallonrms30_100mm_kiintea_keskihaj?: Decimal;
  oikea_raiteen_aallonrms30_100mm_kiintea_keskihaj?: Decimal;
  vasen_raiteen_aallonrms100_300mm_kiintea_keskiar?: Decimal;
  oikea_raiteen_aallonrms100_300mm_kiintea_keskiar?: Decimal;
  vasen_raiteen_aallonrms100_300mm_kiintea_keskih?: Decimal;
  oikea_raiteen_aallonrms100_300mm_kiintea_keskih?: Decimal;
  vasen_raiteen_aallonrms300_1000mm_kiintea_keskia?: Decimal;
  oikea_raiteen_aallonrms300_1000mm_kiintea_keskia?: Decimal;
  vasen_raiteen_aallonrms300_1000mm_kiintea_keskih?: Decimal;
  oikea_raiteen_aallonrms300_1000mm_kiintea_keskih?: Decimal;
  track?: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  rataosuus_numero?: string;
  rataosuus_nimi?: string;
  raide_numero?: string;
  rata_kilometri?: number;
  rata_metrit?: Decimal;
  lat?: Decimal;
  long?: Decimal;
  created?: Date;
  modified?: Date;
};

export function convertDataToRcMittausArray(data: any[]): RcMittausData[] {
  return data.map(item => ({
    raportti_id: parseInt(item.raportti_id, 10),
    running_date: new Date(item.running_date),
    jarjestelma: item.jarjestelma || undefined,
    sscount: item.sscount ? parseInt(item.sscount, 10) : undefined,
    sijainti: item.sijainti || undefined,
    ajonopeus: item.ajonopeus ? new Decimal(item.ajonopeus) : undefined,
    oikea_raiteen_aallon_rms_10_30mm: item.oikea_raiteen_aallon_rms_10_30mm
      ? new Decimal(item.oikea_raiteen_aallon_rms_10_30mm)
      : undefined,
    vasen_raiteen_aallon_rms_10_30mm: item.vasen_raiteen_aallon_rms_10_30mm
      ? new Decimal(item.vasen_raiteen_aallon_rms_10_30mm)
      : undefined,
    oikea_raiteen_aallon_rms_30_100mm: item.oikea_raiteen_aallon_rms_30_100mm
      ? new Decimal(item.oikea_raiteen_aallon_rms_30_100mm)
      : undefined,
    vasen_raiteen_aallon_rms_30_100mm: item.vasen_raiteen_aallon_rms_30_100mm
      ? new Decimal(item.vasen_raiteen_aallon_rms_30_100mm)
      : undefined,
    oikea_raiteen_aallon_rms_100_300mm: item.oikea_raiteen_aallon_rms_100_300mm
      ? new Decimal(item.oikea_raiteen_aallon_rms_100_300mm)
      : undefined,
    vasen_raiteen_aallon_rms_100_300mm: item.vasen_raiteen_aallon_rms_100_300mm
      ? new Decimal(item.vasen_raiteen_aallon_rms_100_300mm)
      : undefined,
    oikea_raiteen_aallon_rms_300_1000mm:
      item.oikea_raiteen_aallon_rms_300_1000mm
        ? new Decimal(item.oikea_raiteen_aallon_rms_300_1000mm)
        : undefined,
    vasen_raiteen_aallon_rms_300_1000mm:
      item.vasen_raiteen_aallon_rms_300_1000mm
        ? new Decimal(item.vasen_raiteen_aallon_rms_300_1000mm)
        : undefined,
    oikea_raiteen_aallon_rms_10_30mm_keskiarvo:
      item.oikea_raiteen_aallon_rms_10_30mm_keskiarvo
        ? new Decimal(item.oikea_raiteen_aallon_rms_10_30mm_keskiarvo)
        : undefined,
    vasen_raiteen_aallon_rms_10_30mm_keskiarvo:
      item.vasen_raiteen_aallon_rms_10_30mm_keskiarvo
        ? new Decimal(item.vasen_raiteen_aallon_rms_10_30mm_keskiarvo)
        : undefined,
    oikea_raiteen_aallon_rms_30_100mm_keskiarvo:
      item.oikea_raiteen_aallon_rms_30_100mm_keskiarvo
        ? new Decimal(item.oikea_raiteen_aallon_rms_30_100mm_keskiarvo)
        : undefined,
    vasen_raiteen_aallon_rms_30_100mm_keskiarvo:
      item.vasen_raiteen_aallon_rms_30_100mm_keskiarvo
        ? new Decimal(item.vasen_raiteen_aallon_rms_30_100mm_keskiarvo)
        : undefined,
    oikea_raiteen_aallon_rms_100_300mm_keskiarvo:
      item.oikea_raiteen_aallon_rms_100_300mm_keskiarvo
        ? new Decimal(item.oikea_raiteen_aallon_rms_100_300mm_keskiarvo)
        : undefined,
    vasen_raiteen_aallon_rms_100_300mm_keskiarvo:
      item.vasen_raiteen_aallon_rms_100_300mm_keskiarvo
        ? new Decimal(item.vasen_raiteen_aallon_rms_100_300mm_keskiarvo)
        : undefined,
    oikea_raiteen_aallon_rms_300_1000mm_keskiarvo:
      item.oikea_raiteen_aallon_rms_300_1000mm_keskiarvo
        ? new Decimal(item.oikea_raiteen_aallon_rms_300_1000mm_keskiarvo)
        : undefined,
    vasen_raiteen_aallon_rms_300_1000mm_keskiarvo:
      item.vasen_raiteen_aallon_rms_300_1000mm_keskiarvo
        ? new Decimal(item.vasen_raiteen_aallon_rms_300_1000mm_keskiarvo)
        : undefined,
    oikea_raiteen_aallon_rms_10_30mm_keskihajonta:
      item.oikea_raiteen_aallon_rms_10_30mm_keskihajonta
        ? new Decimal(item.oikea_raiteen_aallon_rms_10_30mm_keskihajonta)
        : undefined,
    vasen_raiteen_aallon_rms_10_30mm_keskihajonta:
      item.vasen_raiteen_aallon_rms_10_30mm_keskihajonta
        ? new Decimal(item.vasen_raiteen_aallon_rms_10_30mm_keskihajonta)
        : undefined,
    oikea_raiteen_aallon_rms_30_100mm_keskihajonta:
      item.oikea_raiteen_aallon_rms_30_100mm_keskihajonta
        ? new Decimal(item.oikea_raiteen_aallon_rms_30_100mm_keskihajonta)
        : undefined,
    vasen_raiteen_aallon_rms_30_100mm_keskihajonta:
      item.vasen_raiteen_aallon_rms_30_100mm_keskihajonta
        ? new Decimal(item.vasen_raiteen_aallon_rms_30_100mm_keskihajonta)
        : undefined,
    oikea_raiteen_aallon_rms_100_300mm_keskihajonta:
      item.oikea_raiteen_aallon_rms_100_300mm_keskihajonta
        ? new Decimal(item.oikea_raiteen_aallon_rms_100_300mm_keskihajonta)
        : undefined,
    vasen_raiteen_aallon_rms_100_300mm_keskihajonta:
      item.vasen_raiteen_aallon_rms_100_300mm_keskihajonta
        ? new Decimal(item.vasen_raiteen_aallon_rms_100_300mm_keskihajonta)
        : undefined,
    oikea_raiteen_aallon_rms_300_1000mm_keskihajonta:
      item.oikea_raiteen_aallon_rms_300_1000mm_keskihajonta
        ? new Decimal(item.oikea_raiteen_aallon_rms_300_1000mm_keskihajonta)
        : undefined,
    vasen_raiteen_aallon_rms_300_1000mm_keskihajonta:
      item.vasen_raiteen_aallon_rms_300_1000mm_keskihajonta
        ? new Decimal(item.vasen_raiteen_aallon_rms_300_1000mm_keskihajonta)
        : undefined,
    vasen_raiteen_aallonrms10_30mm_kiintea_keskiarvo:
      item.vasen_raiteen_aallonrms10_30mm_kiintea_keskiarvo
        ? new Decimal(item.vasen_raiteen_aallonrms10_30mm_kiintea_keskiarvo)
        : undefined,
    oikea_raiteen_aallonrms10_30mm_kiintea_keskiarvo:
      item.oikea_raiteen_aallonrms10_30mm_kiintea_keskiarvo
        ? new Decimal(item.oikea_raiteen_aallonrms10_30mm_kiintea_keskiarvo)
        : undefined,
    vasen_raiteen_aallonrms10_30mm_kiintea_keskihaj:
      item.vasen_raiteen_aallonrms10_30mm_kiintea_keskihaj
        ? new Decimal(item.vasen_raiteen_aallonrms10_30mm_kiintea_keskihaj)
        : undefined,
    oikea_raiteen_aallonrms10_30mm_kiintea_keskihaj:
      item.oikea_raiteen_aallonrms10_30mm_kiintea_keskihaj
        ? new Decimal(item.oikea_raiteen_aallonrms10_30mm_kiintea_keskihaj)
        : undefined,
    vasen_raiteen_aallonrms30_100mm_kiintea_keskiarv:
      item.vasen_raiteen_aallonrms30_100mm_kiintea_keskiarv
        ? new Decimal(item.vasen_raiteen_aallonrms30_100mm_kiintea_keskiarv)
        : undefined,
    oikea_raiteen_aallonrms30_100mm_kiintea_keskiarv:
      item.oikea_raiteen_aallonrms30_100mm_kiintea_keskiarv
        ? new Decimal(item.oikea_raiteen_aallonrms30_100mm_kiintea_keskiarv)
        : undefined,
    vasen_raiteen_aallonrms30_100mm_kiintea_keskihaj:
      item.vasen_raiteen_aallonrms30_100mm_kiintea_keskihaj
        ? new Decimal(item.vasen_raiteen_aallonrms30_100mm_kiintea_keskihaj)
        : undefined,
    oikea_raiteen_aallonrms30_100mm_kiintea_keskihaj:
      item.oikea_raiteen_aallonrms30_100mm_kiintea_keskihaj
        ? new Decimal(item.oikea_raiteen_aallonrms30_100mm_kiintea_keskihaj)
        : undefined,
    vasen_raiteen_aallonrms100_300mm_kiintea_keskiar:
      item.vasen_raiteen_aallonrms100_300mm_kiintea_keskiar
        ? new Decimal(item.vasen_raiteen_aallonrms100_300mm_kiintea_keskiar)
        : undefined,
    oikea_raiteen_aallonrms100_300mm_kiintea_keskiar:
      item.oikea_raiteen_aallonrms100_300mm_kiintea_keskiar
        ? new Decimal(item.oikea_raiteen_aallonrms100_300mm_kiintea_keskiar)
        : undefined,
    vasen_raiteen_aallonrms100_300mm_kiintea_keskih:
      item.vasen_raiteen_aallonrms100_300mm_kiintea_keskih
        ? new Decimal(item.vasen_raiteen_aallonrms100_300mm_kiintea_keskih)
        : undefined,
    oikea_raiteen_aallonrms100_300mm_kiintea_keskih:
      item.oikea_raiteen_aallonrms100_300mm_kiintea_keskih
        ? new Decimal(item.oikea_raiteen_aallonrms100_300mm_kiintea_keskih)
        : undefined,
    vasen_raiteen_aallonrms300_1000mm_kiintea_keskia:
      item.vasen_raiteen_aallonrms300_1000mm_kiintea_keskia
        ? new Decimal(item.vasen_raiteen_aallonrms300_1000mm_kiintea_keskia)
        : undefined,
    oikea_raiteen_aallonrms300_1000mm_kiintea_keskia:
      item.oikea_raiteen_aallonrms300_1000mm_kiintea_keskia
        ? new Decimal(item.oikea_raiteen_aallonrms300_1000mm_kiintea_keskia)
        : undefined,
    vasen_raiteen_aallonrms300_1000mm_kiintea_keskih:
      item.vasen_raiteen_aallonrms300_1000mm_kiintea_keskih
        ? new Decimal(item.vasen_raiteen_aallonrms300_1000mm_kiintea_keskih)
        : undefined,
    oikea_raiteen_aallonrms300_1000mm_kiintea_keskih:
      item.oikea_raiteen_aallonrms300_1000mm_kiintea_keskih
        ? new Decimal(item.oikea_raiteen_aallonrms300_1000mm_kiintea_keskih)
        : undefined,
    track: item.track || undefined,
    location: item.location || undefined,
    latitude: item.latitude || undefined,
    longitude: item.longitude || undefined,
    rataosuus_numero: item.rataosuus_numero || undefined,
    rataosuus_nimi: item.rataosuus_nimi || undefined,
    raide_numero: item.raide_numero || undefined,
    rata_kilometri: item.rata_kilometri || undefined,
    rata_metrit: item.rata_metrit ? new Decimal(item.rata_metrit) : undefined,
    lat: item.lat ? new Decimal(item.lat) : undefined,
    long: item.long ? new Decimal(item.long) : undefined,
    created: item.created ? new Date(item.created) : undefined,
    modified: item.modified ? new Date(item.modified) : undefined,
  }));
}

type rp_mittaus = {
  id: number;
  raportti_id: number;
  running_date: Date;
  jarjestelma?: jarjestelma;
  sscount?: number;
  sijainti?: any; // Unsupported("geography")
  ajonopeus?: Decimal;
  vasen_pystysuora_kuluma?: Decimal;
  oikea_pystysuora_kuluma?: Decimal;
  vasen_pystysuora_kuluman_keskiarvo?: Decimal;
  oikea_pystysuora_kuluman_keskiarvo?: Decimal;
  vasen_pystysuora_kuluman_keskihajonta?: Decimal;
  oikea_pystysuora_kuluman_keskihajonta?: Decimal;
  vasen_sisapuolinen_sivuttaiskuluma?: Decimal;
  oikea_sisapuolinen_sivuttaiskuluma?: Decimal;
  vasen_sisapuolisen_sivuttaiskuluman_keskiarvo?: Decimal;
  oikea_sisapuolisen_sivuttaiskuluman_keskiarvo?: Decimal;
  vasen_sisapuolisen_sivuttaiskuluman_keskihajonta?: Decimal;
  oikea_sisapuolisen_sivuttaiskuluman_keskihajonta?: Decimal;
  vasen_ulkoinen_sivuttaiskuluma?: Decimal;
  oikea_ulkoinen_sivuttaiskuluma?: Decimal;
  vasen_ulkoisen_sivuttaiskuluman_keskiarvo?: Decimal;
  oikea_ulkoisen_sivuttaiskuluman_keskiarvo?: Decimal;
  vasen_ulkoisen_sivuttaiskuluman_keskihajonta?: Decimal;
  oikea_ulkoisen_sivuttaiskuluman_keskihajonta?: Decimal;
  vasen_kallistus?: Decimal;
  oikea_kallistus?: Decimal;
  vasen_kallistuksen_keskiarvo?: Decimal;
  oikea_kallistuksen_keskiarvo?: Decimal;
  vasen_kallistuksen_keskihajonta?: Decimal;
  oikea_kallistuksen_keskihajonta?: Decimal;
  vasen_45_kuluma?: Decimal;
  oikea_45_kuluma?: Decimal;
  vasen_45_kuluman_keskiarvo?: Decimal;
  oikea_45_kuluman_keskiarvo?: Decimal;
  vasen_45_kuluman_keskihajonta?: Decimal;
  oikea_45_kuluman_keskihajonta?: Decimal;
  vasen_yhdistetty_kuluma?: Decimal;
  oikea_yhdistetty_kuluma?: Decimal;
  vasen_yhdistetyn_kuluman_keskiarvo?: Decimal;
  oikea_yhdistetyn_kuluman_keskiarvo?: Decimal;
  vasen_yhdistetyn_kuluman_keskihajonta?: Decimal;
  oikea_yhdistetyn_kuluman_keskihajonta?: Decimal;
  vasen_poikkileikkauspinta_ala?: Decimal;
  oikea_poikkileikkauspinta_ala?: Decimal;
  vasen_poikkileikkauspinta_alan_keskiarvo?: Decimal;
  oikea_poikkileikkauspinta_alan_keskiarvo?: Decimal;
  vasen_poikkileikkauspinta_alan_keskihajonta?: Decimal;
  oikea_poikkileikkauspinta_alan_keskihajonta?: Decimal;
  vasen_sisapuolinen_purse?: Decimal;
  oikea_sisapuolinen_purse?: Decimal;
  vasen_sisapuolisen_purseen_keskiarvo?: Decimal;
  oikea_sisapuolisen_purseen_keskiarvo?: Decimal;
  vasen_sisapuolisen_purseen_keskihajonta?: Decimal;
  oikea_sisapuolisen_purseen_keskihajonta?: Decimal;
  vasen_ulkopuolinen_purse?: Decimal;
  oikea_ulkopuolinen_purse?: Decimal;
  vasen_ulkopuolisen_purseen_keskiarvo?: Decimal;
  oikea_ulkopuolisen_purseen_keskiarvo?: Decimal;
  vasen_ulkopuolisen_purseen_keskihajonta?: Decimal;
  oikea_ulkopuolisen_purseen_keskihajonta?: Decimal;
  tehollinen_kartiokkuus?: Decimal;
  tehollisen_kartiokkuuden_keskiarvo?: Decimal;
  tehollisen_kartiokkuuden_keskihajonta?: Decimal;
  vasen_kiskon_kallistuksen_kiintea_keskiarvo?: Decimal;
  oikea_kiskon_kallistuksen_kiintea_keskiarvo?: Decimal;
  vasen_kiskon_kallistuksen_kiintea_keskihajonta?: Decimal;
  oikea_kiskon_kallistuksen_kiintea_keskihajonta?: Decimal;
  vasen_pystysuoran_kuluman_kiintea_keskiarvo?: Decimal;
  oikea_pystysuoran_kuluman_kiintea_keskiarvo?: Decimal;
  vasen_pystysuoran_kuluman_kiintea_keskihajonta?: Decimal;
  oikea_pystysuoran_kuluman_kiintea_keskihajonta?: Decimal;
  vasen_sisapuolisen_sivuttaisk_kiintea_keskiarvo?: Decimal;
  oikea_sisapuolisen_sivuttaisk_kiintea_keskiarvo?: Decimal;
  vasen_sisapuolisen_sivuttaisk_kiintea_keskihajonta?: Decimal;
  oikea_sisapuolisen_sivuttaisk_kiintea_keskihajonta?: Decimal;
  vasen_ulkopuolisen_sivuttaisk_kiintea_keskiarvo?: Decimal;
  oikea_ulkopuolisen_sivuttaisk_kiintea_keskiarvo?: Decimal;
  vasen_ulkopuolisen_sivuttaisk_kiintea_keskihajonta?: Decimal;
  oikea_ulkopuolisen_sivuttaisk_kiintea_keskihajonta?: Decimal;
  vasen_45_kuluman_kiintea_keskiarvo?: Decimal;
  oikea_45_kuluman_kiintea_keskiarvo?: Decimal;
  vasen_45_kuluman_kiintea_keskihajonta?: Decimal;
  oikea_45_kuluman_kiintea_keskihajonta?: Decimal;
  vasen_yhdistetyn_kuluman_kiintea_keskiarvo?: Decimal;
  oikea_yhdistetyn_kuluman_kiintea_keskiarvo?: Decimal;
  vasen_yhdistetyn_kuluman_kiintea_keskihajonta?: Decimal;
  oikea_yhdistetyn_kuluman_kiintea_keskihajonta?: Decimal;
  vasen_poikkileikkauspinta_alan_kiintea_keskiarvo?: Decimal;
  oikea_poikkileikkauspinta_alan_kiintea_keskiarvo?: Decimal;
  vasen_poikkileikkauspint_alan_kiintea_keskihajonta?: Decimal;
  oikea_poikkileikkauspint_alan_kiintea_keskihajonta?: Decimal;
  vasen_sisapuolisen_purseen_kiintea_keskiarvo?: Decimal;
  oikea_sisapuolisen_purseen_kiintea_keskiarvo?: Decimal;
  vasen_sisapuolisen_purseen_kiintea_keskihajonta?: Decimal;
  oikea_sisapuolisen_purseen_kiintea_keskihajonta?: Decimal;
  vasen_ulkopuolisen_purseen_kiintea_keskiarvo?: Decimal;
  oikea_ulkopuolisen_purseen_kiintea_keskiarvo?: Decimal;
  vasen_ulkopulisen_purseen_kiintea_keskihajonta?: Decimal;
  oikea_ulkopuolisen_purseen_kiintea_keskihajonta?: Decimal;
  tehollisen_kartiokkuuden_kiintea_keskiarvo?: Decimal;
  tehollisen_kartiokkuuden_kiintea_keskihajonta?: Decimal;
  vasen_poikkipinta_alan_poikkeama?: Decimal;
  oikea_poikkipinta_alan_poikkeama?: Decimal;
  rp_ajonopeus?: Decimal;
  track?: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  rataosuus_numero?: string;
  rata_kilometri?: number;
  rata_metrit?: Decimal;
  lat?: Decimal;
  long?: Decimal;
  created?: Date;
  modified?: Date;
};

export function convertDataToRpMittausArray(data: any[]): rp_mittaus[] {
  return data.map(item => ({
    id: parseInt(item.id, 10),
    raportti_id: parseInt(item.raportti_id, 10),
    running_date: new Date(item.running_date),
    jarjestelma: item.jarjestelma || undefined,
    sscount: item.sscount ? parseInt(item.sscount, 10) : undefined,
    sijainti: item.sijainti, // Handle Unsupported("geography") appropriately
    ajonopeus: item.ajonopeus ? new Decimal(item.ajonopeus) : undefined,
    vasen_pystysuora_kuluma: item.vasen_pystysuora_kuluma
      ? new Decimal(item.vasen_pystysuora_kuluma)
      : undefined,
    oikea_pystysuora_kuluma: item.oikea_pystysuora_kuluma
      ? new Decimal(item.oikea_pystysuora_kuluma)
      : undefined,
    vasen_pystysuora_kuluman_keskiarvo: item.vasen_pystysuora_kuluman_keskiarvo
      ? new Decimal(item.vasen_pystysuora_kuluman_keskiarvo)
      : undefined,
    oikea_pystysuora_kuluman_keskiarvo: item.oikea_pystysuora_kuluman_keskiarvo
      ? new Decimal(item.oikea_pystysuora_kuluman_keskiarvo)
      : undefined,
    vasen_pystysuora_kuluman_keskihajonta:
      item.vasen_pystysuora_kuluman_keskihajonta
        ? new Decimal(item.vasen_pystysuora_kuluman_keskihajonta)
        : undefined,
    oikea_pystysuora_kuluman_keskihajonta:
      item.oikea_pystysuora_kuluman_keskihajonta
        ? new Decimal(item.oikea_pystysuora_kuluman_keskihajonta)
        : undefined,
    vasen_sisapuolinen_sivuttaiskuluma: item.vasen_sisapuolinen_sivuttaiskuluma
      ? new Decimal(item.vasen_sisapuolinen_sivuttaiskuluma)
      : undefined,
    oikea_sisapuolinen_sivuttaiskuluma: item.oikea_sisapuolinen_sivuttaiskuluma
      ? new Decimal(item.oikea_sisapuolinen_sivuttaiskuluma)
      : undefined,
    vasen_sisapuolisen_sivuttaiskuluman_keskiarvo:
      item.vasen_sisapuolisen_sivuttaiskuluman_keskiarvo
        ? new Decimal(item.vasen_sisapuolisen_sivuttaiskuluman_keskiarvo)
        : undefined,
    oikea_sisapuolisen_sivuttaiskuluman_keskiarvo:
      item.oikea_sisapuolisen_sivuttaiskuluman_keskiarvo
        ? new Decimal(item.oikea_sisapuolisen_sivuttaiskuluman_keskiarvo)
        : undefined,
    vasen_sisapuolisen_sivuttaiskuluman_keskihajonta:
      item.vasen_sisapuolisen_sivuttaiskuluman_keskihajonta
        ? new Decimal(item.vasen_sisapuolisen_sivuttaiskuluman_keskihajonta)
        : undefined,
    oikea_sisapuolisen_sivuttaiskuluman_keskihajonta:
      item.oikea_sisapuolisen_sivuttaiskuluman_keskihajonta
        ? new Decimal(item.oikea_sisapuolisen_sivuttaiskuluman_keskihajonta)
        : undefined,
    vasen_ulkoinen_sivuttaiskuluma: item.vasen_ulkoinen_sivuttaiskuluma
      ? new Decimal(item.vasen_ulkoinen_sivuttaiskuluma)
      : undefined,
    oikea_ulkoinen_sivuttaiskuluma: item.oikea_ulkoinen_sivuttaiskuluma
      ? new Decimal(item.oikea_ulkoinen_sivuttaiskuluma)
      : undefined,
    vasen_ulkoisen_sivuttaiskuluman_keskiarvo:
      item.vasen_ulkoisen_sivuttaiskuluman_keskiarvo
        ? new Decimal(item.vasen_ulkoisen_sivuttaiskuluman_keskiarvo)
        : undefined,
    oikea_ulkoisen_sivuttaiskuluman_keskiarvo:
      item.oikea_ulkoisen_sivuttaiskuluman_keskiarvo
        ? new Decimal(item.oikea_ulkoisen_sivuttaiskuluman_keskiarvo)
        : undefined,
    vasen_ulkoisen_sivuttaiskuluman_keskihajonta:
      item.vasen_ulkoisen_sivuttaiskuluman_keskihajonta
        ? new Decimal(item.vasen_ulkoisen_sivuttaiskuluman_keskihajonta)
        : undefined,
    oikea_ulkoisen_sivuttaiskuluman_keskihajonta:
      item.oikea_ulkoisen_sivuttaiskuluman_keskihajonta
        ? new Decimal(item.oikea_ulkoisen_sivuttaiskuluman_keskihajonta)
        : undefined,
    vasen_kallistus: item.vasen_kallistus
      ? new Decimal(item.vasen_kallistus)
      : undefined,
    oikea_kallistus: item.oikea_kallistus
      ? new Decimal(item.oikea_kallistus)
      : undefined,
    vasen_kallistuksen_keskiarvo: item.vasen_kallistuksen_keskiarvo
      ? new Decimal(item.vasen_kallistuksen_keskiarvo)
      : undefined,
    oikea_kallistuksen_keskiarvo: item.oikea_kallistuksen_keskiarvo
      ? new Decimal(item.oikea_kallistuksen_keskiarvo)
      : undefined,
    vasen_kallistuksen_keskihajonta: item.vasen_kallistuksen_keskihajonta
      ? new Decimal(item.vasen_kallistuksen_keskihajonta)
      : undefined,
    oikea_kallistuksen_keskihajonta: item.oikea_kallistuksen_keskihajonta
      ? new Decimal(item.oikea_kallistuksen_keskihajonta)
      : undefined,
    vasen_45_kuluma: item.vasen_45_kuluma
      ? new Decimal(item.vasen_45_kuluma)
      : undefined,
    oikea_45_kuluma: item.oikea_45_kuluma
      ? new Decimal(item.oikea_45_kuluma)
      : undefined,
    vasen_45_kuluman_keskiarvo: item.vasen_45_kuluman_keskiarvo
      ? new Decimal(item.vasen_45_kuluman_keskiarvo)
      : undefined,
    oikea_45_kuluman_keskiarvo: item.oikea_45_kuluman_keskiarvo
      ? new Decimal(item.oikea_45_kuluman_keskiarvo)
      : undefined,
    vasen_45_kuluman_keskihajonta: item.vasen_45_kuluman_keskihajonta
      ? new Decimal(item.vasen_45_kuluman_keskihajonta)
      : undefined,
    oikea_45_kuluman_keskihajonta: item.oikea_45_kuluman_keskihajonta
      ? new Decimal(item.oikea_45_kuluman_keskihajonta)
      : undefined,
    vasen_yhdistetty_kuluma: item.vasen_yhdistetty_kuluma
      ? new Decimal(item.vasen_yhdistetty_kuluma)
      : undefined,
    oikea_yhdistetty_kuluma: item.oikea_yhdistetty_kuluma
      ? new Decimal(item.oikea_yhdistetty_kuluma)
      : undefined,
    vasen_yhdistetyn_kuluman_keskiarvo: item.vasen_yhdistetyn_kuluman_keskiarvo
      ? new Decimal(item.vasen_yhdistetyn_kuluman_keskiarvo)
      : undefined,
    oikea_yhdistetyn_kuluman_keskiarvo: item.oikea_yhdistetyn_kuluman_keskiarvo
      ? new Decimal(item.oikea_yhdistetyn_kuluman_keskiarvo)
      : undefined,
    vasen_yhdistetyn_kuluman_keskihajonta:
      item.vasen_yhdistetyn_kuluman_keskihajonta
        ? new Decimal(item.vasen_yhdistetyn_kuluman_keskihajonta)
        : undefined,
    oikea_yhdistetyn_kuluman_keskihajonta:
      item.oikea_yhdistetyn_kuluman_keskihajonta
        ? new Decimal(item.oikea_yhdistetyn_kuluman_keskihajonta)
        : undefined,
    vasen_poikkileikkauspinta_ala: item.vasen_poikkileikkauspinta_ala
      ? new Decimal(item.vasen_poikkileikkauspinta_ala)
      : undefined,
    oikea_poikkileikkauspinta_ala: item.oikea_poikkileikkauspinta_ala
      ? new Decimal(item.oikea_poikkileikkauspinta_ala)
      : undefined,
    vasen_poikkileikkauspinta_alan_keskiarvo:
      item.vasen_poikkileikkauspinta_alan_keskiarvo
        ? new Decimal(item.vasen_poikkileikkauspinta_alan_keskiarvo)
        : undefined,
    oikea_poikkileikkauspinta_alan_keskiarvo:
      item.oikea_poikkileikkauspinta_alan_keskiarvo
        ? new Decimal(item.oikea_poikkileikkauspinta_alan_keskiarvo)
        : undefined,
    vasen_poikkileikkauspinta_alan_keskihajonta:
      item.vasen_poikkileikkauspinta_alan_keskihajonta
        ? new Decimal(item.vasen_poikkileikkauspinta_alan_keskihajonta)
        : undefined,
    oikea_poikkileikkauspinta_alan_keskihajonta:
      item.oikea_poikkileikkauspinta_alan_keskihajonta
        ? new Decimal(item.oikea_poikkileikkauspinta_alan_keskihajonta)
        : undefined,
    vasen_sisapuolinen_purse: item.vasen_sisapuolinen_purse
      ? new Decimal(item.vasen_sisapuolinen_purse)
      : undefined,
    oikea_sisapuolinen_purse: item.oikea_sisapuolinen_purse
      ? new Decimal(item.oikea_sisapuolinen_purse)
      : undefined,
    vasen_sisapuolisen_purseen_keskiarvo:
      item.vasen_sisapuolisen_purseen_keskiarvo
        ? new Decimal(item.vasen_sisapuolisen_purseen_keskiarvo)
        : undefined,
    oikea_sisapuolisen_purseen_keskiarvo:
      item.oikea_sisapuolisen_purseen_keskiarvo
        ? new Decimal(item.oikea_sisapuolisen_purseen_keskiarvo)
        : undefined,
    vasen_sisapuolisen_purseen_keskihajonta:
      item.vasen_sisapuolisen_purseen_keskihajonta
        ? new Decimal(item.vasen_sisapuolisen_purseen_keskihajonta)
        : undefined,
    oikea_sisapuolisen_purseen_keskihajonta:
      item.oikea_sisapuolisen_purseen_keskihajonta
        ? new Decimal(item.oikea_sisapuolisen_purseen_keskihajonta)
        : undefined,
    vasen_ulkopuolinen_purse: item.vasen_ulkopuolinen_purse
      ? new Decimal(item.vasen_ulkopuolinen_purse)
      : undefined,
    oikea_ulkopuolinen_purse: item.oikea_ulkopuolinen_purse
      ? new Decimal(item.oikea_ulkopuolinen_purse)
      : undefined,
    vasen_ulkopuolisen_purseen_keskiarvo:
      item.vasen_ulkopuolisen_purseen_keskiarvo
        ? new Decimal(item.vasen_ulkopuolisen_purseen_keskiarvo)
        : undefined,
    oikea_ulkopuolisen_purseen_keskiarvo:
      item.oikea_ulkopuolisen_purseen_keskiarvo
        ? new Decimal(item.oikea_ulkopuolisen_purseen_keskiarvo)
        : undefined,
    vasen_ulkopuolisen_purseen_keskihajonta:
      item.vasen_ulkopuolisen_purseen_keskihajonta
        ? new Decimal(item.vasen_ulkopuolisen_purseen_keskihajonta)
        : undefined,
    oikea_ulkopuolisen_purseen_keskihajonta:
      item.oikea_ulkopuolisen_purseen_keskihajonta
        ? new Decimal(item.oikea_ulkopuolisen_purseen_keskihajonta)
        : undefined,
    tehollinen_kartiokkuus: item.tehollinen_kartiokkuus
      ? new Decimal(item.tehollinen_kartiokkuus)
      : undefined,
    tehollisen_kartiokkuuden_keskiarvo: item.tehollisen_kartiokkuuden_keskiarvo
      ? new Decimal(item.tehollisen_kartiokkuuden_keskiarvo)
      : undefined,
    tehollisen_kartiokkuuden_keskihajonta:
      item.tehollisen_kartiokkuuden_keskihajonta
        ? new Decimal(item.tehollisen_kartiokkuuden_keskihajonta)
        : undefined,
    vasen_kiskon_kallistuksen_kiintea_keskiarvo:
      item.vasen_kiskon_kallistuksen_kiintea_keskiarvo
        ? new Decimal(item.vasen_kiskon_kallistuksen_kiintea_keskiarvo)
        : undefined,
    oikea_kiskon_kallistuksen_kiintea_keskiarvo:
      item.oikea_kiskon_kallistuksen_kiintea_keskiarvo
        ? new Decimal(item.oikea_kiskon_kallistuksen_kiintea_keskiarvo)
        : undefined,
    vasen_kiskon_kallistuksen_kiintea_keskihajonta:
      item.vasen_kiskon_kallistuksen_kiintea_keskihajonta
        ? new Decimal(item.vasen_kiskon_kallistuksen_kiintea_keskihajonta)
        : undefined,
    oikea_kiskon_kallistuksen_kiintea_keskihajonta:
      item.oikea_kiskon_kallistuksen_kiintea_keskihajonta
        ? new Decimal(item.oikea_kiskon_kallistuksen_kiintea_keskihajonta)
        : undefined,
    vasen_pystysuoran_kuluman_kiintea_keskiarvo:
      item.vasen_pystysuoran_kuluman_kiintea_keskiarvo
        ? new Decimal(item.vasen_pystysuoran_kuluman_kiintea_keskiarvo)
        : undefined,
    oikea_pystysuoran_kuluman_kiintea_keskiarvo:
      item.oikea_pystysuoran_kuluman_kiintea_keskiarvo
        ? new Decimal(item.oikea_pystysuoran_kuluman_kiintea_keskiarvo)
        : undefined,
    vasen_pystysuoran_kuluman_kiintea_keskihajonta:
      item.vasen_pystysuoran_kuluman_kiintea_keskihajonta
        ? new Decimal(item.vasen_pystysuoran_kuluman_kiintea_keskihajonta)
        : undefined,
    oikea_pystysuoran_kuluman_kiintea_keskihajonta:
      item.oikea_pystysuoran_kuluman_kiintea_keskihajonta
        ? new Decimal(item.oikea_pystysuoran_kuluman_kiintea_keskihajonta)
        : undefined,
    vasen_sisapuolisen_sivuttaisk_kiintea_keskiarvo:
      item.vasen_sisapuolisen_sivuttaisk_kiintea_keskiarvo
        ? new Decimal(item.vasen_sisapuolisen_sivuttaisk_kiintea_keskiarvo)
        : undefined,
    oikea_sisapuolisen_sivuttaisk_kiintea_keskiarvo:
      item.oikea_sisapuolisen_sivuttaisk_kiintea_keskiarvo
        ? new Decimal(item.oikea_sisapuolisen_sivuttaisk_kiintea_keskiarvo)
        : undefined,
    vasen_sisapuolisen_sivuttaisk_kiintea_keskihajonta:
      item.vasen_sisapuolisen_sivuttaisk_kiintea_keskihajonta
        ? new Decimal(item.vasen_sisapuolisen_sivuttaisk_kiintea_keskihajonta)
        : undefined,
    oikea_sisapuolisen_sivuttaisk_kiintea_keskihajonta:
      item.oikea_sisapuolisen_sivuttaisk_kiintea_keskihajonta
        ? new Decimal(item.oikea_sisapuolisen_sivuttaisk_kiintea_keskihajonta)
        : undefined,
    vasen_ulkopuolisen_sivuttaisk_kiintea_keskiarvo:
      item.vasen_ulkopuolisen_sivuttaisk_kiintea_keskiarvo
        ? new Decimal(item.vasen_ulkopuolisen_sivuttaisk_kiintea_keskiarvo)
        : undefined,
    oikea_ulkopuolisen_sivuttaisk_kiintea_keskiarvo:
      item.oikea_ulkopuolisen_sivuttaisk_kiintea_keskiarvo
        ? new Decimal(item.oikea_ulkopuolisen_sivuttaisk_kiintea_keskiarvo)
        : undefined,
    vasen_ulkopuolisen_sivuttaisk_kiintea_keskihajonta:
      item.vasen_ulkopuolisen_sivuttaisk_kiintea_keskihajonta
        ? new Decimal(item.vasen_ulkopuolisen_sivuttaisk_kiintea_keskihajonta)
        : undefined,
    oikea_ulkopuolisen_sivuttaisk_kiintea_keskihajonta:
      item.oikea_ulkopuolisen_sivuttaisk_kiintea_keskihajonta
        ? new Decimal(item.oikea_ulkopuolisen_sivuttaisk_kiintea_keskihajonta)
        : undefined,
    vasen_kiskon_sivuttaiskuluman_keskiarvo:
      item.vasen_kiskon_sivuttaiskuluman_keskiarvo
        ? new Decimal(item.vasen_kiskon_sivuttaiskuluman_keskiarvo)
        : undefined,
    oikea_kiskon_sivuttaiskuluman_keskiarvo:
      item.oikea_kiskon_sivuttaiskuluman_keskiarvo
        ? new Decimal(item.oikea_kiskon_sivuttaiskuluman_keskiarvo)
        : undefined,
    vasen_kiskon_sivuttaiskuluman_keskihajonta:
      item.vasen_kiskon_sivuttaiskuluman_keskihajonta
        ? new Decimal(item.vasen_kiskon_sivuttaiskuluman_keskihajonta)
        : undefined,
    oikea_kiskon_sivuttaiskuluman_keskihajonta:
      item.oikea_kiskon_sivuttaiskuluman_keskihajonta
        ? new Decimal(item.oikea_kiskon_sivuttaiskuluman_keskihajonta)
        : undefined,
    vasen_1_3_kuluma: item.vasen_1_3_kuluma
      ? new Decimal(item.vasen_1_3_kuluma)
      : undefined,
    oikea_1_3_kuluma: item.oikea_1_3_kuluma
      ? new Decimal(item.oikea_1_3_kuluma)
      : undefined,
    vasen_1_3_kuluman_keskiarvo: item.vasen_1_3_kuluman_keskiarvo
      ? new Decimal(item.vasen_1_3_kuluman_keskiarvo)
      : undefined,
    oikea_1_3_kuluman_keskiarvo: item.oikea_1_3_kuluman_keskiarvo
      ? new Decimal(item.oikea_1_3_kuluman_keskiarvo)
      : undefined,
    vasen_1_3_kuluman_keskihajonta: item.vasen_1_3_kuluman_keskihajonta
      ? new Decimal(item.vasen_1_3_kuluman_keskihajonta)
      : undefined,
    oikea_1_3_kuluman_keskihajonta: item.oikea_1_3_kuluman_keskihajonta
      ? new Decimal(item.oikea_1_3_kuluman_keskihajonta)
      : undefined,
    vasen_1_3_yhdistetty_kuluma: item.vasen_1_3_yhdistetty_kuluma
      ? new Decimal(item.vasen_1_3_yhdistetty_kuluma)
      : undefined,
    oikea_1_3_yhdistetty_kuluma: item.oikea_1_3_yhdistetty_kuluma
      ? new Decimal(item.oikea_1_3_yhdistetty_kuluma)
      : undefined,
    vasen_1_3_yhdistetyn_kuluman_keskiarvo:
      item.vasen_1_3_yhdistetyn_kuluman_keskiarvo
        ? new Decimal(item.vasen_1_3_yhdistetyn_kuluman_keskiarvo)
        : undefined,
    oikea_1_3_yhdistetyn_kuluman_keskiarvo:
      item.oikea_1_3_yhdistetyn_kuluman_keskiarvo
        ? new Decimal(item.oikea_1_3_yhdistetyn_kuluman_keskiarvo)
        : undefined,
    vasen_1_3_yhdistetyn_kuluman_keskihajonta:
      item.vasen_1_3_yhdistetyn_kuluman_keskihajonta
        ? new Decimal(item.vasen_1_3_yhdistetyn_kuluman_keskihajonta)
        : undefined,
    oikea_1_3_yhdistetyn_kuluman_keskihajonta:
      item.oikea_1_3_yhdistetyn_kuluman_keskihajonta
        ? new Decimal(item.oikea_1_3_yhdistetyn_kuluman_keskihajonta)
        : undefined,
    vasen_1_3_sivuttaiskuluma: item.vasen_1_3_sivuttaiskuluma
      ? new Decimal(item.vasen_1_3_sivuttaiskuluma)
      : undefined,
    oikea_1_3_sivuttaiskuluma: item.oikea_1_3_sivuttaiskuluma
      ? new Decimal(item.oikea_1_3_sivuttaiskuluma)
      : undefined,
    vasen_1_3_sivuttaiskuluman_keskiarvo:
      item.vasen_1_3_sivuttaiskuluman_keskiarvo
        ? new Decimal(item.vasen_1_3_sivuttaiskuluman_keskiarvo)
        : undefined,
    oikea_1_3_sivuttaiskuluman_keskiarvo:
      item.oikea_1_3_sivuttaiskuluman_keskiarvo
        ? new Decimal(item.oikea_1_3_sivuttaiskuluman_keskiarvo)
        : undefined,
    vasen_1_3_sivuttaiskuluman_keskihajonta:
      item.vasen_1_3_sivuttaiskuluman_keskihajonta
        ? new Decimal(item.vasen_1_3_sivuttaiskuluman_keskihajonta)
        : undefined,
    oikea_1_3_sivuttaiskuluman_keskihajonta:
      item.oikea_1_3_sivuttaiskuluman_keskihajonta
        ? new Decimal(item.oikea_1_3_sivuttaiskuluman_keskihajonta)
        : undefined,
    vasen_1_3_kallistus: item.vasen_1_3_kallistus
      ? new Decimal(item.vasen_1_3_kallistus)
      : undefined,
    oikea_1_3_kallistus: item.oikea_1_3_kallistus
      ? new Decimal(item.oikea_1_3_kallistus)
      : undefined,
    vasen_1_3_kallistuksen_keskiarvo: item.vasen_1_3_kallistuksen_keskiarvo
      ? new Decimal(item.vasen_1_3_kallistuksen_keskiarvo)
      : undefined,
    oikea_1_3_kallistuksen_keskiarvo: item.oikea_1_3_kallistuksen_keskiarvo
      ? new Decimal(item.oikea_1_3_kallistuksen_keskiarvo)
      : undefined,
    vasen_1_3_kallistuksen_keskihajonta:
      item.vasen_1_3_kallistuksen_keskihajonta
        ? new Decimal(item.vasen_1_3_kallistuksen_keskihajonta)
        : undefined,
    oikea_1_3_kallistuksen_keskihajonta:
      item.oikea_1_3_kallistuksen_keskihajonta
        ? new Decimal(item.oikea_1_3_kallistuksen_keskihajonta)
        : undefined,
    vasen_1_3_yhdistetyn_kuluman_kiintea_keskiarvo:
      item.vasen_1_3_yhdistetyn_kuluman_kiintea_keskiarvo
        ? new Decimal(item.vasen_1_3_yhdistetyn_kuluman_kiintea_keskiarvo)
        : undefined,
    oikea_1_3_yhdistetyn_kuluman_kiintea_keskiarvo:
      item.oikea_1_3_yhdistetyn_kuluman_kiintea_keskiarvo
        ? new Decimal(item.oikea_1_3_yhdistetyn_kuluman_kiintea_keskiarvo)
        : undefined,
    vasen_1_3_yhdistetyn_kuluman_kiintea_keskihajonta:
      item.vasen_1_3_yhdistetyn_kuluman_kiintea_keskihajonta
        ? new Decimal(item.vasen_1_3_yhdistetyn_kuluman_kiintea_keskihajonta)
        : undefined,
    oikea_1_3_yhdistetyn_kuluman_kiintea_keskihajonta:
      item.oikea_1_3_yhdistetyn_kuluman_kiintea_keskihajonta
        ? new Decimal(item.oikea_1_3_yhdistetyn_kuluman_kiintea_keskihajonta)
        : undefined,
    vasen_1_3_yhdistetyn_sivuttaiskuluman_keskiarvo:
      item.vasen_1_3_yhdistetyn_sivuttaiskuluman_keskiarvo
        ? new Decimal(item.vasen_1_3_yhdistetyn_sivuttaiskuluman_keskiarvo)
        : undefined,
    oikea_1_3_yhdistetyn_sivuttaiskuluman_keskiarvo:
      item.oikea_1_3_yhdistetyn_sivuttaiskuluman_keskiarvo
        ? new Decimal(item.oikea_1_3_yhdistetyn_sivuttaiskuluman_keskiarvo)
        : undefined,
    vasen_1_3_yhdistetyn_sivuttaiskuluman_keskihajonta:
      item.vasen_1_3_yhdistetyn_sivuttaiskuluman_keskihajonta
        ? new Decimal(item.vasen_1_3_yhdistetyn_sivuttaiskuluman_keskihajonta)
        : undefined,
    oikea_1_3_yhdistetyn_sivuttaiskuluman_keskihajonta:
      item.oikea_1_3_yhdistetyn_sivuttaiskuluman_keskihajonta
        ? new Decimal(item.oikea_1_3_yhdistetyn_sivuttaiskuluman_keskihajonta)
        : undefined,
    vasen_1_3_yhdistetyn_kallistuksen_keskiarvo:
      item.vasen_1_3_yhdistetyn_kallistuksen_keskiarvo
        ? new Decimal(item.vasen_1_3_yhdistetyn_kallistuksen_keskiarvo)
        : undefined,
    oikea_1_3_yhdistetyn_kallistuksen_keskiarvo:
      item.oikea_1_3_yhdistetyn_kallistuksen_keskiarvo
        ? new Decimal(item.oikea_1_3_yhdistetyn_kallistuksen_keskiarvo)
        : undefined,
    vasen_1_3_yhdistetyn_kallistuksen_keskihajonta:
      item.vasen_1_3_yhdistetyn_kallistuksen_keskihajonta
        ? new Decimal(item.vasen_1_3_yhdistetyn_kallistuksen_keskihajonta)
        : undefined,
    oikea_1_3_yhdistetyn_kallistuksen_keskihajonta:
      item.oikea_1_3_yhdistetyn_kallistuksen_keskihajonta
        ? new Decimal(item.oikea_1_3_yhdistetyn_kallistuksen_keskihajonta)
        : undefined,
  }));
}

type tg_mittaus = {
  id?: number;
  raportti_id: number;
  running_date: Date;
  jarjestelma?: jarjestelma;
  sscount?: number;
  sijainti?: any; // Unsupported type, left as-is
  ajonopeus?: Decimal;
  raideleveyden_poikkeama?: Decimal;
  kallistus?: Decimal;
  kallistuksen_poikkeama?: Decimal;
  kierous?: Decimal;
  kaarevuus?: Decimal;
  raideleveyden_poikkeaman_muutos?: Decimal;
  kierouden_poikkeama?: Decimal;
  vasen_korkeuspoikkeama_d1?: Decimal;
  vasen_korkeuspoikkeama_d2?: Decimal;
  oikea_korkeuspoikkeama_d2?: Decimal;
  vasen_korkeuspoikkeama_d3?: Decimal;
  oikea_korkeuspoikkeama_d3?: Decimal;
  vasen_nuolikorkeuspoikkeama_d1?: Decimal;
  oikea_nuolikorkeuspoikkeama_d1?: Decimal;
  vasen_nuolikorkeuspoikkeama_d2?: Decimal;
  oikea_nuolikorkeuspoikkeama_d2?: Decimal;
  vasen_nuolikorkeuspoikkeama_d3?: Decimal;
  oikea_nuolikorkeuspoikkeama_d3?: Decimal;
  gradient?: Decimal;
  raideleveyden?: Decimal;
  oikea_korkeuspoikkeama_d1?: Decimal;
  raideleveyden_keskihajonta?: Decimal;
  kallistus_keskihajonta?: Decimal;
  kierouden_keskihajonta?: Decimal;
  vasen_korkeuspoikkeama_d1_keskihajonta?: Decimal;
  oikea_korkeuspoikkeama_d1_keskihajonta?: Decimal;
  vasen_nuolikorkeus_d1_keskihajonta?: Decimal;
  oikea_nuolikorkeus_d1_keskihajonta?: Decimal;
  vasen_korkeuspoikkema_d0?: Decimal;
  oikea_korkeuspoikkema_d0?: Decimal;
  vasen_korkeuspoikkema_d0_keskihajonta?: Decimal;
  oikea_korkeuspoikkema_d0_keskihajonta?: Decimal;
  track?: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  rataosuus_numero?: string;
  rataosuus_nimi?: string;
  raide_numero?: string;
  rata_kilometri?: number;
  rata_metrit?: Decimal;
  lat?: Decimal;
  long?: Decimal;
  created?: Date;
  modified?: Date;
};

export function convertDataToTgMittausArray(data: any[]): tg_mittaus[] {
  return data.map(item => ({
    raportti_id: parseInt(item.raportti_id, 10),
    running_date: new Date(item.running_date),
    jarjestelma: item.jarjestelma || undefined,
    sscount: item.sscount ? parseInt(item.sscount, 10) : undefined,
    sijainti: item.sijainti || undefined, // Geography unsupported, left as-is
    ajonopeus: item.ajonopeus ? new Decimal(item.ajonopeus) : undefined,
    raideleveyden_poikkeama: item.raideleveyden_poikkeama
      ? new Decimal(item.raideleveyden_poikkeama)
      : undefined,
    kallistus: item.kallistus ? new Decimal(item.kallistus) : undefined,
    kallistuksen_poikkeama: item.kallistuksen_poikkeama
      ? new Decimal(item.kallistuksen_poikkeama)
      : undefined,
    kierous: item.kierous ? new Decimal(item.kierous) : undefined,
    kaarevuus: item.kaarevuus ? new Decimal(item.kaarevuus) : undefined,
    raideleveyden_poikkeaman_muutos: item.raideleveyden_poikkeaman_muutos
      ? new Decimal(item.raideleveyden_poikkeaman_muutos)
      : undefined,
    kierouden_poikkeama: item.kierouden_poikkeama
      ? new Decimal(item.kierouden_poikkeama)
      : undefined,
    vasen_korkeuspoikkeama_d1: item.vasen_korkeuspoikkeama_d1
      ? new Decimal(item.vasen_korkeuspoikkeama_d1)
      : undefined,
    vasen_korkeuspoikkeama_d2: item.vasen_korkeuspoikkeama_d2
      ? new Decimal(item.vasen_korkeuspoikkeama_d2)
      : undefined,
    oikea_korkeuspoikkeama_d2: item.oikea_korkeuspoikkeama_d2
      ? new Decimal(item.oikea_korkeuspoikkeama_d2)
      : undefined,
    vasen_korkeuspoikkeama_d3: item.vasen_korkeuspoikkeama_d3
      ? new Decimal(item.vasen_korkeuspoikkeama_d3)
      : undefined,
    oikea_korkeuspoikkeama_d3: item.oikea_korkeuspoikkeama_d3
      ? new Decimal(item.oikea_korkeuspoikkeama_d3)
      : undefined,
    vasen_nuolikorkeuspoikkeama_d1: item.vasen_nuolikorkeuspoikkeama_d1
      ? new Decimal(item.vasen_nuolikorkeuspoikkeama_d1)
      : undefined,
    oikea_nuolikorkeuspoikkeama_d1: item.oikea_nuolikorkeuspoikkeama_d1
      ? new Decimal(item.oikea_nuolikorkeuspoikkeama_d1)
      : undefined,
    vasen_nuolikorkeuspoikkeama_d2: item.vasen_nuolikorkeuspoikkeama_d2
      ? new Decimal(item.vasen_nuolikorkeuspoikkeama_d2)
      : undefined,
    oikea_nuolikorkeuspoikkeama_d2: item.oikea_nuolikorkeuspoikkeama_d2
      ? new Decimal(item.oikea_nuolikorkeuspoikkeama_d2)
      : undefined,
    vasen_nuolikorkeuspoikkeama_d3: item.vasen_nuolikorkeuspoikkeama_d3
      ? new Decimal(item.vasen_nuolikorkeuspoikkeama_d3)
      : undefined,
    oikea_nuolikorkeuspoikkeama_d3: item.oikea_nuolikorkeuspoikkeama_d3
      ? new Decimal(item.oikea_nuolikorkeuspoikkeama_d3)
      : undefined,
    gradient: item.gradient ? new Decimal(item.gradient) : undefined,
    raideleveyden: item.raideleveyden
      ? new Decimal(item.raideleveyden)
      : undefined,
    oikea_korkeuspoikkeama_d1: item.oikea_korkeuspoikkeama_d1
      ? new Decimal(item.oikea_korkeuspoikkeama_d1)
      : undefined,
    raideleveyden_keskihajonta: item.raideleveyden_keskihajonta
      ? new Decimal(item.raideleveyden_keskihajonta)
      : undefined,
    kallistus_keskihajonta: item.kallistus_keskihajonta
      ? new Decimal(item.kallistus_keskihajonta)
      : undefined,
    kierouden_keskihajonta: item.kierouden_keskihajonta
      ? new Decimal(item.kierouden_keskihajonta)
      : undefined,
    vasen_korkeuspoikkeama_d1_keskihajonta:
      item.vasen_korkeuspoikkeama_d1_keskihajonta
        ? new Decimal(item.vasen_korkeuspoikkeama_d1_keskihajonta)
        : undefined,
    oikea_korkeuspoikkeama_d1_keskihajonta:
      item.oikea_korkeuspoikkeama_d1_keskihajonta
        ? new Decimal(item.oikea_korkeuspoikkeama_d1_keskihajonta)
        : undefined,
    vasen_nuolikorkeus_d1_keskihajonta: item.vasen_nuolikorkeus_d1_keskihajonta
      ? new Decimal(item.vasen_nuolikorkeus_d1_keskihajonta)
      : undefined,
    oikea_nuolikorkeus_d1_keskihajonta: item.oikea_nuolikorkeus_d1_keskihajonta
      ? new Decimal(item.oikea_nuolikorkeus_d1_keskihajonta)
      : undefined,
    vasen_korkeuspoikkema_d0: item.vasen_korkeuspoikkema_d0
      ? new Decimal(item.vasen_korkeuspoikkema_d0)
      : undefined,
    oikea_korkeuspoikkema_d0: item.oikea_korkeuspoikkema_d0
      ? new Decimal(item.oikea_korkeuspoikkema_d0)
      : undefined,
    vasen_korkeuspoikkema_d0_keskihajonta:
      item.vasen_korkeuspoikkema_d0_keskihajonta
        ? new Decimal(item.vasen_korkeuspoikkema_d0_keskihajonta)
        : undefined,
    oikea_korkeuspoikkema_d0_keskihajonta:
      item.oikea_korkeuspoikkema_d0_keskihajonta
        ? new Decimal(item.oikea_korkeuspoikkema_d0_keskihajonta)
        : undefined,
    track: item.track || undefined,
    location: item.location || undefined,
    latitude: item.latitude || undefined,
    longitude: item.longitude || undefined,
    rataosuus_numero: item.rataosuus_numero || undefined,
    rataosuus_nimi: item.rataosuus_nimi || undefined,
    raide_numero: item.raide_numero || undefined,
    rata_kilometri: item.rata_kilometri
      ? parseInt(item.rata_kilometri, 10)
      : undefined,
    rata_metrit: item.rata_metrit ? new Decimal(item.rata_metrit) : undefined,
    lat: item.lat ? new Decimal(item.lat) : undefined,
    long: item.long ? new Decimal(item.long) : undefined,
    created: item.created ? new Date(item.created) : undefined,
    modified: item.modified ? new Date(item.modified) : undefined,
  }));
}

export interface TsightMittaus {
  id?: number;
  raportti_id: number;
  running_date: Date;
  jarjestelma?: jarjestelma;
  sscount?: number;
  sijainti?: any; // Unsupported type, left as-is
  ajonopeus?: Decimal;
  ballast_slope_l?: Decimal;
  ballast_width_l?: Decimal;
  ballast_height_l?: Decimal;
  ballast_slope_r?: Decimal;
  ballast_width_r?: Decimal;
  ballast_height_r?: Decimal;
  platform_center_h_l?: Decimal;
  platform_run_v_l?: Decimal;
  platform_center_h_r?: Decimal;
  platform_run_v_r?: Decimal;
  fin1_kin_min_distance?: Decimal;
  fin1_kin_leftrail_min_dist?: Decimal;
  fin1_kin_rightrail_min_dist?: Decimal;
  sg_mt_kin_min_distance?: Decimal;
  sg_mt_kin_leftrail_min_distance?: Decimal;
  sg_mt_kin_rightrail_min_distance?: Decimal;
  sg_st_kin_min_distance?: Decimal;
  sg_st_kin_leftrail_min_distance?: Decimal;
  sg_st_kin_rightrail_min_distance?: Decimal;
  oversize_kin_min_distance?: Decimal;
  oversize_kin_leftrail_min_distance?: Decimal;
  oversize_kin_rightrail_min_distance?: Decimal;
  gauge_adjacenttrack_left?: Decimal;
  distance_adjacenttrack_left?: Decimal;
  gauge_adjacenttrack_right?: Decimal;
  distance_adjacenttrack_right?: Decimal;
  track?: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  rataosuus_numero?: string;
  rataosuus_nimi?: string;
  raide_numero?: string;
  rata_kilometri?: number;
  rata_metrit?: Decimal;
  lat?: Decimal;
  long?: Decimal;
  created?: Date;
  modified?: Date;
}

export function convertDataToTsightMittausArray(data: any[]): TsightMittaus[] {
  return data.map(item => ({
    raportti_id: parseInt(item.raportti_id, 10),
    running_date: new Date(item.running_date),
    jarjestelma: item.jarjestelma || undefined,
    sscount: item.sscount ? parseInt(item.sscount, 10) : undefined,
    sijainti: item.sijainti || undefined, // Unsupported geography field
    ajonopeus: item.ajonopeus ? new Decimal(item.ajonopeus) : undefined,
    ballast_slope_l: item.ballast_slope_l
      ? new Decimal(item.ballast_slope_l)
      : undefined,
    ballast_width_l: item.ballast_width_l
      ? new Decimal(item.ballast_width_l)
      : undefined,
    ballast_height_l: item.ballast_height_l
      ? new Decimal(item.ballast_height_l)
      : undefined,
    ballast_slope_r: item.ballast_slope_r
      ? new Decimal(item.ballast_slope_r)
      : undefined,
    ballast_width_r: item.ballast_width_r
      ? new Decimal(item.ballast_width_r)
      : undefined,
    ballast_height_r: item.ballast_height_r
      ? new Decimal(item.ballast_height_r)
      : undefined,
    platform_center_h_l: item.platform_center_h_l
      ? new Decimal(item.platform_center_h_l)
      : undefined,
    platform_run_v_l: item.platform_run_v_l
      ? new Decimal(item.platform_run_v_l)
      : undefined,
    platform_center_h_r: item.platform_center_h_r
      ? new Decimal(item.platform_center_h_r)
      : undefined,
    platform_run_v_r: item.platform_run_v_r
      ? new Decimal(item.platform_run_v_r)
      : undefined,
    fin1_kin_min_distance: item.fin1_kin_min_distance
      ? new Decimal(item.fin1_kin_min_distance)
      : undefined,
    fin1_kin_leftrail_min_dist: item.fin1_kin_leftrail_min_dist
      ? new Decimal(item.fin1_kin_leftrail_min_dist)
      : undefined,
    fin1_kin_rightrail_min_dist: item.fin1_kin_rightrail_min_dist
      ? new Decimal(item.fin1_kin_rightrail_min_dist)
      : undefined,
    sg_mt_kin_min_distance: item.sg_mt_kin_min_distance
      ? new Decimal(item.sg_mt_kin_min_distance)
      : undefined,
    sg_mt_kin_leftrail_min_distance: item.sg_mt_kin_leftrail_min_distance
      ? new Decimal(item.sg_mt_kin_leftrail_min_distance)
      : undefined,
    sg_mt_kin_rightrail_min_distance: item.sg_mt_kin_rightrail_min_distance
      ? new Decimal(item.sg_mt_kin_rightrail_min_distance)
      : undefined,
    sg_st_kin_min_distance: item.sg_st_kin_min_distance
      ? new Decimal(item.sg_st_kin_min_distance)
      : undefined,
    sg_st_kin_leftrail_min_distance: item.sg_st_kin_leftrail_min_distance
      ? new Decimal(item.sg_st_kin_leftrail_min_distance)
      : undefined,
    sg_st_kin_rightrail_min_distance: item.sg_st_kin_rightrail_min_distance
      ? new Decimal(item.sg_st_kin_rightrail_min_distance)
      : undefined,
    oversize_kin_min_distance: item.oversize_kin_min_distance
      ? new Decimal(item.oversize_kin_min_distance)
      : undefined,
    oversize_kin_leftrail_min_distance: item.oversize_kin_leftrail_min_distance
      ? new Decimal(item.oversize_kin_leftrail_min_distance)
      : undefined,
    oversize_kin_rightrail_min_distance:
      item.oversize_kin_rightrail_min_distance
        ? new Decimal(item.oversize_kin_rightrail_min_distance)
        : undefined,
    gauge_adjacenttrack_left: item.gauge_adjacenttrack_left
      ? new Decimal(item.gauge_adjacenttrack_left)
      : undefined,
    distance_adjacenttrack_left: item.distance_adjacenttrack_left
      ? new Decimal(item.distance_adjacenttrack_left)
      : undefined,
    gauge_adjacenttrack_right: item.gauge_adjacenttrack_right
      ? new Decimal(item.gauge_adjacenttrack_right)
      : undefined,
    distance_adjacenttrack_right: item.distance_adjacenttrack_right
      ? new Decimal(item.distance_adjacenttrack_right)
      : undefined,
    track: item.track || undefined,
    location: item.location || undefined,
    latitude: item.latitude || undefined,
    longitude: item.longitude || undefined,
    rataosuus_numero: item.rataosuus_numero || undefined,
    rataosuus_nimi: item.rataosuus_nimi || undefined,
    raide_numero: item.raide_numero || undefined,
    rata_kilometri: item.rata_kilometri
      ? parseInt(item.rata_kilometri, 10)
      : undefined,
    rata_metrit: item.rata_metrit ? new Decimal(item.rata_metrit) : undefined,
    lat: item.lat ? new Decimal(item.lat) : undefined,
    long: item.long ? new Decimal(item.long) : undefined,
    created: item.created ? new Date(item.created) : undefined,
    modified: item.modified ? new Date(item.modified) : undefined,
  }));
}
