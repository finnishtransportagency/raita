import { ERROR_CODES, parseCSVContent } from '../../../../utils/zod-csv/zcsv';
import { amsSchema } from './amsCsvSchema';
import { tidyUpFileBody } from './utils';
import {getEnvOrFail} from "../../../../../utils";
import postgres from 'postgres';
import {
  baseObjectInputType,
  baseObjectOutputType, objectUtil,
  TypeOf,
  ZodEffects, ZodError,
  ZodNumber,
  ZodObject,
  ZodString,
  ZodTypeAny
} from "zod";

let connection: postgres.Sql;

function tidyHeadersAMSSpecific(headerLine: string):string{
  return headerLine.replace(/Running Dynamics\.Ajonopeus/, 'ams_ajonopeus').replace(/Running Dynamics\./g, '');
}

export async function parseAMSCSVData(csvFileBody: string) {
  const tidyedFileBody = tidyUpFileBody(csvFileBody, tidyHeadersAMSSpecific);

  const parsedCSVContent = parseCSVContent(tidyedFileBody, amsSchema);

  console.log('parsed data: ');
  console.log(parsedCSVContent);
  await writeToDB(parsedCSVContent);
  return parsedCSVContent;
}

async function getConnection() {
  if (connection) {
    return connection;
  }
 // const password = await getSecretsManagerSecret('database_password');
  const password = 'password';
  connection = postgres({ password, username:"postgres"
  });
  return connection;
}

async function writeToDB(
  parsedCSVContent:
    | {
        success: true;
        header: string[];
        allRows: Record<string, string | undefined>[];
        validRows: TypeOf<
          ZodObject<
            {
              poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
              poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
              vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
              oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
              oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
              vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
              latitude: ZodEffects<ZodString>;
              pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
              ams_ajonopeus: ZodEffects<ZodNumber>;
              poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
              vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
              poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
              vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
              oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
              track: ZodEffects<ZodString>;
              longitude: ZodEffects<ZodString>;
              pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
              pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
              vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
              oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
              oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
              oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
              pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
              location: ZodEffects<ZodString>;
              vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
              transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
              transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
              sscount: ZodEffects<ZodNumber>;
              ajonopeus: ZodEffects<ZodNumber>;
            },
            'strip',
            ZodTypeAny,
            {
              [k_1 in keyof objectUtil.addQuestionMarks<
                baseObjectOutputType<{
                  poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                  poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                  vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  latitude: ZodEffects<ZodString>;
                  pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                  ams_ajonopeus: ZodEffects<ZodNumber>;
                  poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                  vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                  vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  track: ZodEffects<ZodString>;
                  longitude: ZodEffects<ZodString>;
                  pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                  pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                  vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                  location: ZodEffects<ZodString>;
                  vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
                  transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
                  sscount: ZodEffects<ZodNumber>;
                  ajonopeus: ZodEffects<ZodNumber>;
                }>,
                {
                  [k in keyof baseObjectOutputType<{
                    poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                    poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                    vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    latitude: ZodEffects<ZodString>;
                    pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                    ams_ajonopeus: ZodEffects<ZodNumber>;
                    poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                    vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                    vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    track: ZodEffects<ZodString>;
                    longitude: ZodEffects<ZodString>;
                    pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                    pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                    vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                    location: ZodEffects<ZodString>;
                    vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
                    transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
                    sscount: ZodEffects<ZodNumber>;
                    ajonopeus: ZodEffects<ZodNumber>;
                  }>]: undefined extends baseObjectOutputType<{
                    poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                    poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                    vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    latitude: ZodEffects<ZodString>;
                    pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                    ams_ajonopeus: ZodEffects<ZodNumber>;
                    poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                    vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                    vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    track: ZodEffects<ZodString>;
                    longitude: ZodEffects<ZodString>;
                    pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                    pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                    vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                    location: ZodEffects<ZodString>;
                    vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
                    transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
                    sscount: ZodEffects<ZodNumber>;
                    ajonopeus: ZodEffects<ZodNumber>;
                  }>[k]
                    ? never
                    : k;
                }[keyof {
                  poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                  poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                  vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  latitude: ZodEffects<ZodString>;
                  pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                  ams_ajonopeus: ZodEffects<ZodNumber>;
                  poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                  vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                  vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  track: ZodEffects<ZodString>;
                  longitude: ZodEffects<ZodString>;
                  pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                  pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                  vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                  location: ZodEffects<ZodString>;
                  vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
                  transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
                  sscount: ZodEffects<ZodNumber>;
                  ajonopeus: ZodEffects<ZodNumber>;
                }]
              >]: objectUtil.addQuestionMarks<
                baseObjectOutputType<{
                  poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                  poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                  vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  latitude: ZodEffects<ZodString>;
                  pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                  ams_ajonopeus: ZodEffects<ZodNumber>;
                  poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                  vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                  vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  track: ZodEffects<ZodString>;
                  longitude: ZodEffects<ZodString>;
                  pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                  pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                  vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                  location: ZodEffects<ZodString>;
                  vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
                  transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
                  sscount: ZodEffects<ZodNumber>;
                  ajonopeus: ZodEffects<ZodNumber>;
                }>,
                {
                  [k in keyof baseObjectOutputType<{
                    poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                    poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                    vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    latitude: ZodEffects<ZodString>;
                    pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                    ams_ajonopeus: ZodEffects<ZodNumber>;
                    poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                    vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                    vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    track: ZodEffects<ZodString>;
                    longitude: ZodEffects<ZodString>;
                    pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                    pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                    vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                    location: ZodEffects<ZodString>;
                    vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
                    transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
                    sscount: ZodEffects<ZodNumber>;
                    ajonopeus: ZodEffects<ZodNumber>;
                  }>]: undefined extends baseObjectOutputType<{
                    poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                    poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                    vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    latitude: ZodEffects<ZodString>;
                    pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                    ams_ajonopeus: ZodEffects<ZodNumber>;
                    poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                    vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                    vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    track: ZodEffects<ZodString>;
                    longitude: ZodEffects<ZodString>;
                    pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                    pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                    vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                    location: ZodEffects<ZodString>;
                    vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
                    transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
                    sscount: ZodEffects<ZodNumber>;
                    ajonopeus: ZodEffects<ZodNumber>;
                  }>[k]
                    ? never
                    : k;
                }[keyof {
                  poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                  poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                  vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  latitude: ZodEffects<ZodString>;
                  pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                  ams_ajonopeus: ZodEffects<ZodNumber>;
                  poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                  vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                  vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  track: ZodEffects<ZodString>;
                  longitude: ZodEffects<ZodString>;
                  pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                  pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                  vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                  location: ZodEffects<ZodString>;
                  vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
                  transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
                  sscount: ZodEffects<ZodNumber>;
                  ajonopeus: ZodEffects<ZodNumber>;
                }]
              >[k_1];
            },
            {
              [k_2 in keyof baseObjectInputType<{
                poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                latitude: ZodEffects<ZodString>;
                pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                ams_ajonopeus: ZodEffects<ZodNumber>;
                poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                track: ZodEffects<ZodString>;
                longitude: ZodEffects<ZodString>;
                pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                location: ZodEffects<ZodString>;
                vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
                transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
                sscount: ZodEffects<ZodNumber>;
                ajonopeus: ZodEffects<ZodNumber>;
              }>]: baseObjectInputType<{
                poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                latitude: ZodEffects<ZodString>;
                pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                ams_ajonopeus: ZodEffects<ZodNumber>;
                poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                track: ZodEffects<ZodString>;
                longitude: ZodEffects<ZodString>;
                pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                location: ZodEffects<ZodString>;
                vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
                transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
                sscount: ZodEffects<ZodNumber>;
                ajonopeus: ZodEffects<ZodNumber>;
              }>[k_2];
            }
          >
        >[];
      }
    | {
        success: false;
        header: string[];
        allRows: Record<string, string | undefined>[];
        validRows: TypeOf<
          ZodObject<
            {
              poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
              poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
              vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
              oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
              oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
              vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
              latitude: ZodEffects<ZodString>;
              pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
              ams_ajonopeus: ZodEffects<ZodNumber>;
              poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
              vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
              poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
              vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
              oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
              track: ZodEffects<ZodString>;
              longitude: ZodEffects<ZodString>;
              pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
              pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
              vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
              oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
              oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
              oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
              pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
              location: ZodEffects<ZodString>;
              vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
              transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
              transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
              sscount: ZodEffects<ZodNumber>;
              ajonopeus: ZodEffects<ZodNumber>;
            },
            'strip',
            ZodTypeAny,
            {
              [k_1 in keyof objectUtil.addQuestionMarks<
                baseObjectOutputType<{
                  poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                  poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                  vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  latitude: ZodEffects<ZodString>;
                  pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                  ams_ajonopeus: ZodEffects<ZodNumber>;
                  poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                  vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                  vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  track: ZodEffects<ZodString>;
                  longitude: ZodEffects<ZodString>;
                  pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                  pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                  vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                  location: ZodEffects<ZodString>;
                  vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
                  transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
                  sscount: ZodEffects<ZodNumber>;
                  ajonopeus: ZodEffects<ZodNumber>;
                }>,
                {
                  [k in keyof baseObjectOutputType<{
                    poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                    poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                    vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    latitude: ZodEffects<ZodString>;
                    pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                    ams_ajonopeus: ZodEffects<ZodNumber>;
                    poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                    vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                    vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    track: ZodEffects<ZodString>;
                    longitude: ZodEffects<ZodString>;
                    pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                    pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                    vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                    location: ZodEffects<ZodString>;
                    vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
                    transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
                    sscount: ZodEffects<ZodNumber>;
                    ajonopeus: ZodEffects<ZodNumber>;
                  }>]: undefined extends baseObjectOutputType<{
                    poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                    poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                    vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    latitude: ZodEffects<ZodString>;
                    pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                    ams_ajonopeus: ZodEffects<ZodNumber>;
                    poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                    vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                    vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    track: ZodEffects<ZodString>;
                    longitude: ZodEffects<ZodString>;
                    pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                    pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                    vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                    location: ZodEffects<ZodString>;
                    vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
                    transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
                    sscount: ZodEffects<ZodNumber>;
                    ajonopeus: ZodEffects<ZodNumber>;
                  }>[k]
                    ? never
                    : k;
                }[keyof {
                  poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                  poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                  vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  latitude: ZodEffects<ZodString>;
                  pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                  ams_ajonopeus: ZodEffects<ZodNumber>;
                  poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                  vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                  vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  track: ZodEffects<ZodString>;
                  longitude: ZodEffects<ZodString>;
                  pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                  pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                  vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                  location: ZodEffects<ZodString>;
                  vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
                  transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
                  sscount: ZodEffects<ZodNumber>;
                  ajonopeus: ZodEffects<ZodNumber>;
                }]
              >]: objectUtil.addQuestionMarks<
                baseObjectOutputType<{
                  poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                  poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                  vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  latitude: ZodEffects<ZodString>;
                  pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                  ams_ajonopeus: ZodEffects<ZodNumber>;
                  poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                  vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                  vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  track: ZodEffects<ZodString>;
                  longitude: ZodEffects<ZodString>;
                  pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                  pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                  vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                  location: ZodEffects<ZodString>;
                  vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
                  transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
                  sscount: ZodEffects<ZodNumber>;
                  ajonopeus: ZodEffects<ZodNumber>;
                }>,
                {
                  [k in keyof baseObjectOutputType<{
                    poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                    poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                    vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    latitude: ZodEffects<ZodString>;
                    pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                    ams_ajonopeus: ZodEffects<ZodNumber>;
                    poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                    vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                    vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    track: ZodEffects<ZodString>;
                    longitude: ZodEffects<ZodString>;
                    pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                    pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                    vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                    location: ZodEffects<ZodString>;
                    vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
                    transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
                    sscount: ZodEffects<ZodNumber>;
                    ajonopeus: ZodEffects<ZodNumber>;
                  }>]: undefined extends baseObjectOutputType<{
                    poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                    poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                    vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    latitude: ZodEffects<ZodString>;
                    pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                    ams_ajonopeus: ZodEffects<ZodNumber>;
                    poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                    vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                    vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    track: ZodEffects<ZodString>;
                    longitude: ZodEffects<ZodString>;
                    pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                    pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                    vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                    location: ZodEffects<ZodString>;
                    vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
                    transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
                    sscount: ZodEffects<ZodNumber>;
                    ajonopeus: ZodEffects<ZodNumber>;
                  }>[k]
                    ? never
                    : k;
                }[keyof {
                  poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                  poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                  vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  latitude: ZodEffects<ZodString>;
                  pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                  ams_ajonopeus: ZodEffects<ZodNumber>;
                  poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                  vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                  vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  track: ZodEffects<ZodString>;
                  longitude: ZodEffects<ZodString>;
                  pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                  pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                  vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                  location: ZodEffects<ZodString>;
                  vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
                  transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
                  sscount: ZodEffects<ZodNumber>;
                  ajonopeus: ZodEffects<ZodNumber>;
                }]
              >[k_1];
            },
            {
              [k_2 in keyof baseObjectInputType<{
                poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                latitude: ZodEffects<ZodString>;
                pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                ams_ajonopeus: ZodEffects<ZodNumber>;
                poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                track: ZodEffects<ZodString>;
                longitude: ZodEffects<ZodString>;
                pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                location: ZodEffects<ZodString>;
                vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
                transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
                sscount: ZodEffects<ZodNumber>;
                ajonopeus: ZodEffects<ZodNumber>;
              }>]: baseObjectInputType<{
                poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                latitude: ZodEffects<ZodString>;
                pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                ams_ajonopeus: ZodEffects<ZodNumber>;
                poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                track: ZodEffects<ZodString>;
                longitude: ZodEffects<ZodString>;
                pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                location: ZodEffects<ZodString>;
                vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
                transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
                sscount: ZodEffects<ZodNumber>;
                ajonopeus: ZodEffects<ZodNumber>;
              }>[k_2];
            }
          >
        >[];
        errors: {
          header?: {
            errorCode: keyof (typeof ERROR_CODES)['HEADER'];
            header: string;
          };
          rows?: Record<
            string,
            ZodError<
              ZodObject<
                {
                  poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                  poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                  vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  latitude: ZodEffects<ZodString>;
                  pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                  ams_ajonopeus: ZodEffects<ZodNumber>;
                  poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                  vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                  vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  track: ZodEffects<ZodString>;
                  longitude: ZodEffects<ZodString>;
                  pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                  pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                  vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                  oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                  pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                  location: ZodEffects<ZodString>;
                  vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                  transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
                  transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
                  sscount: ZodEffects<ZodNumber>;
                  ajonopeus: ZodEffects<ZodNumber>;
                },
                'strip',
                ZodTypeAny,
                {
                  [k_1 in keyof objectUtil.addQuestionMarks<
                    baseObjectOutputType<{
                      poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                      poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                      vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                      oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                      oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                      vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                      latitude: ZodEffects<ZodString>;
                      pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                      ams_ajonopeus: ZodEffects<ZodNumber>;
                      poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                      vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                      poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                      vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                      oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                      track: ZodEffects<ZodString>;
                      longitude: ZodEffects<ZodString>;
                      pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                      pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                      vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                      oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                      oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                      oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                      pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                      location: ZodEffects<ZodString>;
                      vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                      transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
                      transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
                      sscount: ZodEffects<ZodNumber>;
                      ajonopeus: ZodEffects<ZodNumber>;
                    }>,
                    {
                      [k in keyof baseObjectOutputType<{
                        poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                        poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                        vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                        oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                        oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                        vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                        latitude: ZodEffects<ZodString>;
                        pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                        ams_ajonopeus: ZodEffects<ZodNumber>;
                        poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                        vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                        poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                        vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                        oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                        track: ZodEffects<ZodString>;
                        longitude: ZodEffects<ZodString>;
                        pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                        pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                        vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                        oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                        oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                        oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                        pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                        location: ZodEffects<ZodString>;
                        vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                        transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
                        transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
                        sscount: ZodEffects<ZodNumber>;
                        ajonopeus: ZodEffects<ZodNumber>;
                      }>]: undefined extends baseObjectOutputType<{
                        poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                        poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                        vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                        oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                        oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                        vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                        latitude: ZodEffects<ZodString>;
                        pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                        ams_ajonopeus: ZodEffects<ZodNumber>;
                        poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                        vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                        poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                        vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                        oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                        track: ZodEffects<ZodString>;
                        longitude: ZodEffects<ZodString>;
                        pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                        pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                        vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                        oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                        oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                        oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                        pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                        location: ZodEffects<ZodString>;
                        vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                        transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
                        transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
                        sscount: ZodEffects<ZodNumber>;
                        ajonopeus: ZodEffects<ZodNumber>;
                      }>[k]
                        ? never
                        : k;
                    }[keyof {
                      poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                      poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                      vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                      oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                      oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                      vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                      latitude: ZodEffects<ZodString>;
                      pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                      ams_ajonopeus: ZodEffects<ZodNumber>;
                      poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                      vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                      poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                      vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                      oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                      track: ZodEffects<ZodString>;
                      longitude: ZodEffects<ZodString>;
                      pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                      pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                      vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                      oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                      oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                      oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                      pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                      location: ZodEffects<ZodString>;
                      vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                      transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
                      transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
                      sscount: ZodEffects<ZodNumber>;
                      ajonopeus: ZodEffects<ZodNumber>;
                    }]
                  >]: objectUtil.addQuestionMarks<
                    baseObjectOutputType<{
                      poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                      poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                      vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                      oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                      oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                      vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                      latitude: ZodEffects<ZodString>;
                      pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                      ams_ajonopeus: ZodEffects<ZodNumber>;
                      poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                      vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                      poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                      vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                      oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                      track: ZodEffects<ZodString>;
                      longitude: ZodEffects<ZodString>;
                      pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                      pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                      vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                      oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                      oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                      oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                      pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                      location: ZodEffects<ZodString>;
                      vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                      transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
                      transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
                      sscount: ZodEffects<ZodNumber>;
                      ajonopeus: ZodEffects<ZodNumber>;
                    }>,
                    {
                      [k in keyof baseObjectOutputType<{
                        poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                        poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                        vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                        oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                        oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                        vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                        latitude: ZodEffects<ZodString>;
                        pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                        ams_ajonopeus: ZodEffects<ZodNumber>;
                        poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                        vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                        poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                        vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                        oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                        track: ZodEffects<ZodString>;
                        longitude: ZodEffects<ZodString>;
                        pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                        pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                        vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                        oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                        oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                        oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                        pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                        location: ZodEffects<ZodString>;
                        vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                        transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
                        transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
                        sscount: ZodEffects<ZodNumber>;
                        ajonopeus: ZodEffects<ZodNumber>;
                      }>]: undefined extends baseObjectOutputType<{
                        poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                        poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                        vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                        oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                        oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                        vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                        latitude: ZodEffects<ZodString>;
                        pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                        ams_ajonopeus: ZodEffects<ZodNumber>;
                        poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                        vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                        poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                        vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                        oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                        track: ZodEffects<ZodString>;
                        longitude: ZodEffects<ZodString>;
                        pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                        pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                        vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                        oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                        oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                        oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                        pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                        location: ZodEffects<ZodString>;
                        vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                        transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
                        transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
                        sscount: ZodEffects<ZodNumber>;
                        ajonopeus: ZodEffects<ZodNumber>;
                      }>[k]
                        ? never
                        : k;
                    }[keyof {
                      poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                      poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                      vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                      oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                      oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                      vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                      latitude: ZodEffects<ZodString>;
                      pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                      ams_ajonopeus: ZodEffects<ZodNumber>;
                      poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                      vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                      poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                      vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                      oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                      track: ZodEffects<ZodString>;
                      longitude: ZodEffects<ZodString>;
                      pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                      pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                      vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                      oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                      oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                      oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                      pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                      location: ZodEffects<ZodString>;
                      vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                      transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
                      transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
                      sscount: ZodEffects<ZodNumber>;
                      ajonopeus: ZodEffects<ZodNumber>;
                    }]
                  >[k_1];
                },
                {
                  [k_2 in keyof baseObjectInputType<{
                    poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                    poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                    vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    latitude: ZodEffects<ZodString>;
                    pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                    ams_ajonopeus: ZodEffects<ZodNumber>;
                    poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                    vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                    vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    track: ZodEffects<ZodString>;
                    longitude: ZodEffects<ZodString>;
                    pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                    pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                    vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                    location: ZodEffects<ZodString>;
                    vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
                    transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
                    sscount: ZodEffects<ZodNumber>;
                    ajonopeus: ZodEffects<ZodNumber>;
                  }>]: baseObjectInputType<{
                    poikittainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                    poikittainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                    vasen_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    oikea_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    oikea_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    vasen_poikittainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    latitude: ZodEffects<ZodString>;
                    pystysuuntainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                    ams_ajonopeus: ZodEffects<ZodNumber>;
                    poikittainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                    vasen_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    poikittainen_kiihtyvyys_c3_suodatettu: ZodEffects<ZodNumber>;
                    vasen_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    oikea_poikittainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    track: ZodEffects<ZodString>;
                    longitude: ZodEffects<ZodString>;
                    pystysuuntainen_kiihtyvyys_c2: ZodEffects<ZodNumber>;
                    pystysuuntainen_kiihtyvyys_c3: ZodEffects<ZodNumber>;
                    vasen_pystysuuntainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    oikea_poikittainen_kiihtyvyys_c1_suodatettu: ZodEffects<ZodNumber>;
                    oikea_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    oikea_pystysuuntainen_kiihtyvyys_c1: ZodEffects<ZodNumber>;
                    pystysuuntainen_kiihtyvyys_c2_suodatettu: ZodEffects<ZodNumber>;
                    location: ZodEffects<ZodString>;
                    vasen_pystysuuntainen_kiihtyvyys_c1_keskihajonta: ZodEffects<ZodNumber>;
                    transversal_acceleration_c2_mean_to_peak: ZodEffects<ZodNumber>;
                    transversal_acceleration_c3_mean_to_peak: ZodEffects<ZodNumber>;
                    sscount: ZodEffects<ZodNumber>;
                    ajonopeus: ZodEffects<ZodNumber>;
                  }>[k_2];
                }
              >
            >
          >;
        };
      },
) {
  const schema = "public";
  const timestamp = new Date(Date.now()).toISOString();
  const sql = await getConnection();
  return await sql`
    INSERT INTO ${sql(schema)}.ams_mittaus
    (id, ss_count)
    VALUES (1,2)`;
}
