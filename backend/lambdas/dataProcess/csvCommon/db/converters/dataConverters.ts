import { Decimal } from '@prisma/client/runtime/library';
import { jarjestelma,  ams_mittaus } from '@prisma/client';

function sanitizeValue<T>(value: T) {
  return Number.isNaN(value) || !value || value == 'NaN' ? null : value;
}

type AMSMittausData = {
  raportti_id: number;
  running_date: Date;
  jarjestelma?: jarjestelma | null;
  sscount?: number | null;
  sijainti?: any | null; // This might still need to be handled differently depending on the actual type
  ajonopeus?: Decimal | null;
  oikea_pystysuuntainen_kiihtyvyys_c1?: Decimal | null;
  vasen_pystysuuntainen_kiihtyvyys_c1?: Decimal | null;
  oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu?: Decimal | null;
  vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu?: Decimal | null;
  oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta?: Decimal | null;
  vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta?: Decimal | null;
  oikea_poikittainen_kiihtyvyys_c1?: Decimal | null;
  vasen_poikittainen_kiihtyvyys_c1?: Decimal | null;
  oikea_poikittainen_kiihtyvyys_c1_suodatettu?: Decimal | null;
  vasen_poikittainen_kiihtyvyys_c1_suodatettu?: Decimal | null;
  oikea_poikittainen_kiihtyvyys_c1_keskihajonta?: Decimal | null;
  vasen_poikittainen_kiihtyvyys_c1_keskihajonta?: Decimal | null;
  pystysuuntainen_kiihtyvyys_c2?: Decimal | null;
  pystysuuntainen_kiihtyvyys_c2_suodatettu?: Decimal | null;
  poikittainen_kiihtyvyys_c2?: Decimal | null;
  poikittainen_kiihtyvyys_c2_suodatettu?: Decimal | null;
  transversal_acceleration_c2_mean_to_peak?: Decimal | null;
  pystysuuntainen_kiihtyvyys_c3?: Decimal | null;
  pystysuuntainen_kiihtyvyys_c3_suodatettu?: Decimal | null;
  poikittainen_kiihtyvyys_c3?: Decimal | null;
  poikittainen_kiihtyvyys_c3_suodatettu?: Decimal | null;
  transversal_acceleration_c3_mean_to_peak?: Decimal | null;
  ams_ajonopeus?: Decimal | null;
  track?: string | null;
  location?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  rataosuus_numero?: string | null;
  rataosuus_nimi?: string | null;
  raide_numero?: string | null;
  rata_kilometri?: number | null;
  rata_metrit?: Decimal | null;
  lat?: Decimal | null;
  long?: Decimal | null;
  created?: Date | null;
  modified?: Date | null;
  geoviite_konvertoitu_lat?: Decimal | null;
  geoviite_konvertoitu_long?: Decimal | null;
  geoviite_konvertoitu_rataosuus_numero?: string | null;
  geoviite_konvertoitu_rataosuus_nimi?: string | null;
  geoviite_konvertoitu_raide_numero?: string | null;
  geoviite_konvertoitu_rata_kilometri?: number | null;
  geoviite_konvertoitu_rata_metrit?: Decimal | null;
  geoviite_konvertoitu_sijainti?: any | null;
  geoviite_valimatka?: Decimal | null;
  geoviite_sijaintiraide_kuvaus?: string | null;
  geoviite_sijaintiraide_tyyppi?: string | null;
  geoviite_updated_at?: Date | null;
};

export function convertDataToAMSMittaus(item: any): AMSMittausData {
  return {
    raportti_id: parseInt(item.raportti_id, 10),
    running_date: item.running_date,

    jarjestelma: sanitizeValue(item.jarjestelma),
    sscount: sanitizeValue(item.sscount) ? parseInt(item.sscount, 10) : null,

    ajonopeus: sanitizeValue(item.ajonopeus)
      ? new Decimal(item.ajonopeus)
      : null,
    oikea_pystysuuntainen_kiihtyvyys_c1: sanitizeValue(
      item.oikea_pystysuuntainen_kiihtyvyys_c1,
    )
      ? new Decimal(item.oikea_pystysuuntainen_kiihtyvyys_c1)
      : null,
    vasen_pystysuuntainen_kiihtyvyys_c1: sanitizeValue(
      item.vasen_pystysuuntainen_kiihtyvyys_c1,
    )
      ? new Decimal(item.vasen_pystysuuntainen_kiihtyvyys_c1)
      : null,
    oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: sanitizeValue(
      item.oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu,
    )
      ? new Decimal(item.oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu)
      : null,
    vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: sanitizeValue(
      item.vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu,
    )
      ? new Decimal(item.vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu)
      : null,
    oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: sanitizeValue(
      item.oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta,
    )
      ? new Decimal(item.oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta)
      : null,
    vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: sanitizeValue(
      item.vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta,
    )
      ? new Decimal(item.vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta)
      : null,
    oikea_poikittainen_kiihtyvyys_c1: sanitizeValue(
      item.oikea_poikittainen_kiihtyvyys_c1,
    )
      ? new Decimal(item.oikea_poikittainen_kiihtyvyys_c1)
      : null,
    vasen_poikittainen_kiihtyvyys_c1: sanitizeValue(
      item.vasen_poikittainen_kiihtyvyys_c1,
    )
      ? new Decimal(item.vasen_poikittainen_kiihtyvyys_c1)
      : null,
    oikea_poikittainen_kiihtyvyys_c1_suodatettu: sanitizeValue(
      item.oikea_poikittainen_kiihtyvyys_c1_suodatettu,
    )
      ? new Decimal(item.oikea_poikittainen_kiihtyvyys_c1_suodatettu)
      : null,
    vasen_poikittainen_kiihtyvyys_c1_suodatettu: sanitizeValue(
      item.vasen_poikittainen_kiihtyvyys_c1_suodatettu,
    )
      ? new Decimal(item.vasen_poikittainen_kiihtyvyys_c1_suodatettu)
      : null,
    oikea_poikittainen_kiihtyvyys_c1_keskihajonta: sanitizeValue(
      item.oikea_poikittainen_kiihtyvyys_c1_keskihajonta,
    )
      ? new Decimal(item.oikea_poikittainen_kiihtyvyys_c1_keskihajonta)
      : null,
    vasen_poikittainen_kiihtyvyys_c1_keskihajonta: sanitizeValue(
      item.vasen_poikittainen_kiihtyvyys_c1_keskihajonta,
    )
      ? new Decimal(item.vasen_poikittainen_kiihtyvyys_c1_keskihajonta)
      : null,
    pystysuuntainen_kiihtyvyys_c2: sanitizeValue(
      item.pystysuuntainen_kiihtyvyys_c2,
    )
      ? new Decimal(item.pystysuuntainen_kiihtyvyys_c2)
      : null,
    pystysuuntainen_kiihtyvyys_c2_suodatettu: sanitizeValue(
      item.pystysuuntainen_kiihtyvyys_c2_suodatettu,
    )
      ? new Decimal(item.pystysuuntainen_kiihtyvyys_c2_suodatettu)
      : null,
    poikittainen_kiihtyvyys_c2: sanitizeValue(item.poikittainen_kiihtyvyys_c2)
      ? new Decimal(item.poikittainen_kiihtyvyys_c2)
      : null,
    poikittainen_kiihtyvyys_c2_suodatettu: sanitizeValue(
      item.poikittainen_kiihtyvyys_c2_suodatettu,
    )
      ? new Decimal(item.poikittainen_kiihtyvyys_c2_suodatettu)
      : null,
    transversal_acceleration_c2_mean_to_peak: sanitizeValue(
      item.transversal_acceleration_c2_mean_to_peak,
    )
      ? new Decimal(item.transversal_acceleration_c2_mean_to_peak)
      : null,
    pystysuuntainen_kiihtyvyys_c3: sanitizeValue(
      item.pystysuuntainen_kiihtyvyys_c3,
    )
      ? new Decimal(item.pystysuuntainen_kiihtyvyys_c3)
      : null,
    pystysuuntainen_kiihtyvyys_c3_suodatettu: sanitizeValue(
      item.pystysuuntainen_kiihtyvyys_c3_suodatettu,
    )
      ? new Decimal(item.pystysuuntainen_kiihtyvyys_c3_suodatettu)
      : null,
    poikittainen_kiihtyvyys_c3: sanitizeValue(item.poikittainen_kiihtyvyys_c3)
      ? new Decimal(item.poikittainen_kiihtyvyys_c3)
      : null,
    poikittainen_kiihtyvyys_c3_suodatettu: sanitizeValue(
      item.poikittainen_kiihtyvyys_c3_suodatettu,
    )
      ? new Decimal(item.poikittainen_kiihtyvyys_c3_suodatettu)
      : null,
    transversal_acceleration_c3_mean_to_peak: sanitizeValue(
      item.transversal_acceleration_c3_mean_to_peak,
    )
      ? new Decimal(item.transversal_acceleration_c3_mean_to_peak)
      : null,
    ams_ajonopeus: sanitizeValue(item.ams_ajonopeus)
      ? new Decimal(item.ams_ajonopeus)
      : null,
    track: sanitizeValue(item.track),
    location: sanitizeValue(item.location),
    latitude: sanitizeValue(item.latitude),
    longitude: sanitizeValue(item.longitude),
    rataosuus_numero: sanitizeValue(item.rataosuus_numero),

    rataosuus_nimi: sanitizeValue(item.rataosuus_nimi),
    raide_numero: sanitizeValue(item.raide_numero),
    rata_kilometri: sanitizeValue(item.rata_kilometri)
      ? parseInt(item.rata_kilometri, 10)
      : null,
    rata_metrit: sanitizeValue(item.rata_metrit)
      ? new Decimal(item.rata_metrit)
      : null,
    lat: sanitizeValue(item.lat) ? new Decimal(item.lat) : null,
    long: sanitizeValue(item.long) ? new Decimal(item.long) : null,
    created: sanitizeValue(item.created) ? new Date(item.created) : null,
    modified: sanitizeValue(item.modified) ? new Date(item.modified) : null,
    geoviite_konvertoitu_lat: sanitizeValue(item.geoviite_konvertoitu_lat)
      ? new Decimal(item.geoviite_konvertoitu_lat)
      : null,

    geoviite_konvertoitu_long: sanitizeValue(item.geoviite_konvertoitu_long)
      ? new Decimal(item.geoviite_konvertoitu_long)
      : null,

    geoviite_konvertoitu_rataosuus_numero: sanitizeValue(
      item.geoviite_konvertoitu_rataosuus_numero,
    )
      ? String(item.geoviite_konvertoitu_rataosuus_numero)
      : null,

    geoviite_konvertoitu_rataosuus_nimi: sanitizeValue(
      item.geoviite_konvertoitu_rataosuus_nimi,
    )
      ? String(item.geoviite_konvertoitu_rataosuus_nimi)
      : null,

    geoviite_konvertoitu_raide_numero: sanitizeValue(
      item.geoviite_konvertoitu_raide_numero,
    )
      ? String(item.geoviite_konvertoitu_raide_numero)
      : null,

    geoviite_konvertoitu_rata_kilometri: sanitizeValue(
      item.geoviite_konvertoitu_rata_kilometri,
    )
      ? Number(item.geoviite_konvertoitu_rata_kilometri)
      : null,

    geoviite_konvertoitu_rata_metrit: sanitizeValue(
      item.geoviite_konvertoitu_rata_metrit,
    )
      ? new Decimal(item.geoviite_konvertoitu_rata_metrit)
      : null,

    geoviite_valimatka: sanitizeValue(item.geoviite_valimatka)
      ? new Decimal(item.geoviite_valimatka)
      : null,

    geoviite_sijaintiraide_kuvaus: sanitizeValue(
      item.geoviite_sijaintiraide_kuvaus,
    )
      ? String(item.geoviite_sijaintiraide_kuvaus)
      : null,

    geoviite_sijaintiraide_tyyppi: sanitizeValue(
      item.geoviite_sijaintiraide_tyyppi,
    )
      ? String(item.geoviite_sijaintiraide_tyyppi)
      : null,

    geoviite_updated_at: sanitizeValue(item.geoviite_updated_at)
      ? new Date(item.geoviite_updated_at)
      : null,
  };
}



type OhlMittausData = {
  raportti_id: number;
  running_date: Date;
  jarjestelma?: jarjestelma | null;
  sscount?: number | null;
  sijainti?: any | null; // This might still need to be handled depending on the type for "Unsupported"
  ajonopeus?: Decimal | null;
  siksak_1?: Decimal | null;
  siksak_2?: Decimal | null;
  korkeus_1?: Decimal | null;
  korkeus_2?: Decimal | null;
  jaannospaksuus_1?: Decimal | null;
  jaannospaksuus_2?: Decimal | null;
  risteavien_ajolankojen_etaisyys?: Decimal | null;
  height_gradient?: Decimal | null;
  pinnan_leveys_1?: Decimal | null;
  pinnan_leveys_2?: Decimal | null;
  pinnan_leveyden_keskiarvo_1?: Decimal | null;
  pinnan_leveyden_keskiarvo_2?: Decimal | null;
  pinnan_leveyden_keskihajonta_1?: Decimal | null;
  pinnan_leveyden_keskihajonta_2?: Decimal | null;
  jaannospinta_ala_1?: Decimal | null;
  jaannospinta_ala_2?: Decimal | null;
  jaannospinta_alan_keskiarvo_1?: Decimal | null;
  jaannospinta_alan_keskiarvo_2?: Decimal | null;
  residual_area_stddev_1?: Decimal | null;
  residual_area_stddev_2?: Decimal | null;
  pole?: Decimal | null;
  korkeuden_poikkeama?: Decimal | null;
  siksakkin_poikkeama?: Decimal | null;
  pituuskaltevuus?: Decimal | null;
  right_wire_wear_2?: Decimal | null;
  stagger_box_ohl?: Decimal | null;
  height_box_ohl?: Decimal | null;
  track?: string | null;
  location?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  rataosuus_numero?: string | null;
  rataosuus_nimi?: string | null;
  raide_numero?: string | null;
  rata_kilometri?: number | null;
  rata_metrit?: Decimal | null;
  ohl_ajonopeus?: Decimal | null;
  lat?: Decimal | null;
  long?: Decimal | null;
  created?: Date | null;
  modified?: Date | null;
  geoviite_konvertoitu_lat?: Decimal | null;
  geoviite_konvertoitu_long?: Decimal | null;
  geoviite_konvertoitu_rataosuus_numero?: string | null; // VarChar(40) mapped to string
  geoviite_konvertoitu_rataosuus_nimi?: string | null; // VarChar(40) mapped to string
  geoviite_konvertoitu_raide_numero?: string | null; // VarChar(40) mapped to string
  geoviite_konvertoitu_rata_kilometri?: number | null; // Int mapped to number
  geoviite_konvertoitu_rata_metrit?: Decimal | null;
  geoviite_konvertoitu_sijainti?: any | null; // Unsupported "geography" type mapped to any
  geoviite_valimatka?: Decimal | null;
  geoviite_sijaintiraide_kuvaus?: string | null; // VarChar(200) mapped to string
  geoviite_sijaintiraide_tyyppi?: string | null; // VarChar(40) mapped to string
  geoviite_updated_at?: Date | null;
};

export function convertDataToOhlMittausArray(data: any[]): OhlMittausData[] {
  return data.map(item => ({
    raportti_id: parseInt(item.raportti_id, 10),
    running_date: item.running_date,

    jarjestelma: sanitizeValue(item.jarjestelma),
    sscount: sanitizeValue(item.sscount) ? parseInt(item.sscount, 10) : null,

    ajonopeus: sanitizeValue(item.ajonopeus)
      ? new Decimal(item.ajonopeus)
      : null,
    siksak_1: sanitizeValue(item.siksak_1) ? new Decimal(item.siksak_1) : null,
    siksak_2: sanitizeValue(item.siksak_2) ? new Decimal(item.siksak_2) : null,
    korkeus_1: sanitizeValue(item.korkeus_1)
      ? new Decimal(item.korkeus_1)
      : null,
    korkeus_2: sanitizeValue(item.korkeus_2)
      ? new Decimal(item.korkeus_2)
      : null,
    jaannospaksuus_1: sanitizeValue(item.jaannospaksuus_1)
      ? new Decimal(item.jaannospaksuus_1)
      : null,
    jaannospaksuus_2: sanitizeValue(item.jaannospaksuus_2)
      ? new Decimal(item.jaannospaksuus_2)
      : null,
    risteavien_ajolankojen_etaisyys: sanitizeValue(
      item.risteavien_ajolankojen_etaisyys,
    )
      ? new Decimal(item.risteavien_ajolankojen_etaisyys)
      : null,
    height_gradient: sanitizeValue(item.height_gradient)
      ? new Decimal(item.height_gradient)
      : null,
    pinnan_leveys_1: sanitizeValue(item.pinnan_leveys_1)
      ? new Decimal(item.pinnan_leveys_1)
      : null,
    pinnan_leveys_2: sanitizeValue(item.pinnan_leveys_2)
      ? new Decimal(item.pinnan_leveys_2)
      : null,
    pinnan_leveyden_keskiarvo_1: sanitizeValue(item.pinnan_leveyden_keskiarvo_1)
      ? new Decimal(item.pinnan_leveyden_keskiarvo_1)
      : null,
    pinnan_leveyden_keskiarvo_2: sanitizeValue(item.pinnan_leveyden_keskiarvo_2)
      ? new Decimal(item.pinnan_leveyden_keskiarvo_2)
      : null,
    pinnan_leveyden_keskihajonta_1: sanitizeValue(
      item.pinnan_leveyden_keskihajonta_1,
    )
      ? new Decimal(item.pinnan_leveyden_keskihajonta_1)
      : null,
    pinnan_leveyden_keskihajonta_2: sanitizeValue(
      item.pinnan_leveyden_keskihajonta_2,
    )
      ? new Decimal(item.pinnan_leveyden_keskihajonta_2)
      : null,
    jaannospinta_ala_1: sanitizeValue(item.jaannospinta_ala_1)
      ? new Decimal(item.jaannospinta_ala_1)
      : null,
    jaannospinta_ala_2: sanitizeValue(item.jaannospinta_ala_2)
      ? new Decimal(item.jaannospinta_ala_2)
      : null,
    jaannospinta_alan_keskiarvo_1: sanitizeValue(
      item.jaannospinta_alan_keskiarvo_1,
    )
      ? new Decimal(item.jaannospinta_alan_keskiarvo_1)
      : null,
    jaannospinta_alan_keskiarvo_2: sanitizeValue(
      item.jaannospinta_alan_keskiarvo_2,
    )
      ? new Decimal(item.jaannospinta_alan_keskiarvo_2)
      : null,
    residual_area_stddev_1: sanitizeValue(item.residual_area_stddev_1)
      ? new Decimal(item.residual_area_stddev_1)
      : null,
    residual_area_stddev_2: sanitizeValue(item.residual_area_stddev_2)
      ? new Decimal(item.residual_area_stddev_2)
      : null,
    pole: sanitizeValue(item.pole) ? new Decimal(item.pole) : null,
    korkeuden_poikkeama: sanitizeValue(item.korkeuden_poikkeama)
      ? new Decimal(item.korkeuden_poikkeama)
      : null,
    siksakkin_poikkeama: sanitizeValue(item.siksakkin_poikkeama)
      ? new Decimal(item.siksakkin_poikkeama)
      : null,
    pituuskaltevuus: sanitizeValue(item.pituuskaltevuus)
      ? new Decimal(item.pituuskaltevuus)
      : null,
    right_wire_wear_2: sanitizeValue(item.right_wire_wear_2)
      ? new Decimal(item.right_wire_wear_2)
      : null,
    stagger_box_ohl: sanitizeValue(item.stagger_box_ohl)
      ? new Decimal(item.stagger_box_ohl)
      : null,
    height_box_ohl: sanitizeValue(item.height_box_ohl)
      ? new Decimal(item.height_box_ohl)
      : null,
    track: sanitizeValue(item.track) ? item.track : null,
    location: sanitizeValue(item.location) ? item.location : null,
    latitude: sanitizeValue(item.latitude) ? item.latitude : null,
    longitude: sanitizeValue(item.longitude) ? item.longitude : null,
    rataosuus_numero: sanitizeValue(item.rataosuus_numero)
      ? item.rataosuus_numero
      : null,
    rataosuus_nimi:
      sanitizeValue(item.rataosuus_nimi) && !Number.isNaN(item.rataosuus_nimi)
        ? item.rataosuus_nimi
        : null,
    raide_numero: sanitizeValue(item.raide_numero) ? item.raide_numero : null,
    rata_kilometri: sanitizeValue(item.rata_kilometri)
      ? parseInt(item.rata_kilometri, 10)
      : null,
    rata_metrit: sanitizeValue(item.rata_metrit)
      ? new Decimal(item.rata_metrit)
      : null,
    ohl_ajonopeus: sanitizeValue(item.ohl_ajonopeus)
      ? new Decimal(item.ohl_ajonopeus)
      : null,
    lat: sanitizeValue(item.lat) ? new Decimal(item.lat) : null,
    long: sanitizeValue(item.long) ? new Decimal(item.long) : null,
    created: sanitizeValue(item.created) ? new Date(item.created) : null,
    modified: sanitizeValue(item.modified) ? new Date(item.modified) : null,
    geoviite_konvertoitu_lat: sanitizeValue(item.geoviite_konvertoitu_lat)
      ? new Decimal(item.geoviite_konvertoitu_lat)
      : null,

    geoviite_konvertoitu_long: sanitizeValue(item.geoviite_konvertoitu_long)
      ? new Decimal(item.geoviite_konvertoitu_long)
      : null,

    geoviite_konvertoitu_rataosuus_numero: sanitizeValue(
      item.geoviite_konvertoitu_rataosuus_numero,
    )
      ? String(item.geoviite_konvertoitu_rataosuus_numero)
      : null,

    geoviite_konvertoitu_rataosuus_nimi: sanitizeValue(
      item.geoviite_konvertoitu_rataosuus_nimi,
    )
      ? String(item.geoviite_konvertoitu_rataosuus_nimi)
      : null,

    geoviite_konvertoitu_raide_numero: sanitizeValue(
      item.geoviite_konvertoitu_raide_numero,
    )
      ? String(item.geoviite_konvertoitu_raide_numero)
      : null,

    geoviite_konvertoitu_rata_kilometri: sanitizeValue(
      item.geoviite_konvertoitu_rata_kilometri,
    )
      ? Number(item.geoviite_konvertoitu_rata_kilometri)
      : null,

    geoviite_konvertoitu_rata_metrit: sanitizeValue(
      item.geoviite_konvertoitu_rata_metrit,
    )
      ? new Decimal(item.geoviite_konvertoitu_rata_metrit)
      : null,

    geoviite_valimatka: sanitizeValue(item.geoviite_valimatka)
      ? new Decimal(item.geoviite_valimatka)
      : null,

    geoviite_sijaintiraide_kuvaus: sanitizeValue(
      item.geoviite_sijaintiraide_kuvaus,
    )
      ? String(item.geoviite_sijaintiraide_kuvaus)
      : null,

    geoviite_sijaintiraide_tyyppi: sanitizeValue(
      item.geoviite_sijaintiraide_tyyppi,
    )
      ? String(item.geoviite_sijaintiraide_tyyppi)
      : null,

    geoviite_updated_at: sanitizeValue(item.geoviite_updated_at)
      ? new Date(item.geoviite_updated_at)
      : null,
  }));
}

type PiMittausData = {
  raportti_id: number;
  running_date: Date;
  jarjestelma?: jarjestelma | null;
  sscount?: number | null;
  sijainti?: any | null;
  ajonopeus?: Decimal | null;
  accz_1_1?: Decimal | null;
  accz_1_2?: Decimal | null;
  accz_2_1?: Decimal | null;
  accz_2_2?: Decimal | null;
  f_1_1?: Decimal | null;
  f_1_2?: Decimal | null;
  f_2_1?: Decimal | null;
  f_2_2?: Decimal | null;
  fint?: Decimal | null;
  fcomp?: Decimal | null;
  fext?: Decimal | null;
  stagger?: Decimal | null;
  height_ws?: Decimal | null;
  track?: string | null;
  location?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  rataosuus_numero?: string | null;
  rataosuus_nimi?: string | null;
  raide_numero?: string | null;
  rata_kilometri?: number | null;
  rata_metrit?: Decimal | null;
  lat?: Decimal | null;
  long?: Decimal | null;
  created?: Date | null;
  modified?: Date | null;
  geoviite_konvertoitu_lat?: Decimal | null;
  geoviite_konvertoitu_long?: Decimal | null;
  geoviite_konvertoitu_rataosuus_numero?: string | null;
  geoviite_konvertoitu_rataosuus_nimi?: string | null;
  geoviite_konvertoitu_raide_numero?: string | null;
  geoviite_konvertoitu_rata_kilometri?: number | null;
  geoviite_konvertoitu_rata_metrit?: Decimal | null;
  geoviite_konvertoitu_sijainti?: any | null;
  geoviite_valimatka?: Decimal | null;
  geoviite_sijaintiraide_kuvaus?: string | null;
  geoviite_sijaintiraide_tyyppi?: string | null;
  geoviite_updated_at?: Date | null;
};

export function convertDataToPiMittausArray(data: any[]): PiMittausData[] {
  return data.map(item => ({
    raportti_id: parseInt(item.raportti_id, 10),
    running_date: item.running_date,

    jarjestelma: sanitizeValue(item.jarjestelma),
    sscount: sanitizeValue(item.sscount) ? parseInt(item.sscount, 10) : null,
    ajonopeus: sanitizeValue(item.ajonopeus)
      ? new Decimal(item.ajonopeus)
      : null,
    accz_1_1: sanitizeValue(item.accz_1_1) ? new Decimal(item.accz_1_1) : null,
    accz_1_2: sanitizeValue(item.accz_1_2) ? new Decimal(item.accz_1_2) : null,
    accz_2_1: sanitizeValue(item.accz_2_1) ? new Decimal(item.accz_2_1) : null,
    accz_2_2: sanitizeValue(item.accz_2_2) ? new Decimal(item.accz_2_2) : null,
    f_1_1: sanitizeValue(item.f_1_1) ? new Decimal(item.f_1_1) : null,
    f_1_2: sanitizeValue(item.f_1_2) ? new Decimal(item.f_1_2) : null,
    f_2_1: sanitizeValue(item.f_2_1) ? new Decimal(item.f_2_1) : null,
    f_2_2: sanitizeValue(item.f_2_2) ? new Decimal(item.f_2_2) : null,
    fint: sanitizeValue(item.fint) ? new Decimal(item.fint) : null,
    fcomp: sanitizeValue(item.fcomp) ? new Decimal(item.fcomp) : null,
    fext: sanitizeValue(item.fext) ? new Decimal(item.fext) : null,
    stagger: sanitizeValue(item.stagger) ? new Decimal(item.stagger) : null,
    height_ws: sanitizeValue(item.height_ws)
      ? new Decimal(item.height_ws)
      : null,
    track: sanitizeValue(item.track),
    location: sanitizeValue(item.location),
    latitude: sanitizeValue(item.latitude),
    longitude: sanitizeValue(item.longitude),
    rataosuus_numero: sanitizeValue(item.rataosuus_numero),

    rataosuus_nimi: sanitizeValue(item.rataosuus_nimi),
    raide_numero: sanitizeValue(item.raide_numero),
    rata_kilometri: sanitizeValue(item.rata_kilometri)
      ? parseInt(item.rata_kilometri, 10)
      : null,
    rata_metrit: sanitizeValue(item.rata_metrit)
      ? new Decimal(item.rata_metrit)
      : null,
    lat: sanitizeValue(item.lat) ? new Decimal(item.lat) : null,
    long: sanitizeValue(item.long) ? new Decimal(item.long) : null,
    created: sanitizeValue(item.created) ? new Date(item.created) : null,
    modified: sanitizeValue(item.modified) ? new Date(item.modified) : null,
    geoviite_konvertoitu_lat: sanitizeValue(item.geoviite_konvertoitu_lat)
      ? new Decimal(item.geoviite_konvertoitu_lat)
      : null,

    geoviite_konvertoitu_long: sanitizeValue(item.geoviite_konvertoitu_long)
      ? new Decimal(item.geoviite_konvertoitu_long)
      : null,

    geoviite_konvertoitu_rataosuus_numero: sanitizeValue(
      item.geoviite_konvertoitu_rataosuus_numero,
    )
      ? String(item.geoviite_konvertoitu_rataosuus_numero)
      : null,

    geoviite_konvertoitu_rataosuus_nimi: sanitizeValue(
      item.geoviite_konvertoitu_rataosuus_nimi,
    )
      ? String(item.geoviite_konvertoitu_rataosuus_nimi)
      : null,

    geoviite_konvertoitu_raide_numero: sanitizeValue(
      item.geoviite_konvertoitu_raide_numero,
    )
      ? String(item.geoviite_konvertoitu_raide_numero)
      : null,

    geoviite_konvertoitu_rata_kilometri: sanitizeValue(
      item.geoviite_konvertoitu_rata_kilometri,
    )
      ? Number(item.geoviite_konvertoitu_rata_kilometri)
      : null,

    geoviite_konvertoitu_rata_metrit: sanitizeValue(
      item.geoviite_konvertoitu_rata_metrit,
    )
      ? new Decimal(item.geoviite_konvertoitu_rata_metrit)
      : null,

    geoviite_valimatka: sanitizeValue(item.geoviite_valimatka)
      ? new Decimal(item.geoviite_valimatka)
      : null,

    geoviite_sijaintiraide_kuvaus: sanitizeValue(
      item.geoviite_sijaintiraide_kuvaus,
    )
      ? String(item.geoviite_sijaintiraide_kuvaus)
      : null,

    geoviite_sijaintiraide_tyyppi: sanitizeValue(
      item.geoviite_sijaintiraide_tyyppi,
    )
      ? String(item.geoviite_sijaintiraide_tyyppi)
      : null,

    geoviite_updated_at: sanitizeValue(item.geoviite_updated_at)
      ? new Date(item.geoviite_updated_at)
      : null,
  }));
}

type RcMittausData = {
  raportti_id: number;
  running_date: Date;
  jarjestelma?: jarjestelma | null;
  sscount?: number | null;
  sijainti?: any | null; // This might need to be handled differently depending on the actual type
  ajonopeus?: Decimal | null;
  oikea_raiteen_aallon_rms_10_30mm?: Decimal | null;
  vasen_raiteen_aallon_rms_10_30mm?: Decimal | null;
  oikea_raiteen_aallon_rms_30_100mm?: Decimal | null;
  vasen_raiteen_aallon_rms_30_100mm?: Decimal | null;
  oikea_raiteen_aallon_rms_100_300mm?: Decimal | null;
  vasen_raiteen_aallon_rms_100_300mm?: Decimal | null;
  oikea_raiteen_aallon_rms_300_1000mm?: Decimal | null;
  vasen_raiteen_aallon_rms_300_1000mm?: Decimal | null;
  oikea_raiteen_aallon_rms_10_30mm_keskiarvo?: Decimal | null;
  vasen_raiteen_aallon_rms_10_30mm_keskiarvo?: Decimal | null;
  oikea_raiteen_aallon_rms_30_100mm_keskiarvo?: Decimal | null;
  vasen_raiteen_aallon_rms_30_100mm_keskiarvo?: Decimal | null;
  oikea_raiteen_aallon_rms_100_300mm_keskiarvo?: Decimal | null;
  vasen_raiteen_aallon_rms_100_300mm_keskiarvo?: Decimal | null;
  oikea_raiteen_aallon_rms_300_1000mm_keskiarvo?: Decimal | null;
  vasen_raiteen_aallon_rms_300_1000mm_keskiarvo?: Decimal | null;
  oikea_raiteen_aallon_rms_10_30mm_keskihajonta?: Decimal | null;
  vasen_raiteen_aallon_rms_10_30mm_keskihajonta?: Decimal | null;
  oikea_raiteen_aallon_rms_30_100mm_keskihajonta?: Decimal | null;
  vasen_raiteen_aallon_rms_30_100mm_keskihajonta?: Decimal | null;
  oikea_raiteen_aallon_rms_10_300mm_keskihajonta?: Decimal | null;
  vasen_raiteen_aallon_rms_100_300mm_keskihajonta?: Decimal | null;
  oikea_raiteen_aallon_rms_300_1000mm_keskihajonta?: Decimal | null;
  vasen_raiteen_aallon_rms_300_1000_keskihajonta?: Decimal | null;
  vasen_raiteen_aallonrms10_30mm_kiintea_keskiarvo?: Decimal | null;
  oikea_raiteen_aallonrms10_30mm_kiintea_keskiarvo?: Decimal | null;
  vasen_raiteen_aallonrms10_30mm_kiintea_keskihaj?: Decimal | null;
  oikea_raiteen_aallonrms10_30mm_kiintea_keskihaj?: Decimal | null;
  vasen_raiteen_aallonrms30_100mm_kiintea_keskiarv?: Decimal | null;
  oikea_raiteen_aallonrms30_100mm_kiintea_keskiarv?: Decimal | null;
  vasen_raiteen_aallonrms30_100mm_kiintea_keskihaj?: Decimal | null;
  oikea_raiteen_aallonrms30_100mm_kiintea_keskihaj?: Decimal | null;
  vasen_raiteen_aallonrms100_300mm_kiintea_keskiar?: Decimal | null;
  oikea_raiteen_aallonrms100_300mm_kiintea_keskiar?: Decimal | null;
  vasen_raiteen_aallonrms100_300mm_kiintea_keskiha?: Decimal | null;
  oikea_raiteen_aallonrms100_300mm_kiintea_keskiha?: Decimal | null;
  vasen_raiteen_aallonrms300_1000mm_kiintea_keskia?: Decimal | null;
  oikea_raiteen_aallonrms300_1000mm_kiintea_keskia?: Decimal | null;
  vasen_raiteen_aallonrms300_1000mm_kiintea_keskih?: Decimal | null;
  oikea_raiteen_aallonrms300_1000mm_kiintea_keskih?: Decimal | null;
  track?: string | null;
  location?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  rataosuus_numero?: string | null;
  rataosuus_nimi?: string | null;
  raide_numero?: string | null;
  rata_kilometri?: number | null;
  rata_metrit?: Decimal | null;
  lat?: Decimal | null;
  long?: Decimal | null;
  created?: Date | null;
  modified?: Date | null;
  geoviite_konvertoitu_lat?: Decimal | null;
  geoviite_konvertoitu_long?: Decimal | null;
  geoviite_konvertoitu_rataosuus_numero?: string | null;
  geoviite_konvertoitu_rataosuus_nimi?: string | null;
  geoviite_konvertoitu_raide_numero?: string | null;
  geoviite_konvertoitu_rata_kilometri?: number | null;
  geoviite_konvertoitu_rata_metrit?: Decimal | null;
  geoviite_konvertoitu_sijainti?: any | null;
  geoviite_valimatka?: Decimal | null;
  geoviite_sijaintiraide_kuvaus?: string | null;
  geoviite_sijaintiraide_tyyppi?: string | null;
  geoviite_updated_at?: Date | null;
};

export function convertDataToRcMittausArray(data: any[]): RcMittausData[] {
  return data.map(item => ({
    raportti_id: parseInt(item.raportti_id, 10),
    running_date: sanitizeValue(item.running_date),

    jarjestelma: sanitizeValue(item.jarjestelma),
    sscount: sanitizeValue(item.sscount)
      ? parseInt(sanitizeValue(item.sscount), 10)
      : null,

    ajonopeus: sanitizeValue(item.ajonopeus)
      ? new Decimal(item.ajonopeus)
      : null,
    oikea_raiteen_aallon_rms_10_30mm: sanitizeValue(
      item.oikea_raiteen_aallon_rms_10_30mm,
    )
      ? new Decimal(item.oikea_raiteen_aallon_rms_10_30mm)
      : null,
    vasen_raiteen_aallon_rms_10_30mm: sanitizeValue(
      item.vasen_raiteen_aallon_rms_10_30mm,
    )
      ? new Decimal(item.vasen_raiteen_aallon_rms_10_30mm)
      : null,
    oikea_raiteen_aallon_rms_30_100mm: sanitizeValue(
      item.oikea_raiteen_aallon_rms_30_100mm,
    )
      ? new Decimal(item.oikea_raiteen_aallon_rms_30_100mm)
      : null,
    vasen_raiteen_aallon_rms_30_100mm: sanitizeValue(
      item.vasen_raiteen_aallon_rms_30_100mm,
    )
      ? new Decimal(item.vasen_raiteen_aallon_rms_30_100mm)
      : null,
    oikea_raiteen_aallon_rms_100_300mm: sanitizeValue(
      item.oikea_raiteen_aallon_rms_100_300mm,
    )
      ? new Decimal(item.oikea_raiteen_aallon_rms_100_300mm)
      : null,
    vasen_raiteen_aallon_rms_100_300mm: sanitizeValue(
      item.vasen_raiteen_aallon_rms_100_300mm,
    )
      ? new Decimal(item.vasen_raiteen_aallon_rms_100_300mm)
      : null,
    oikea_raiteen_aallon_rms_300_1000mm: sanitizeValue(
      item.oikea_raiteen_aallon_rms_300_1000mm,
    )
      ? new Decimal(item.oikea_raiteen_aallon_rms_300_1000mm)
      : null,
    vasen_raiteen_aallon_rms_300_1000mm: sanitizeValue(
      item.vasen_raiteen_aallon_rms_300_1000mm,
    )
      ? new Decimal(item.vasen_raiteen_aallon_rms_300_1000mm)
      : null,
    oikea_raiteen_aallon_rms_10_30mm_keskiarvo: sanitizeValue(
      item.oikea_raiteen_aallon_rms_10_30mm_keskiarvo,
    )
      ? new Decimal(item.oikea_raiteen_aallon_rms_10_30mm_keskiarvo)
      : null,
    vasen_raiteen_aallon_rms_10_30mm_keskiarvo: sanitizeValue(
      item.vasen_raiteen_aallon_rms_10_30mm_keskiarvo,
    )
      ? new Decimal(item.vasen_raiteen_aallon_rms_10_30mm_keskiarvo)
      : null,
    oikea_raiteen_aallon_rms_30_100mm_keskiarvo: sanitizeValue(
      item.oikea_raiteen_aallon_rms_30_100mm_keskiarvo,
    )
      ? new Decimal(item.oikea_raiteen_aallon_rms_30_100mm_keskiarvo)
      : null,
    vasen_raiteen_aallon_rms_30_100mm_keskiarvo: sanitizeValue(
      item.vasen_raiteen_aallon_rms_30_100mm_keskiarvo,
    )
      ? new Decimal(item.vasen_raiteen_aallon_rms_30_100mm_keskiarvo)
      : null,
    oikea_raiteen_aallon_rms_100_300mm_keskiarvo: sanitizeValue(
      item.oikea_raiteen_aallon_rms_100_300mm_keskiarvo,
    )
      ? new Decimal(item.oikea_raiteen_aallon_rms_100_300mm_keskiarvo)
      : null,
    vasen_raiteen_aallon_rms_100_300mm_keskiarvo: sanitizeValue(
      item.vasen_raiteen_aallon_rms_100_300mm_keskiarvo,
    )
      ? new Decimal(item.vasen_raiteen_aallon_rms_100_300mm_keskiarvo)
      : null,
    oikea_raiteen_aallon_rms_300_1000mm_keskiarvo: sanitizeValue(
      item.oikea_raiteen_aallon_rms_300_1000mm_keskiarvo,
    )
      ? new Decimal(item.oikea_raiteen_aallon_rms_300_1000mm_keskiarvo)
      : null,
    vasen_raiteen_aallon_rms_300_1000mm_keskiarvo: sanitizeValue(
      item.vasen_raiteen_aallon_rms_300_1000mm_keskiarvo,
    )
      ? new Decimal(item.vasen_raiteen_aallon_rms_300_1000mm_keskiarvo)
      : null,
    oikea_raiteen_aallon_rms_10_30mm_keskihajonta: sanitizeValue(
      item.oikea_raiteen_aallon_rms_10_30mm_keskihajonta,
    )
      ? new Decimal(item.oikea_raiteen_aallon_rms_10_30mm_keskihajonta)
      : null,
    vasen_raiteen_aallon_rms_10_30mm_keskihajonta: sanitizeValue(
      item.vasen_raiteen_aallon_rms_10_30mm_keskihajonta,
    )
      ? new Decimal(item.vasen_raiteen_aallon_rms_10_30mm_keskihajonta)
      : null,
    oikea_raiteen_aallon_rms_30_100mm_keskihajonta: sanitizeValue(
      item.oikea_raiteen_aallon_rms_30_100mm_keskihajonta,
    )
      ? new Decimal(item.oikea_raiteen_aallon_rms_30_100mm_keskihajonta)
      : null,
    vasen_raiteen_aallon_rms_30_100mm_keskihajonta: sanitizeValue(
      item.vasen_raiteen_aallon_rms_30_100mm_keskihajonta,
    )
      ? new Decimal(item.vasen_raiteen_aallon_rms_30_100mm_keskihajonta)
      : null,
    oikea_raiteen_aallon_rms_10_300mm_keskihajonta: sanitizeValue(
      item.oikea_raiteen_aallon_rms_10_300mm_keskihajonta,
    )
      ? new Decimal(item.oikea_raiteen_aallon_rms_10_300mm_keskihajonta)
      : null,
    vasen_raiteen_aallon_rms_100_300mm_keskihajonta: sanitizeValue(
      item.vasen_raiteen_aallon_rms_100_300mm_keskihajonta,
    )
      ? new Decimal(item.vasen_raiteen_aallon_rms_100_300mm_keskihajonta)
      : null,
    oikea_raiteen_aallon_rms_300_1000mm_keskihajonta: sanitizeValue(
      item.oikea_raiteen_aallon_rms_300_1000mm_keskihajonta,
    )
      ? new Decimal(item.oikea_raiteen_aallon_rms_300_1000mm_keskihajonta)
      : null,
    vasen_raiteen_aallon_rms_300_1000_keskihajonta: sanitizeValue(
      item.vasen_raiteen_aallon_rms_300_1000_keskihajonta,
    )
      ? new Decimal(item.vasen_raiteen_aallon_rms_300_1000_keskihajonta)
      : null,
    vasen_raiteen_aallonrms10_30mm_kiintea_keskiarvo: sanitizeValue(
      item.vasen_raiteen_aallonrms10_30mm_kiintea_keskiarvo,
    )
      ? new Decimal(item.vasen_raiteen_aallonrms10_30mm_kiintea_keskiarvo)
      : null,
    oikea_raiteen_aallonrms10_30mm_kiintea_keskiarvo: sanitizeValue(
      item.oikea_raiteen_aallonrms10_30mm_kiintea_keskiarvo,
    )
      ? new Decimal(item.oikea_raiteen_aallonrms10_30mm_kiintea_keskiarvo)
      : null,
    vasen_raiteen_aallonrms10_30mm_kiintea_keskihaj: sanitizeValue(
      item.vasen_raiteen_aallonrms10_30mm_kiintea_keskihaj,
    )
      ? new Decimal(item.vasen_raiteen_aallonrms10_30mm_kiintea_keskihaj)
      : null,
    oikea_raiteen_aallonrms10_30mm_kiintea_keskihaj: sanitizeValue(
      item.oikea_raiteen_aallonrms10_30mm_kiintea_keskihaj,
    )
      ? new Decimal(item.oikea_raiteen_aallonrms10_30mm_kiintea_keskihaj)
      : null,
    vasen_raiteen_aallonrms30_100mm_kiintea_keskiarv: sanitizeValue(
      item.vasen_raiteen_aallonrms30_100mm_kiintea_keskiarv,
    )
      ? new Decimal(item.vasen_raiteen_aallonrms30_100mm_kiintea_keskiarv)
      : null,
    oikea_raiteen_aallonrms30_100mm_kiintea_keskiarv: sanitizeValue(
      item.oikea_raiteen_aallonrms30_100mm_kiintea_keskiarv,
    )
      ? new Decimal(item.oikea_raiteen_aallonrms30_100mm_kiintea_keskiarv)
      : null,
    vasen_raiteen_aallonrms30_100mm_kiintea_keskihaj: sanitizeValue(
      item.vasen_raiteen_aallonrms30_100mm_kiintea_keskihaj,
    )
      ? new Decimal(item.vasen_raiteen_aallonrms30_100mm_kiintea_keskihaj)
      : null,
    oikea_raiteen_aallonrms30_100mm_kiintea_keskihaj: sanitizeValue(
      item.oikea_raiteen_aallonrms30_100mm_kiintea_keskihaj,
    )
      ? new Decimal(item.oikea_raiteen_aallonrms30_100mm_kiintea_keskihaj)
      : null,
    vasen_raiteen_aallonrms100_300mm_kiintea_keskiar: sanitizeValue(
      item.vasen_raiteen_aallonrms100_300mm_kiintea_keskiar,
    )
      ? new Decimal(item.vasen_raiteen_aallonrms100_300mm_kiintea_keskiar)
      : null,
    oikea_raiteen_aallonrms100_300mm_kiintea_keskiar: sanitizeValue(
      item.oikea_raiteen_aallonrms100_300mm_kiintea_keskiar,
    )
      ? new Decimal(item.oikea_raiteen_aallonrms100_300mm_kiintea_keskiar)
      : null,
    vasen_raiteen_aallonrms100_300mm_kiintea_keskiha: sanitizeValue(
      item.vasen_raiteen_aallonrms100_300mm_kiintea_keskiha,
    )
      ? new Decimal(item.vasen_raiteen_aallonrms100_300mm_kiintea_keskiha)
      : null,
    oikea_raiteen_aallonrms100_300mm_kiintea_keskiha: sanitizeValue(
      item.oikea_raiteen_aallonrms100_300mm_kiintea_keskiha,
    )
      ? new Decimal(item.oikea_raiteen_aallonrms100_300mm_kiintea_keskiha)
      : null,
    vasen_raiteen_aallonrms300_1000mm_kiintea_keskia: sanitizeValue(
      item.vasen_raiteen_aallonrms300_1000mm_kiintea_keskia,
    )
      ? new Decimal(item.vasen_raiteen_aallonrms300_1000mm_kiintea_keskia)
      : null,
    oikea_raiteen_aallonrms300_1000mm_kiintea_keskia: sanitizeValue(
      item.oikea_raiteen_aallonrms300_1000mm_kiintea_keskia,
    )
      ? new Decimal(item.oikea_raiteen_aallonrms300_1000mm_kiintea_keskia)
      : null,
    vasen_raiteen_aallonrms300_1000mm_kiintea_keskih: sanitizeValue(
      item.vasen_raiteen_aallonrms300_1000mm_kiintea_keskih,
    )
      ? new Decimal(item.vasen_raiteen_aallonrms300_1000mm_kiintea_keskih)
      : null,
    oikea_raiteen_aallonrms300_1000mm_kiintea_keskih: sanitizeValue(
      item.oikea_raiteen_aallonrms300_1000mm_kiintea_keskih,
    )
      ? new Decimal(item.oikea_raiteen_aallonrms300_1000mm_kiintea_keskih)
      : null,
    track: sanitizeValue(item.track),
    location: sanitizeValue(item.location),
    latitude: sanitizeValue(item.latitude),
    longitude: sanitizeValue(item.longitude),
    rataosuus_numero: sanitizeValue(item.rataosuus_numero),

    rataosuus_nimi: sanitizeValue(item.rataosuus_nimi),
    raide_numero: sanitizeValue(item.raide_numero),
    rata_kilometri: sanitizeValue(item.rata_kilometri)
      ? parseInt(item.rata_kilometri, 10)
      : null,
    rata_metrit: sanitizeValue(item.rata_metrit)
      ? new Decimal(item.rata_metrit)
      : null,
    lat: sanitizeValue(item.lat) ? new Decimal(item.lat) : null,
    long: sanitizeValue(item.long) ? new Decimal(item.long) : null,
    created: sanitizeValue(item.created) ? new Date(item.created) : null,
    modified: sanitizeValue(item.modified) ? new Date(item.modified) : null,
    geoviite_konvertoitu_lat: sanitizeValue(item.geoviite_konvertoitu_lat)
      ? new Decimal(item.geoviite_konvertoitu_lat)
      : null,

    geoviite_konvertoitu_long: sanitizeValue(item.geoviite_konvertoitu_long)
      ? new Decimal(item.geoviite_konvertoitu_long)
      : null,

    geoviite_konvertoitu_rataosuus_numero: sanitizeValue(
      item.geoviite_konvertoitu_rataosuus_numero,
    )
      ? String(item.geoviite_konvertoitu_rataosuus_numero)
      : null,

    geoviite_konvertoitu_rataosuus_nimi: sanitizeValue(
      item.geoviite_konvertoitu_rataosuus_nimi,
    )
      ? String(item.geoviite_konvertoitu_rataosuus_nimi)
      : null,

    geoviite_konvertoitu_raide_numero: sanitizeValue(
      item.geoviite_konvertoitu_raide_numero,
    )
      ? String(item.geoviite_konvertoitu_raide_numero)
      : null,

    geoviite_konvertoitu_rata_kilometri: sanitizeValue(
      item.geoviite_konvertoitu_rata_kilometri,
    )
      ? Number(item.geoviite_konvertoitu_rata_kilometri)
      : null,

    geoviite_konvertoitu_rata_metrit: sanitizeValue(
      item.geoviite_konvertoitu_rata_metrit,
    )
      ? new Decimal(item.geoviite_konvertoitu_rata_metrit)
      : null,

    geoviite_valimatka: sanitizeValue(item.geoviite_valimatka)
      ? new Decimal(item.geoviite_valimatka)
      : null,

    geoviite_sijaintiraide_kuvaus: sanitizeValue(
      item.geoviite_sijaintiraide_kuvaus,
    )
      ? String(item.geoviite_sijaintiraide_kuvaus)
      : null,

    geoviite_sijaintiraide_tyyppi: sanitizeValue(
      item.geoviite_sijaintiraide_tyyppi,
    )
      ? String(item.geoviite_sijaintiraide_tyyppi)
      : null,

    geoviite_updated_at: sanitizeValue(item.geoviite_updated_at)
      ? new Date(item.geoviite_updated_at)
      : null,
  }));
}

type rp_mittaus = {
  raportti_id: number;
  running_date: Date;
  jarjestelma?: jarjestelma | null;
  sscount?: number | null;
  sijainti?: any | null; // Unsupported("geography")
  ajonopeus?: Decimal | null;
  vasen_pystysuora_kuluma?: Decimal | null;
  oikea_pystysuora_kuluma?: Decimal | null;
  vasen_pystysuora_kuluman_keskiarvo?: Decimal | null;
  oikea_pystysuora_kuluman_keskiarvo?: Decimal | null;
  vasen_pystysuora_kuluman_keskihajonta?: Decimal | null;
  oikea_pystysuora_kuluman_keskihajonta?: Decimal | null;
  vasen_sisapuolinen_sivuttaiskuluma?: Decimal | null;
  oikea_sisapuolinen_sivuttaiskuluma?: Decimal | null;
  vasen_sisapuolisen_sivuttaiskuluman_keskiarvo?: Decimal | null;
  oikea_sisapuolisen_sivuttaiskuluman_keskiarvo?: Decimal | null;
  vasen_sisapuolisen_sivuttaiskuluman_keskihajonta?: Decimal | null;
  oikea_sisapuolisen_sivuttaiskuluman_keskihajonta?: Decimal | null;
  vasen_ulkoinen_sivuttaiskuluma?: Decimal | null;
  oikea_ulkoinen_sivuttaiskuluma?: Decimal | null;
  vasen_ulkoisen_sivuttaiskuluman_keskiarvo?: Decimal | null;
  oikea_ulkoisen_sivuttaiskuluman_keskiarvo?: Decimal | null;
  vasen_ulkoisen_sivuttaiskuluman_keskihajonta?: Decimal | null;
  oikea_ulkoisen_sivuttaiskuluman_keskihajonta?: Decimal | null;
  vasen_kallistus?: Decimal | null;
  oikea_kallistus?: Decimal | null;
  vasen_kallistuksen_keskiarvo?: Decimal | null;
  oikea_kallistuksen_keskiarvo?: Decimal | null;
  vasen_kallistuksen_keskihajonta?: Decimal | null;
  oikea_kallistuksen_keskihajonta?: Decimal | null;
  vasen_45_kuluma?: Decimal | null;
  oikea_45_kuluma?: Decimal | null;
  vasen_45_kuluman_keskiarvo?: Decimal | null;
  oikea_45_kuluman_keskiarvo?: Decimal | null;
  vasen_45_kuluman_keskihajonta?: Decimal | null;
  oikea_45_kuluman_keskihajonta?: Decimal | null;
  vasen_yhdistetty_kuluma?: Decimal | null;
  oikea_yhdistetty_kuluma?: Decimal | null;
  vasen_yhdistetyn_kuluman_keskiarvo?: Decimal | null;
  oikea_yhdistetyn_kuluman_keskiarvo?: Decimal | null;
  vasen_yhdistetyn_kuluman_keskihajonta?: Decimal | null;
  oikea_yhdistetyn_kuluman_keskihajonta?: Decimal | null;
  vasen_poikkileikkauspinta_ala?: Decimal | null;
  oikea_poikkileikkauspinta_ala?: Decimal | null;
  vasen_poikkileikkauspinta_alan_keskiarvo?: Decimal | null;
  oikea_poikkileikkauspinta_alan_keskiarvo?: Decimal | null;
  vasen_poikkileikkauspinta_alan_keskihajonta?: Decimal | null;
  oikea_poikkileikkauspinta_alan_keskihajonta?: Decimal | null;
  vasen_sisapuolinen_purse?: Decimal | null;
  oikea_sisapuolinen_purse?: Decimal | null;
  vasen_sisapuolisen_purseen_keskiarvo?: Decimal | null;
  oikea_sisapuolisen_purseen_keskiarvo?: Decimal | null;
  vasen_sisapuolisen_purseen_keskihajonta?: Decimal | null;
  oikea_sisapuolisen_purseen_keskihajonta?: Decimal | null;
  vasen_ulkopuolinen_purse?: Decimal | null;
  oikea_ulkopuolinen_purse?: Decimal | null;
  vasen_ulkopuolisen_purseen_keskiarvo?: Decimal | null;
  oikea_ulkopuolisen_purseen_keskiarvo?: Decimal | null;
  vasen_ulkopuolisen_purseen_keskihajonta?: Decimal | null;
  oikea_ulkopuolisen_purseen_keskihajonta?: Decimal | null;
  tehollinen_kartiokkuus?: Decimal | null;
  tehollisen_kartiokkuuden_keskiarvo?: Decimal | null;
  tehollisen_kartiokkuuden_keskihajonta?: Decimal | null;
  vasen_kiskon_kallistuksen_kiintea_keskiarvo?: Decimal | null;
  oikea_kiskon_kallistuksen_kiintea_keskiarvo?: Decimal | null;
  vasen_kiskon_kallistuksen_kiintea_keskihajonta?: Decimal | null;
  oikea_kiskon_kallistuksen_kiintea_keskihajonta?: Decimal | null;
  vasen_pystysuoran_kuluman_kiintea_keskiarvo?: Decimal | null;
  oikea_pystysuoran_kuluman_kiintea_keskiarvo?: Decimal | null;
  vasen_pystysuoran_kuluman_kiintea_keskihajonta?: Decimal | null;
  oikea_pystysuoran_kuluman_kiintea_keskihajonta?: Decimal | null;
  vasen_sisapuolisen_sivuttaisk_kiintea_keskiarvo?: Decimal | null;
  oikea_sisapuolisen_sivuttaisk_kiintea_keskiarvo?: Decimal | null;
  vasen_sisapuolisen_sivuttaisk_kiintea_keskihajonta?: Decimal | null;
  oikea_sisapuolisen_sivuttaisk_kiintea_keskihajonta?: Decimal | null;
  vasen_ulkopuolisen_sivuttaisk_kiintea_keskiarvo?: Decimal | null;
  oikea_ulkopuolisen_sivuttaisk_kiintea_keskiarvo?: Decimal | null;
  vasen_ulkopuolisen_sivuttaisk_kiintea_keskihajonta?: Decimal | null;
  oikea_ulkopuolisen_sivuttaisk_kiintea_keskihajonta?: Decimal | null;
  vasen_45_kuluman_kiintea_keskiarvo?: Decimal | null;
  oikea_45_kuluman_kiintea_keskiarvo?: Decimal | null;
  vasen_45_kuluman_kiintea_keskihajonta?: Decimal | null;
  oikea_45_kuluman_kiintea_keskihajonta?: Decimal | null;
  vasen_yhdistetyn_kuluman_kiintea_keskiarvo?: Decimal | null;
  oikea_yhdistetyn_kuluman_kiintea_keskiarvo?: Decimal | null;
  vasen_yhdistetyn_kuluman_kiintea_keskihajonta?: Decimal | null;
  oikea_yhdistetyn_kuluman_kiintea_keskihajonta?: Decimal | null;
  vasen_poikkileikkauspinta_alan_kiintea_keskiarvo?: Decimal | null;
  oikea_poikkileikkauspinta_alan_kiintea_keskiarvo?: Decimal | null;
  vasen_poikkileikkauspint_alan_kiintea_keskihajonta?: Decimal | null;
  oikea_poikkileikkauspint_alan_kiintea_keskihajonta?: Decimal | null;
  vasen_sisapuolisen_purseen_kiintea_keskiarvo?: Decimal | null;
  oikea_sisapuolisen_purseen_kiintea_keskiarvo?: Decimal | null;
  vasen_sisapuolisen_purseen_kiintea_keskihajonta?: Decimal | null;
  oikea_sisapuolisen_purseen_kiintea_keskihajonta?: Decimal | null;
  vasen_ulkopuolisen_purseen_kiintea_keskiarvo?: Decimal | null;
  oikea_ulkopuolisen_purseen_kiintea_keskiarvo?: Decimal | null;
  vasen_ulkopulisen_purseen_kiintea_keskihajonta?: Decimal | null;
  oikea_ulkopuolisen_purseen_kiintea_keskihajonta?: Decimal | null;
  tehollisen_kartiokkuuden_kiintea_keskiarvo?: Decimal | null;
  tehollisen_kartiokkuuden_kiintea_keskihajonta?: Decimal | null;
  vasen_poikkipinta_alan_poikkeama?: Decimal | null;
  oikea_poikkipinta_alan_poikkeama?: Decimal | null;
  rp_ajonopeus?: Decimal | null;
  track?: string | null;
  location?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  rataosuus_numero?: string | null;
  rataosuus_nimi?: string | null;
  raide_numero?: string | null;
  rata_kilometri?: number | null;
  rata_metrit?: Decimal | null;
  lat?: Decimal | null;
  long?: Decimal | null;
  created?: Date | null;
  modified?: Date | null;
  geoviite_konvertoitu_lat?: Decimal | null;
  geoviite_konvertoitu_long?: Decimal | null;
  geoviite_konvertoitu_rataosuus_numero?: string | null;
  geoviite_konvertoitu_rataosuus_nimi?: string | null;
  geoviite_konvertoitu_raide_numero?: string | null;
  geoviite_konvertoitu_rata_kilometri?: number | null;
  geoviite_konvertoitu_rata_metrit?: Decimal | null;
  geoviite_konvertoitu_sijainti?: any | null;
  geoviite_valimatka?: Decimal | null;
  geoviite_sijaintiraide_kuvaus?: string | null;
  geoviite_sijaintiraide_tyyppi?: string | null;
  geoviite_updated_at?: Date | null;
};

export function convertDataToRpMittausArray(data: any[]): rp_mittaus[] {
  return data.map(item => ({
    raportti_id: parseInt(item.raportti_id, 10),
    running_date: item.running_date,

    jarjestelma: sanitizeValue(item.jarjestelma),
    sscount: sanitizeValue(item.sscount) ? parseInt(item.sscount, 10) : null,
    ajonopeus: sanitizeValue(item.ajonopeus)
      ? new Decimal(item.ajonopeus)
      : null,
    vasen_pystysuora_kuluma: sanitizeValue(item.vasen_pystysuora_kuluma)
      ? new Decimal(item.vasen_pystysuora_kuluma)
      : null,

    oikea_pystysuora_kuluma: sanitizeValue(item.oikea_pystysuora_kuluma)
      ? new Decimal(item.oikea_pystysuora_kuluma)
      : null,

    vasen_pystysuora_kuluman_keskiarvo: sanitizeValue(
      item.vasen_pystysuora_kuluman_keskiarvo,
    )
      ? new Decimal(item.vasen_pystysuora_kuluman_keskiarvo)
      : null,

    oikea_pystysuora_kuluman_keskiarvo: sanitizeValue(
      item.oikea_pystysuora_kuluman_keskiarvo,
    )
      ? new Decimal(item.oikea_pystysuora_kuluman_keskiarvo)
      : null,

    vasen_pystysuora_kuluman_keskihajonta: sanitizeValue(
      item.vasen_pystysuora_kuluman_keskihajonta,
    )
      ? new Decimal(item.vasen_pystysuora_kuluman_keskihajonta)
      : null,

    oikea_pystysuora_kuluman_keskihajonta: sanitizeValue(
      item.oikea_pystysuora_kuluman_keskihajonta,
    )
      ? new Decimal(item.oikea_pystysuora_kuluman_keskihajonta)
      : null,

    vasen_sisapuolinen_sivuttaiskuluma: sanitizeValue(
      item.vasen_sisapuolinen_sivuttaiskuluma,
    )
      ? new Decimal(item.vasen_sisapuolinen_sivuttaiskuluma)
      : null,

    oikea_sisapuolinen_sivuttaiskuluma: sanitizeValue(
      item.oikea_sisapuolinen_sivuttaiskuluma,
    )
      ? new Decimal(item.oikea_sisapuolinen_sivuttaiskuluma)
      : null,

    vasen_sisapuolisen_sivuttaiskuluman_keskiarvo: sanitizeValue(
      item.vasen_sisapuolisen_sivuttaiskuluman_keskiarvo,
    )
      ? new Decimal(item.vasen_sisapuolisen_sivuttaiskuluman_keskiarvo)
      : null,

    oikea_sisapuolisen_sivuttaiskuluman_keskiarvo: sanitizeValue(
      item.oikea_sisapuolisen_sivuttaiskuluman_keskiarvo,
    )
      ? new Decimal(item.oikea_sisapuolisen_sivuttaiskuluman_keskiarvo)
      : null,

    vasen_sisapuolisen_sivuttaiskuluman_keskihajonta: sanitizeValue(
      item.vasen_sisapuolisen_sivuttaiskuluman_keskihajonta,
    )
      ? new Decimal(item.vasen_sisapuolisen_sivuttaiskuluman_keskihajonta)
      : null,

    oikea_sisapuolisen_sivuttaiskuluman_keskihajonta: sanitizeValue(
      item.oikea_sisapuolisen_sivuttaiskuluman_keskihajonta,
    )
      ? new Decimal(item.oikea_sisapuolisen_sivuttaiskuluman_keskihajonta)
      : null,

    vasen_ulkoinen_sivuttaiskuluma: sanitizeValue(
      item.vasen_ulkoinen_sivuttaiskuluma,
    )
      ? new Decimal(item.vasen_ulkoinen_sivuttaiskuluma)
      : null,

    oikea_ulkoinen_sivuttaiskuluma: sanitizeValue(
      item.oikea_ulkoinen_sivuttaiskuluma,
    )
      ? new Decimal(item.oikea_ulkoinen_sivuttaiskuluma)
      : null,

    vasen_ulkoisen_sivuttaiskuluman_keskiarvo: sanitizeValue(
      item.vasen_ulkoisen_sivuttaiskuluman_keskiarvo,
    )
      ? new Decimal(item.vasen_ulkoisen_sivuttaiskuluman_keskiarvo)
      : null,

    oikea_ulkoisen_sivuttaiskuluman_keskiarvo: sanitizeValue(
      item.oikea_ulkoisen_sivuttaiskuluman_keskiarvo,
    )
      ? new Decimal(item.oikea_ulkoisen_sivuttaiskuluman_keskiarvo)
      : null,

    vasen_ulkoisen_sivuttaiskuluman_keskihajonta: sanitizeValue(
      item.vasen_ulkoisen_sivuttaiskuluman_keskihajonta,
    )
      ? new Decimal(item.vasen_ulkoisen_sivuttaiskuluman_keskihajonta)
      : null,

    oikea_ulkoisen_sivuttaiskuluman_keskihajonta: sanitizeValue(
      item.oikea_ulkoisen_sivuttaiskuluman_keskihajonta,
    )
      ? new Decimal(item.oikea_ulkoisen_sivuttaiskuluman_keskihajonta)
      : null,

    vasen_kallistus: sanitizeValue(item.vasen_kallistus)
      ? new Decimal(item.vasen_kallistus)
      : null,

    oikea_kallistus: sanitizeValue(item.oikea_kallistus)
      ? new Decimal(item.oikea_kallistus)
      : null,

    vasen_kallistuksen_keskiarvo: sanitizeValue(
      item.vasen_kallistuksen_keskiarvo,
    )
      ? new Decimal(item.vasen_kallistuksen_keskiarvo)
      : null,

    oikea_kallistuksen_keskiarvo: sanitizeValue(
      item.oikea_kallistuksen_keskiarvo,
    )
      ? new Decimal(item.oikea_kallistuksen_keskiarvo)
      : null,

    vasen_kallistuksen_keskihajonta: sanitizeValue(
      item.vasen_kallistuksen_keskihajonta,
    )
      ? new Decimal(item.vasen_kallistuksen_keskihajonta)
      : null,

    oikea_kallistuksen_keskihajonta: sanitizeValue(
      item.oikea_kallistuksen_keskihajonta,
    )
      ? new Decimal(item.oikea_kallistuksen_keskihajonta)
      : null,

    vasen_45_kuluma: sanitizeValue(item.vasen_45_kuluma)
      ? new Decimal(item.vasen_45_kuluma)
      : null,

    oikea_45_kuluma: sanitizeValue(item.oikea_45_kuluma)
      ? new Decimal(item.oikea_45_kuluma)
      : null,

    vasen_45_kuluman_keskiarvo: sanitizeValue(item.vasen_45_kuluman_keskiarvo)
      ? new Decimal(item.vasen_45_kuluman_keskiarvo)
      : null,

    oikea_45_kuluman_keskiarvo: sanitizeValue(item.oikea_45_kuluman_keskiarvo)
      ? new Decimal(item.oikea_45_kuluman_keskiarvo)
      : null,

    vasen_45_kuluman_keskihajonta: sanitizeValue(
      item.vasen_45_kuluman_keskihajonta,
    )
      ? new Decimal(item.vasen_45_kuluman_keskihajonta)
      : null,

    oikea_45_kuluman_keskihajonta: sanitizeValue(
      item.oikea_45_kuluman_keskihajonta,
    )
      ? new Decimal(item.oikea_45_kuluman_keskihajonta)
      : null,

    vasen_yhdistetty_kuluma: sanitizeValue(item.vasen_yhdistetty_kuluma)
      ? new Decimal(item.vasen_yhdistetty_kuluma)
      : null,

    oikea_yhdistetty_kuluma: sanitizeValue(item.oikea_yhdistetty_kuluma)
      ? new Decimal(item.oikea_yhdistetty_kuluma)
      : null,

    vasen_yhdistetyn_kuluman_keskiarvo: sanitizeValue(
      item.vasen_yhdistetyn_kuluman_keskiarvo,
    )
      ? new Decimal(item.vasen_yhdistetyn_kuluman_keskiarvo)
      : null,

    oikea_yhdistetyn_kuluman_keskiarvo: sanitizeValue(
      item.oikea_yhdistetyn_kuluman_keskiarvo,
    )
      ? new Decimal(item.oikea_yhdistetyn_kuluman_keskiarvo)
      : null,

    vasen_yhdistetyn_kuluman_keskihajonta: sanitizeValue(
      item.vasen_yhdistetyn_kuluman_keskihajonta,
    )
      ? new Decimal(item.vasen_yhdistetyn_kuluman_keskihajonta)
      : null,

    oikea_yhdistetyn_kuluman_keskihajonta: sanitizeValue(
      item.oikea_yhdistetyn_kuluman_keskihajonta,
    )
      ? new Decimal(item.oikea_yhdistetyn_kuluman_keskihajonta)
      : null,

    vasen_poikkileikkauspinta_ala: sanitizeValue(
      item.vasen_poikkileikkauspinta_ala,
    )
      ? new Decimal(item.vasen_poikkileikkauspinta_ala)
      : null,

    oikea_poikkileikkauspinta_ala: sanitizeValue(
      item.oikea_poikkileikkauspinta_ala,
    )
      ? new Decimal(item.oikea_poikkileikkauspinta_ala)
      : null,

    vasen_poikkileikkauspinta_alan_keskiarvo: sanitizeValue(
      item.vasen_poikkileikkauspinta_alan_keskiarvo,
    )
      ? new Decimal(item.vasen_poikkileikkauspinta_alan_keskiarvo)
      : null,

    oikea_poikkileikkauspinta_alan_keskiarvo: sanitizeValue(
      item.oikea_poikkileikkauspinta_alan_keskiarvo,
    )
      ? new Decimal(item.oikea_poikkileikkauspinta_alan_keskiarvo)
      : null,

    vasen_poikkileikkauspinta_alan_keskihajonta: sanitizeValue(
      item.vasen_poikkileikkauspinta_alan_keskihajonta,
    )
      ? new Decimal(item.vasen_poikkileikkauspinta_alan_keskihajonta)
      : null,

    oikea_poikkileikkauspinta_alan_keskihajonta: sanitizeValue(
      item.oikea_poikkileikkauspinta_alan_keskihajonta,
    )
      ? new Decimal(item.oikea_poikkileikkauspinta_alan_keskihajonta)
      : null,

    vasen_sisapuolinen_purse: sanitizeValue(item.vasen_sisapuolinen_purse)
      ? new Decimal(item.vasen_sisapuolinen_purse)
      : null,

    oikea_sisapuolinen_purse: sanitizeValue(item.oikea_sisapuolinen_purse)
      ? new Decimal(item.oikea_sisapuolinen_purse)
      : null,

    vasen_sisapuolisen_purseen_keskiarvo: sanitizeValue(
      item.vasen_sisapuolisen_purseen_keskiarvo,
    )
      ? new Decimal(item.vasen_sisapuolisen_purseen_keskiarvo)
      : null,

    oikea_sisapuolisen_purseen_keskiarvo: sanitizeValue(
      item.oikea_sisapuolisen_purseen_keskiarvo,
    )
      ? new Decimal(item.oikea_sisapuolisen_purseen_keskiarvo)
      : null,

    vasen_sisapuolisen_purseen_keskihajonta: sanitizeValue(
      item.vasen_sisapuolisen_purseen_keskihajonta,
    )
      ? new Decimal(item.vasen_sisapuolisen_purseen_keskihajonta)
      : null,

    oikea_sisapuolisen_purseen_keskihajonta: sanitizeValue(
      item.oikea_sisapuolisen_purseen_keskihajonta,
    )
      ? new Decimal(item.oikea_sisapuolisen_purseen_keskihajonta)
      : null,

    vasen_ulkopuolinen_purse: sanitizeValue(item.vasen_ulkopuolinen_purse)
      ? new Decimal(item.vasen_ulkopuolinen_purse)
      : null,

    oikea_ulkopuolinen_purse: sanitizeValue(item.oikea_ulkopuolinen_purse)
      ? new Decimal(item.oikea_ulkopuolinen_purse)
      : null,

    vasen_ulkopuolisen_purseen_keskiarvo: sanitizeValue(
      item.vasen_ulkopuolisen_purseen_keskiarvo,
    )
      ? new Decimal(item.vasen_ulkopuolisen_purseen_keskiarvo)
      : null,

    oikea_ulkopuolisen_purseen_keskiarvo: sanitizeValue(
      item.oikea_ulkopuolisen_purseen_keskiarvo,
    )
      ? new Decimal(item.oikea_ulkopuolisen_purseen_keskiarvo)
      : null,

    vasen_ulkopuolisen_purseen_keskihajonta: sanitizeValue(
      item.vasen_ulkopuolisen_purseen_keskihajonta,
    )
      ? new Decimal(item.vasen_ulkopuolisen_purseen_keskihajonta)
      : null,

    oikea_ulkopuolisen_purseen_keskihajonta: sanitizeValue(
      item.oikea_ulkopuolisen_purseen_keskihajonta,
    )
      ? new Decimal(item.oikea_ulkopuolisen_purseen_keskihajonta)
      : null,

    tehollinen_kartiokkuus: sanitizeValue(item.tehollinen_kartiokkuus)
      ? new Decimal(item.tehollinen_kartiokkuus)
      : null,

    tehollisen_kartiokkuuden_keskiarvo: sanitizeValue(
      item.tehollisen_kartiokkuuden_keskiarvo,
    )
      ? new Decimal(item.tehollisen_kartiokkuuden_keskiarvo)
      : null,

    tehollisen_kartiokkuuden_keskihajonta: sanitizeValue(
      item.tehollisen_kartiokkuuden_keskihajonta,
    )
      ? new Decimal(item.tehollisen_kartiokkuuden_keskihajonta)
      : null,

    vasen_kiskon_kallistuksen_kiintea_keskiarvo: sanitizeValue(
      item.vasen_kiskon_kallistuksen_kiintea_keskiarvo,
    )
      ? new Decimal(item.vasen_kiskon_kallistuksen_kiintea_keskiarvo)
      : null,

    oikea_kiskon_kallistuksen_kiintea_keskiarvo: sanitizeValue(
      item.oikea_kiskon_kallistuksen_kiintea_keskiarvo,
    )
      ? new Decimal(item.oikea_kiskon_kallistuksen_kiintea_keskiarvo)
      : null,

    vasen_kiskon_kallistuksen_kiintea_keskihajonta: sanitizeValue(
      item.vasen_kiskon_kallistuksen_kiintea_keskihajonta,
    )
      ? new Decimal(item.vasen_kiskon_kallistuksen_kiintea_keskihajonta)
      : null,

    oikea_kiskon_kallistuksen_kiintea_keskihajonta: sanitizeValue(
      item.oikea_kiskon_kallistuksen_kiintea_keskihajonta,
    )
      ? new Decimal(item.oikea_kiskon_kallistuksen_kiintea_keskihajonta)
      : null,

    vasen_pystysuoran_kuluman_kiintea_keskiarvo: sanitizeValue(
      item.vasen_pystysuoran_kuluman_kiintea_keskiarvo,
    )
      ? new Decimal(item.vasen_pystysuoran_kuluman_kiintea_keskiarvo)
      : null,

    oikea_pystysuoran_kuluman_kiintea_keskiarvo: sanitizeValue(
      item.oikea_pystysuoran_kuluman_kiintea_keskiarvo,
    )
      ? new Decimal(item.oikea_pystysuoran_kuluman_kiintea_keskiarvo)
      : null,

    vasen_pystysuoran_kuluman_kiintea_keskihajonta: sanitizeValue(
      item.vasen_pystysuoran_kuluman_kiintea_keskihajonta,
    )
      ? new Decimal(item.vasen_pystysuoran_kuluman_kiintea_keskihajonta)
      : null,

    oikea_pystysuoran_kuluman_kiintea_keskihajonta: sanitizeValue(
      item.oikea_pystysuoran_kuluman_kiintea_keskihajonta,
    )
      ? new Decimal(item.oikea_pystysuoran_kuluman_kiintea_keskihajonta)
      : null,

    vasen_sisapuolisen_sivuttaisk_kiintea_keskiarvo: sanitizeValue(
      item.vasen_sisapuolisen_sivuttaisk_kiintea_keskiarvo,
    )
      ? new Decimal(item.vasen_sisapuolisen_sivuttaisk_kiintea_keskiarvo)
      : null,

    oikea_sisapuolisen_sivuttaisk_kiintea_keskiarvo: sanitizeValue(
      item.oikea_sisapuolisen_sivuttaisk_kiintea_keskiarvo,
    )
      ? new Decimal(item.oikea_sisapuolisen_sivuttaisk_kiintea_keskiarvo)
      : null,

    vasen_sisapuolisen_sivuttaisk_kiintea_keskihajonta: sanitizeValue(
      item.vasen_sisapuolisen_sivuttaisk_kiintea_keskihajonta,
    )
      ? new Decimal(item.vasen_sisapuolisen_sivuttaisk_kiintea_keskihajonta)
      : null,

    oikea_sisapuolisen_sivuttaisk_kiintea_keskihajonta: sanitizeValue(
      item.oikea_sisapuolisen_sivuttaisk_kiintea_keskihajonta,
    )
      ? new Decimal(item.oikea_sisapuolisen_sivuttaisk_kiintea_keskihajonta)
      : null,

    vasen_ulkopuolisen_sivuttaisk_kiintea_keskiarvo: sanitizeValue(
      item.vasen_ulkopuolisen_sivuttaisk_kiintea_keskiarvo,
    )
      ? new Decimal(item.vasen_ulkopuolisen_sivuttaisk_kiintea_keskiarvo)
      : null,

    oikea_ulkopuolisen_sivuttaisk_kiintea_keskiarvo: sanitizeValue(
      item.oikea_ulkopuolisen_sivuttaisk_kiintea_keskiarvo,
    )
      ? new Decimal(item.oikea_ulkopuolisen_sivuttaisk_kiintea_keskiarvo)
      : null,

    vasen_ulkopuolisen_sivuttaisk_kiintea_keskihajonta: sanitizeValue(
      item.vasen_ulkopuolisen_sivuttaisk_kiintea_keskihajonta,
    )
      ? new Decimal(item.vasen_ulkopuolisen_sivuttaisk_kiintea_keskihajonta)
      : null,

    oikea_ulkopuolisen_sivuttaisk_kiintea_keskihajonta: sanitizeValue(
      item.oikea_ulkopuolisen_sivuttaisk_kiintea_keskihajonta,
    )
      ? new Decimal(item.oikea_ulkopuolisen_sivuttaisk_kiintea_keskihajonta)
      : null,

    vasen_45_kuluman_kiintea_keskiarvo: sanitizeValue(
      item.vasen_45_kuluman_kiintea_keskiarvo,
    )
      ? new Decimal(item.vasen_45_kuluman_kiintea_keskiarvo)
      : null,

    oikea_45_kuluman_kiintea_keskiarvo: sanitizeValue(
      item.oikea_45_kuluman_kiintea_keskiarvo,
    )
      ? new Decimal(item.oikea_45_kuluman_kiintea_keskiarvo)
      : null,

    vasen_45_kuluman_kiintea_keskihajonta: sanitizeValue(
      item.vasen_45_kuluman_kiintea_keskihajonta,
    )
      ? new Decimal(item.vasen_45_kuluman_kiintea_keskihajonta)
      : null,

    oikea_45_kuluman_kiintea_keskihajonta: sanitizeValue(
      item.oikea_45_kuluman_kiintea_keskihajonta,
    )
      ? new Decimal(item.oikea_45_kuluman_kiintea_keskihajonta)
      : null,

    vasen_yhdistetyn_kuluman_kiintea_keskiarvo: sanitizeValue(
      item.vasen_yhdistetyn_kuluman_kiintea_keskiarvo,
    )
      ? new Decimal(item.vasen_yhdistetyn_kuluman_kiintea_keskiarvo)
      : null,

    oikea_yhdistetyn_kuluman_kiintea_keskiarvo: sanitizeValue(
      item.oikea_yhdistetyn_kuluman_kiintea_keskiarvo,
    )
      ? new Decimal(item.oikea_yhdistetyn_kuluman_kiintea_keskiarvo)
      : null,

    vasen_yhdistetyn_kuluman_kiintea_keskihajonta: sanitizeValue(
      item.vasen_yhdistetyn_kuluman_kiintea_keskihajonta,
    )
      ? new Decimal(item.vasen_yhdistetyn_kuluman_kiintea_keskihajonta)
      : null,

    oikea_yhdistetyn_kuluman_kiintea_keskihajonta: sanitizeValue(
      item.oikea_yhdistetyn_kuluman_kiintea_keskihajonta,
    )
      ? new Decimal(item.oikea_yhdistetyn_kuluman_kiintea_keskihajonta)
      : null,

    vasen_poikkileikkauspinta_alan_kiintea_keskiarvo: sanitizeValue(
      item.vasen_poikkileikkauspinta_alan_kiintea_keskiarvo,
    )
      ? new Decimal(item.vasen_poikkileikkauspinta_alan_kiintea_keskiarvo)
      : null,

    oikea_poikkileikkauspinta_alan_kiintea_keskiarvo: sanitizeValue(
      item.oikea_poikkileikkauspinta_alan_kiintea_keskiarvo,
    )
      ? new Decimal(item.oikea_poikkileikkauspinta_alan_kiintea_keskiarvo)
      : null,

    vasen_poikkileikkauspint_alan_kiintea_keskihajonta: sanitizeValue(
      item.vasen_poikkileikkauspint_alan_kiintea_keskihajonta,
    )
      ? new Decimal(item.vasen_poikkileikkauspint_alan_kiintea_keskihajonta)
      : null,

    oikea_poikkileikkauspint_alan_kiintea_keskihajonta: sanitizeValue(
      item.oikea_poikkileikkauspint_alan_kiintea_keskihajonta,
    )
      ? new Decimal(item.oikea_poikkileikkauspint_alan_kiintea_keskihajonta)
      : null,

    vasen_sisapuolisen_purseen_kiintea_keskiarvo: sanitizeValue(
      item.vasen_sisapuolisen_purseen_kiintea_keskiarvo,
    )
      ? new Decimal(item.vasen_sisapuolisen_purseen_kiintea_keskiarvo)
      : null,

    oikea_sisapuolisen_purseen_kiintea_keskiarvo: sanitizeValue(
      item.oikea_sisapuolisen_purseen_kiintea_keskiarvo,
    )
      ? new Decimal(item.oikea_sisapuolisen_purseen_kiintea_keskiarvo)
      : null,

    vasen_sisapuolisen_purseen_kiintea_keskihajonta: sanitizeValue(
      item.vasen_sisapuolisen_purseen_kiintea_keskihajonta,
    )
      ? new Decimal(item.vasen_sisapuolisen_purseen_kiintea_keskihajonta)
      : null,

    oikea_sisapuolisen_purseen_kiintea_keskihajonta: sanitizeValue(
      item.oikea_sisapuolisen_purseen_kiintea_keskihajonta,
    )
      ? new Decimal(item.oikea_sisapuolisen_purseen_kiintea_keskihajonta)
      : null,

    vasen_ulkopuolisen_purseen_kiintea_keskiarvo: sanitizeValue(
      item.vasen_ulkopuolisen_purseen_kiintea_keskiarvo,
    )
      ? new Decimal(item.vasen_ulkopuolisen_purseen_kiintea_keskiarvo)
      : null,

    oikea_ulkopuolisen_purseen_kiintea_keskiarvo: sanitizeValue(
      item.oikea_ulkopuolisen_purseen_kiintea_keskiarvo,
    )
      ? new Decimal(item.oikea_ulkopuolisen_purseen_kiintea_keskiarvo)
      : null,

    vasen_ulkopulisen_purseen_kiintea_keskihajonta: sanitizeValue(
      item.vasen_ulkopulisen_purseen_kiintea_keskihajonta,
    )
      ? new Decimal(item.vasen_ulkopulisen_purseen_kiintea_keskihajonta)
      : null,

    oikea_ulkopuolisen_purseen_kiintea_keskihajonta: sanitizeValue(
      item.oikea_ulkopuolisen_purseen_kiintea_keskihajonta,
    )
      ? new Decimal(item.oikea_ulkopuolisen_purseen_kiintea_keskihajonta)
      : null,

    tehollisen_kartiokkuuden_kiintea_keskiarvo: sanitizeValue(
      item.tehollisen_kartiokkuuden_kiintea_keskiarvo,
    )
      ? new Decimal(item.tehollisen_kartiokkuuden_kiintea_keskiarvo)
      : null,

    tehollisen_kartiokkuuden_kiintea_keskihajonta: sanitizeValue(
      item.tehollisen_kartiokkuuden_kiintea_keskihajonta,
    )
      ? new Decimal(item.tehollisen_kartiokkuuden_kiintea_keskihajonta)
      : null,
    vasen_poikkipinta_alan_poikkeama: sanitizeValue(
      item.vasen_poikkipinta_alan_poikkeama,
    )
      ? new Decimal(item.vasen_poikkipinta_alan_poikkeama)
      : null,

    oikea_poikkipinta_alan_poikkeama: sanitizeValue(
      item.oikea_poikkipinta_alan_poikkeama,
    )
      ? new Decimal(item.oikea_poikkipinta_alan_poikkeama)
      : null,

    rp_ajonopeus: sanitizeValue(item.rp_ajonopeus)
      ? new Decimal(item.rp_ajonopeus)
      : null,
    track: sanitizeValue(item.track),
    location: sanitizeValue(item.location),
    latitude: sanitizeValue(item.latitude),
    longitude: sanitizeValue(item.longitude),
    rataosuus_numero: sanitizeValue(item.rataosuus_numero),
    rataosuus_nimi: sanitizeValue(item.rataosuus_nimi),
    raide_numero: sanitizeValue(item.raide_numero),
    rata_kilometri: sanitizeValue(item.rata_kilometri)
      ? parseInt(item.rata_kilometri, 10)
      : null,
    rata_metrit: sanitizeValue(item.rata_metrit)
      ? new Decimal(item.rata_metrit)
      : null,
    lat: sanitizeValue(item.lat) ? new Decimal(item.lat) : null,
    long: sanitizeValue(item.long) ? new Decimal(item.long) : null,
    created: sanitizeValue(item.created) ? new Date(item.created) : null,
    modified: sanitizeValue(item.modified) ? new Date(item.modified) : null,
    geoviite_konvertoitu_lat: sanitizeValue(item.geoviite_konvertoitu_lat)
      ? new Decimal(item.geoviite_konvertoitu_lat)
      : null,

    geoviite_konvertoitu_long: sanitizeValue(item.geoviite_konvertoitu_long)
      ? new Decimal(item.geoviite_konvertoitu_long)
      : null,

    geoviite_konvertoitu_rataosuus_numero: sanitizeValue(
      item.geoviite_konvertoitu_rataosuus_numero,
    )
      ? String(item.geoviite_konvertoitu_rataosuus_numero)
      : null,

    geoviite_konvertoitu_rataosuus_nimi: sanitizeValue(
      item.geoviite_konvertoitu_rataosuus_nimi,
    )
      ? String(item.geoviite_konvertoitu_rataosuus_nimi)
      : null,

    geoviite_konvertoitu_raide_numero: sanitizeValue(
      item.geoviite_konvertoitu_raide_numero,
    )
      ? String(item.geoviite_konvertoitu_raide_numero)
      : null,

    geoviite_konvertoitu_rata_kilometri: sanitizeValue(
      item.geoviite_konvertoitu_rata_kilometri,
    )
      ? Number(item.geoviite_konvertoitu_rata_kilometri)
      : null,

    geoviite_konvertoitu_rata_metrit: sanitizeValue(
      item.geoviite_konvertoitu_rata_metrit,
    )
      ? new Decimal(item.geoviite_konvertoitu_rata_metrit)
      : null,

    geoviite_valimatka: sanitizeValue(item.geoviite_valimatka)
      ? new Decimal(item.geoviite_valimatka)
      : null,

    geoviite_sijaintiraide_kuvaus: sanitizeValue(
      item.geoviite_sijaintiraide_kuvaus,
    )
      ? String(item.geoviite_sijaintiraide_kuvaus)
      : null,

    geoviite_sijaintiraide_tyyppi: sanitizeValue(
      item.geoviite_sijaintiraide_tyyppi,
    )
      ? String(item.geoviite_sijaintiraide_tyyppi)
      : null,

    geoviite_updated_at: sanitizeValue(item.geoviite_updated_at)
      ? new Date(item.geoviite_updated_at)
      : null,
  }));
}

type tg_mittaus = {
  raportti_id: number;
  running_date: Date;
  jarjestelma?: jarjestelma | null;
  sscount?: number | null;
  sijainti?: any | null; // Unsupported type, left as-is
  ajonopeus?: Decimal | null;
  raideleveyden_poikkeama?: Decimal | null;
  kallistus?: Decimal | null;
  kallistuksen_poikkeama?: Decimal | null;
  kierous?: Decimal | null;
  kaarevuus?: Decimal | null;
  raideleveyden_poikkeaman_muutos?: Decimal | null;
  kierouden_poikkeama?: Decimal | null;
  vasen_korkeuspoikkeama_d1?: Decimal | null;
  vasen_korkeuspoikkeama_d2?: Decimal | null;
  oikea_korkeuspoikkeama_d2?: Decimal | null;
  vasen_korkeuspoikkeama_d3?: Decimal | null;
  oikea_korkeuspoikkeama_d3?: Decimal | null;
  vasen_nuolikorkeuspoikkeama_d1?: Decimal | null;
  oikea_nuolikorkeuspoikkeama_d1?: Decimal | null;
  vasen_nuolikorkeuspoikkeama_d2?: Decimal | null;
  oikea_nuolikorkeuspoikkeama_d2?: Decimal | null;
  vasen_nuolikorkeuspoikkeama_d3?: Decimal | null;
  oikea_nuolikorkeuspoikkeama_d3?: Decimal | null;
  gradient?: Decimal | null;
  raideleveyden?: Decimal | null;
  oikea_korkeuspoikkeama_d1?: Decimal | null;
  raideleveyden_keskihajonta?: Decimal | null;
  kallistus_keskihajonta?: Decimal | null;
  kierouden_keskihajonta?: Decimal | null;
  vasen_korkeuspoikkeama_d1_keskihajonta?: Decimal | null;
  oikea_korkeuspoikkeama_d1_keskihajonta?: Decimal | null;
  vasen_nuolikorkeus_d1_keskihajonta?: Decimal | null;
  oikea_nuolikorkeus_d1_keskihajonta?: Decimal | null;
  vasen_korkeuspoikkema_d0?: Decimal | null;
  oikea_korkeuspoikkema_d0?: Decimal | null;
  vasen_korkeuspoikkema_d0_keskihajonta?: Decimal | null;
  oikea_korkeuspoikkema_d0_keskihajonta?: Decimal | null;
  track?: string | null;
  location?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  rataosuus_numero?: string | null;
  rataosuus_nimi?: string | null;
  raide_numero?: string | null;
  rata_kilometri?: number | null;
  rata_metrit?: Decimal | null;
  lat?: Decimal | null;
  long?: Decimal | null;
  created?: Date | null;
  modified?: Date | null;
  geoviite_konvertoitu_lat?: Decimal | null;
  geoviite_konvertoitu_long?: Decimal | null;
  geoviite_konvertoitu_rataosuus_numero?: string | null;
  geoviite_konvertoitu_rataosuus_nimi?: string | null;
  geoviite_konvertoitu_raide_numero?: string | null;
  geoviite_konvertoitu_rata_kilometri?: number | null;
  geoviite_konvertoitu_rata_metrit?: Decimal | null;
  geoviite_konvertoitu_sijainti?: any | null;
  geoviite_valimatka?: Decimal | null;
  geoviite_sijaintiraide_kuvaus?: string | null;
  geoviite_sijaintiraide_tyyppi?: string | null;
  geoviite_updated_at?: Date | null;
};

export function convertDataToTgMittausArray(data: any[]): tg_mittaus[] {
  return data.map(item => ({
    raportti_id: parseInt(item.raportti_id, 10),
    running_date: item.running_date,

    jarjestelma: sanitizeValue(item.jarjestelma),
    sscount: sanitizeValue(item.sscount) ? parseInt(item.sscount, 10) : null,

    ajonopeus: sanitizeValue(item.ajonopeus)
      ? new Decimal(item.ajonopeus)
      : null,
    raideleveyden_poikkeama: sanitizeValue(item.raideleveyden_poikkeama)
      ? new Decimal(item.raideleveyden_poikkeama)
      : null,
    kallistus: sanitizeValue(item.kallistus)
      ? new Decimal(item.kallistus)
      : null,
    kallistuksen_poikkeama: sanitizeValue(item.kallistuksen_poikkeama)
      ? new Decimal(item.kallistuksen_poikkeama)
      : null,
    kierous: sanitizeValue(item.kierous) ? new Decimal(item.kierous) : null,
    kaarevuus: sanitizeValue(item.kaarevuus)
      ? new Decimal(item.kaarevuus)
      : null,
    raideleveyden_poikkeaman_muutos: sanitizeValue(
      item.raideleveyden_poikkeaman_muutos,
    )
      ? new Decimal(item.raideleveyden_poikkeaman_muutos)
      : null,
    kierouden_poikkeama: sanitizeValue(item.kierouden_poikkeama)
      ? new Decimal(item.kierouden_poikkeama)
      : null,
    vasen_korkeuspoikkeama_d1: sanitizeValue(item.vasen_korkeuspoikkeama_d1)
      ? new Decimal(item.vasen_korkeuspoikkeama_d1)
      : null,
    vasen_korkeuspoikkeama_d2: sanitizeValue(item.vasen_korkeuspoikkeama_d2)
      ? new Decimal(item.vasen_korkeuspoikkeama_d2)
      : null,
    oikea_korkeuspoikkeama_d2: sanitizeValue(item.oikea_korkeuspoikkeama_d2)
      ? new Decimal(item.oikea_korkeuspoikkeama_d2)
      : null,
    vasen_korkeuspoikkeama_d3: sanitizeValue(item.vasen_korkeuspoikkeama_d3)
      ? new Decimal(item.vasen_korkeuspoikkeama_d3)
      : null,
    oikea_korkeuspoikkeama_d3: sanitizeValue(item.oikea_korkeuspoikkeama_d3)
      ? new Decimal(item.oikea_korkeuspoikkeama_d3)
      : null,
    vasen_nuolikorkeuspoikkeama_d1: sanitizeValue(
      item.vasen_nuolikorkeuspoikkeama_d1,
    )
      ? new Decimal(item.vasen_nuolikorkeuspoikkeama_d1)
      : null,
    oikea_nuolikorkeuspoikkeama_d1: sanitizeValue(
      item.oikea_nuolikorkeuspoikkeama_d1,
    )
      ? new Decimal(item.oikea_nuolikorkeuspoikkeama_d1)
      : null,
    vasen_nuolikorkeuspoikkeama_d2: sanitizeValue(
      item.vasen_nuolikorkeuspoikkeama_d2,
    )
      ? new Decimal(item.vasen_nuolikorkeuspoikkeama_d2)
      : null,
    oikea_nuolikorkeuspoikkeama_d2: sanitizeValue(
      item.oikea_nuolikorkeuspoikkeama_d2,
    )
      ? new Decimal(item.oikea_nuolikorkeuspoikkeama_d2)
      : null,
    vasen_nuolikorkeuspoikkeama_d3: sanitizeValue(
      item.vasen_nuolikorkeuspoikkeama_d3,
    )
      ? new Decimal(item.vasen_nuolikorkeuspoikkeama_d3)
      : null,
    oikea_nuolikorkeuspoikkeama_d3: sanitizeValue(
      item.oikea_nuolikorkeuspoikkeama_d3,
    )
      ? new Decimal(item.oikea_nuolikorkeuspoikkeama_d3)
      : null,
    gradient: sanitizeValue(item.gradient) ? new Decimal(item.gradient) : null,
    raideleveyden: sanitizeValue(item.raideleveyden)
      ? new Decimal(item.raideleveyden)
      : null,
    oikea_korkeuspoikkeama_d1: sanitizeValue(item.oikea_korkeuspoikkeama_d1)
      ? new Decimal(item.oikea_korkeuspoikkeama_d1)
      : null,
    raideleveyden_keskihajonta: sanitizeValue(item.raideleveyden_keskihajonta)
      ? new Decimal(item.raideleveyden_keskihajonta)
      : null,
    kallistus_keskihajonta: sanitizeValue(item.kallistus_keskihajonta)
      ? new Decimal(item.kallistus_keskihajonta)
      : null,
    kierouden_keskihajonta: sanitizeValue(item.kierouden_keskihajonta)
      ? new Decimal(item.kierouden_keskihajonta)
      : null,
    vasen_korkeuspoikkeama_d1_keskihajonta: sanitizeValue(
      item.vasen_korkeuspoikkeama_d1_keskihajonta,
    )
      ? new Decimal(item.vasen_korkeuspoikkeama_d1_keskihajonta)
      : null,
    oikea_korkeuspoikkeama_d1_keskihajonta: sanitizeValue(
      item.oikea_korkeuspoikkeama_d1_keskihajonta,
    )
      ? new Decimal(item.oikea_korkeuspoikkeama_d1_keskihajonta)
      : null,
    vasen_nuolikorkeus_d1_keskihajonta: sanitizeValue(
      item.vasen_nuolikorkeus_d1_keskihajonta,
    )
      ? new Decimal(item.vasen_nuolikorkeus_d1_keskihajonta)
      : null,
    oikea_nuolikorkeus_d1_keskihajonta: sanitizeValue(
      item.oikea_nuolikorkeus_d1_keskihajonta,
    )
      ? new Decimal(item.oikea_nuolikorkeus_d1_keskihajonta)
      : null,
    vasen_korkeuspoikkema_d0: sanitizeValue(item.vasen_korkeuspoikkema_d0)
      ? new Decimal(item.vasen_korkeuspoikkema_d0)
      : null,
    oikea_korkeuspoikkema_d0: sanitizeValue(item.oikea_korkeuspoikkema_d0)
      ? new Decimal(item.oikea_korkeuspoikkema_d0)
      : null,
    vasen_korkeuspoikkema_d0_keskihajonta: sanitizeValue(
      item.vasen_korkeuspoikkema_d0_keskihajonta,
    )
      ? new Decimal(item.vasen_korkeuspoikkema_d0_keskihajonta)
      : null,
    oikea_korkeuspoikkema_d0_keskihajonta: sanitizeValue(
      item.oikea_korkeuspoikkema_d0_keskihajonta,
    )
      ? new Decimal(item.oikea_korkeuspoikkema_d0_keskihajonta)
      : null,

    track: sanitizeValue(item.track),
    location: sanitizeValue(item.location),
    latitude: sanitizeValue(item.latitude),
    longitude: sanitizeValue(item.longitude),
    rataosuus_numero: sanitizeValue(item.rataosuus_numero),
    rataosuus_nimi: sanitizeValue(item.rataosuus_nimi),
    raide_numero: sanitizeValue(item.raide_numero),
    rata_kilometri: sanitizeValue(item.rata_kilometri)
      ? parseInt(item.rata_kilometri, 10)
      : null,
    rata_metrit: sanitizeValue(item.rata_metrit)
      ? new Decimal(item.rata_metrit)
      : null,
    lat: sanitizeValue(item.lat) ? new Decimal(item.lat) : null,
    long: sanitizeValue(item.long) ? new Decimal(item.long) : null,
    created: sanitizeValue(item.created) ? new Date(item.created) : null,
    modified: sanitizeValue(item.modified) ? new Date(item.modified) : null,
    geoviite_konvertoitu_lat: sanitizeValue(item.geoviite_konvertoitu_lat)
      ? new Decimal(item.geoviite_konvertoitu_lat)
      : null,

    geoviite_konvertoitu_long: sanitizeValue(item.geoviite_konvertoitu_long)
      ? new Decimal(item.geoviite_konvertoitu_long)
      : null,

    geoviite_konvertoitu_rataosuus_numero: sanitizeValue(
      item.geoviite_konvertoitu_rataosuus_numero,
    )
      ? String(item.geoviite_konvertoitu_rataosuus_numero)
      : null,

    geoviite_konvertoitu_rataosuus_nimi: sanitizeValue(
      item.geoviite_konvertoitu_rataosuus_nimi,
    )
      ? String(item.geoviite_konvertoitu_rataosuus_nimi)
      : null,

    geoviite_konvertoitu_raide_numero: sanitizeValue(
      item.geoviite_konvertoitu_raide_numero,
    )
      ? String(item.geoviite_konvertoitu_raide_numero)
      : null,

    geoviite_konvertoitu_rata_kilometri: sanitizeValue(
      item.geoviite_konvertoitu_rata_kilometri,
    )
      ? Number(item.geoviite_konvertoitu_rata_kilometri)
      : null,

    geoviite_konvertoitu_rata_metrit: sanitizeValue(
      item.geoviite_konvertoitu_rata_metrit,
    )
      ? new Decimal(item.geoviite_konvertoitu_rata_metrit)
      : null,

    geoviite_valimatka: sanitizeValue(item.geoviite_valimatka)
      ? new Decimal(item.geoviite_valimatka)
      : null,

    geoviite_sijaintiraide_kuvaus: sanitizeValue(
      item.geoviite_sijaintiraide_kuvaus,
    )
      ? String(item.geoviite_sijaintiraide_kuvaus)
      : null,

    geoviite_sijaintiraide_tyyppi: sanitizeValue(
      item.geoviite_sijaintiraide_tyyppi,
    )
      ? String(item.geoviite_sijaintiraide_tyyppi)
      : null,

    geoviite_updated_at: sanitizeValue(item.geoviite_updated_at)
      ? new Date(item.geoviite_updated_at)
      : null,
  }));
}

type TsightMittaus = {
  raportti_id: number;
  running_date: Date;
  jarjestelma?: jarjestelma | null;
  sscount?: number | null;
  sijainti?: any | null; // Unsupported type, left as-is
  ajonopeus?: Decimal | null;
  ballast_slope_l?: Decimal | null;
  ballast_width_l?: Decimal | null;
  ballast_height_l?: Decimal | null;
  ballast_slope_r?: Decimal | null;
  ballast_width_r?: Decimal | null;
  ballast_height_r?: Decimal | null;
  platform_center_h_l?: Decimal | null;
  platform_run_v_l?: Decimal | null;
  platform_center_h_r?: Decimal | null;
  platform_run_v_r?: Decimal | null;
  fin1_kin_min_distance?: Decimal | null;
  fin1_kin_leftrail_min_dist?: Decimal | null;
  fin1_kin_rightrail_min_dist?: Decimal | null;
  sg_mt_kin_min_distance?: Decimal | null;
  sg_mt_kin_leftrail_min_distance?: Decimal | null;
  sg_mt_kin_rightrail_min_distance?: Decimal | null;
  sg_st_kin_min_distance?: Decimal | null;
  sg_st_kin_leftrail_min_distance?: Decimal | null;
  sg_st_kin_rightrail_min_distance?: Decimal | null;
  oversize_kin_min_distance?: Decimal | null;
  oversize_kin_leftrail_min_distance?: Decimal | null;
  oversize_kin_rightrail_min_distance?: Decimal | null;
  gauge_adjacenttrack_left?: Decimal | null;
  distance_adjacenttrack_left?: Decimal | null;
  gauge_adjacenttrack_right?: Decimal | null;
  distance_adjacenttrack_right?: Decimal | null;
  track?: string | null;
  location?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  rataosuus_numero?: string | null;
  rataosuus_nimi?: string | null;
  raide_numero?: string | null;
  rata_kilometri?: number | null;
  rata_metrit?: Decimal | null;
  lat?: Decimal | null;
  long?: Decimal | null;
  created?: Date | null;
  modified?: Date | null;
  geoviite_konvertoitu_lat?: Decimal | null;
  geoviite_konvertoitu_long?: Decimal | null;
  geoviite_konvertoitu_rataosuus_numero?: string | null;
  geoviite_konvertoitu_rataosuus_nimi?: string | null;
  geoviite_konvertoitu_raide_numero?: string | null;
  geoviite_konvertoitu_rata_kilometri?: number | null;
  geoviite_konvertoitu_rata_metrit?: Decimal | null;
  geoviite_konvertoitu_sijainti?: any | null;
  geoviite_valimatka?: Decimal | null;
  geoviite_sijaintiraide_kuvaus?: string | null;
  geoviite_sijaintiraide_tyyppi?: string | null;
  geoviite_updated_at?: Date | null;
};

export function convertDataToTsightMittausArray(data: any[]): TsightMittaus[] {
  return data.map(item => ({
    raportti_id: parseInt(item.raportti_id, 10),
    running_date: item.running_date,

    jarjestelma: sanitizeValue(item.jarjestelma),
    sscount: sanitizeValue(item.sscount) ? parseInt(item.sscount, 10) : null,

    ajonopeus: sanitizeValue(item.ajonopeus)
      ? new Decimal(item.ajonopeus)
      : null,
    ballast_slope_l: sanitizeValue(item.ballast_slope_l)
      ? new Decimal(item.ballast_slope_l)
      : null,
    ballast_width_l: sanitizeValue(item.ballast_width_l)
      ? new Decimal(item.ballast_width_l)
      : null,
    ballast_height_l: sanitizeValue(item.ballast_height_l)
      ? new Decimal(item.ballast_height_l)
      : null,
    ballast_slope_r: sanitizeValue(item.ballast_slope_r)
      ? new Decimal(item.ballast_slope_r)
      : null,
    ballast_width_r: sanitizeValue(item.ballast_width_r)
      ? new Decimal(item.ballast_width_r)
      : null,
    ballast_height_r: sanitizeValue(item.ballast_height_r)
      ? new Decimal(item.ballast_height_r)
      : null,
    platform_center_h_l: sanitizeValue(item.platform_center_h_l)
      ? new Decimal(item.platform_center_h_l)
      : null,
    platform_run_v_l: sanitizeValue(item.platform_run_v_l)
      ? new Decimal(item.platform_run_v_l)
      : null,
    platform_center_h_r: sanitizeValue(item.platform_center_h_r)
      ? new Decimal(item.platform_center_h_r)
      : null,
    platform_run_v_r: sanitizeValue(item.platform_run_v_r)
      ? new Decimal(item.platform_run_v_r)
      : null,
    fin1_kin_min_distance: sanitizeValue(item.fin1_kin_min_distance)
      ? new Decimal(item.fin1_kin_min_distance)
      : null,
    fin1_kin_leftrail_min_dist: sanitizeValue(item.fin1_kin_leftrail_min_dist)
      ? new Decimal(item.fin1_kin_leftrail_min_dist)
      : null,
    fin1_kin_rightrail_min_dist: sanitizeValue(item.fin1_kin_rightrail_min_dist)
      ? new Decimal(item.fin1_kin_rightrail_min_dist)
      : null,
    sg_mt_kin_min_distance: sanitizeValue(item.sg_mt_kin_min_distance)
      ? new Decimal(item.sg_mt_kin_min_distance)
      : null,
    sg_mt_kin_leftrail_min_distance: sanitizeValue(
      item.sg_mt_kin_leftrail_min_distance,
    )
      ? new Decimal(item.sg_mt_kin_leftrail_min_distance)
      : null,
    sg_mt_kin_rightrail_min_distance: sanitizeValue(
      item.sg_mt_kin_rightrail_min_distance,
    )
      ? new Decimal(item.sg_mt_kin_rightrail_min_distance)
      : null,
    sg_st_kin_min_distance: sanitizeValue(item.sg_st_kin_min_distance)
      ? new Decimal(item.sg_st_kin_min_distance)
      : null,
    sg_st_kin_leftrail_min_distance: sanitizeValue(
      item.sg_st_kin_leftrail_min_distance,
    )
      ? new Decimal(item.sg_st_kin_leftrail_min_distance)
      : null,
    sg_st_kin_rightrail_min_distance: sanitizeValue(
      item.sg_st_kin_rightrail_min_distance,
    )
      ? new Decimal(item.sg_st_kin_rightrail_min_distance)
      : null,
    oversize_kin_min_distance: sanitizeValue(item.oversize_kin_min_distance)
      ? new Decimal(item.oversize_kin_min_distance)
      : null,
    oversize_kin_leftrail_min_distance: sanitizeValue(
      item.oversize_kin_leftrail_min_distance,
    )
      ? new Decimal(item.oversize_kin_leftrail_min_distance)
      : null,
    oversize_kin_rightrail_min_distance: sanitizeValue(
      item.oversize_kin_rightrail_min_distance,
    )
      ? new Decimal(item.oversize_kin_rightrail_min_distance)
      : null,
    gauge_adjacenttrack_left: sanitizeValue(item.gauge_adjacenttrack_left)
      ? new Decimal(item.gauge_adjacenttrack_left)
      : null,
    distance_adjacenttrack_left: sanitizeValue(item.distance_adjacenttrack_left)
      ? new Decimal(item.distance_adjacenttrack_left)
      : null,
    gauge_adjacenttrack_right: sanitizeValue(item.gauge_adjacenttrack_right)
      ? new Decimal(item.gauge_adjacenttrack_right)
      : null,
    distance_adjacenttrack_right: sanitizeValue(
      item.distance_adjacenttrack_right,
    )
      ? new Decimal(item.distance_adjacenttrack_right)
      : null,
    track: item.track || null,
    location: item.location || null,
    latitude: item.latitude || null,
    longitude: item.longitude || null,
    rataosuus_numero: item.rataosuus_numero || null,
    rataosuus_nimi: sanitizeValue(item.rataosuus_nimi)
      ? item.rataosuus_nimi
      : null,
    raide_numero: item.raide_numero || null,
    rata_kilometri: sanitizeValue(item.rata_kilometri)
      ? parseInt(item.rata_kilometri, 10)
      : null,
    rata_metrit: sanitizeValue(item.rata_metrit)
      ? new Decimal(item.rata_metrit)
      : null,
    lat: sanitizeValue(item.lat) ? new Decimal(item.lat) : null,
    long: sanitizeValue(item.long) ? new Decimal(item.long) : null,
    created: sanitizeValue(item.created) ? new Date(item.created) : null,
    modified: sanitizeValue(item.modified) ? new Date(item.modified) : null,
    geoviite_konvertoitu_lat: sanitizeValue(item.geoviite_konvertoitu_lat)
      ? new Decimal(item.geoviite_konvertoitu_lat)
      : null,

    geoviite_konvertoitu_long: sanitizeValue(item.geoviite_konvertoitu_long)
      ? new Decimal(item.geoviite_konvertoitu_long)
      : null,

    geoviite_konvertoitu_rataosuus_numero: sanitizeValue(
      item.geoviite_konvertoitu_rataosuus_numero,
    )
      ? String(item.geoviite_konvertoitu_rataosuus_numero)
      : null,

    geoviite_konvertoitu_rataosuus_nimi: sanitizeValue(
      item.geoviite_konvertoitu_rataosuus_nimi,
    )
      ? String(item.geoviite_konvertoitu_rataosuus_nimi)
      : null,

    geoviite_konvertoitu_raide_numero: sanitizeValue(
      item.geoviite_konvertoitu_raide_numero,
    )
      ? String(item.geoviite_konvertoitu_raide_numero)
      : null,

    geoviite_konvertoitu_rata_kilometri: sanitizeValue(
      item.geoviite_konvertoitu_rata_kilometri,
    )
      ? Number(item.geoviite_konvertoitu_rata_kilometri)
      : null,

    geoviite_konvertoitu_rata_metrit: sanitizeValue(
      item.geoviite_konvertoitu_rata_metrit,
    )
      ? new Decimal(item.geoviite_konvertoitu_rata_metrit)
      : null,

    geoviite_valimatka: sanitizeValue(item.geoviite_valimatka)
      ? new Decimal(item.geoviite_valimatka)
      : null,

    geoviite_sijaintiraide_kuvaus: sanitizeValue(
      item.geoviite_sijaintiraide_kuvaus,
    )
      ? String(item.geoviite_sijaintiraide_kuvaus)
      : null,

    geoviite_sijaintiraide_tyyppi: sanitizeValue(
      item.geoviite_sijaintiraide_tyyppi,
    )
      ? String(item.geoviite_sijaintiraide_tyyppi)
      : null,

    geoviite_updated_at: sanitizeValue(item.geoviite_updated_at)
      ? new Date(item.geoviite_updated_at)
      : null,
  }));
}
