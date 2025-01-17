import { getEnvOrFail } from '../../../../../utils';
import { getSecretsManagerSecret } from '../../../../utils/secretsManager';
import { Mittaus } from './model/Mittaus';
import { Rataosoite } from './model/Rataosoite';
import { log } from '../../../../utils/logger';
import { FileMetadataEntry } from '../../../../types';
import { Raportti } from './model/Raportti';
import { getPrismaClient } from '../../../../utils/prismaClient';
import {
  convertDataToAMSMittaus,

  convertDataToOhlMittausArray,
  convertDataToPiMittausArray,
  convertDataToRcMittausArray,
  convertDataToRpMittausArray,
  convertDataToTgMittausArray,
  convertDataToTsightMittausArray,
} from './converters/dataConverters';
import { jarjestelma, Prisma, PrismaClient } from '@prisma/client';
import { GeoviiteClientResultItem } from '../../../geoviite/geoviiteClient';

let connCount = 0;
let connReuseCount = 0;

export async function getDBConnection(): Promise<DBConnection> {
  const schema = getEnvOrFail('RAITA_PGSCHEMA');
  const prisma = await getPrismaClient();

  return { schema, prisma };
}

export type DBConnection = {
  schema: string;

  prisma: PrismaClient;
};

export async function writeRowsToDB(
  parsedCSVRows: any[],
  table: string,
  dbConnection: DBConnection,
): Promise<number> {
  const { schema, prisma } = dbConnection;
  try {
    let count;
    switch (table) {
      case TableEnum.AMS:
        count = addAMSMittausRecord(prisma, parsedCSVRows);
        break;
      case TableEnum.OHL:
        count = addOHLMittausRecord(prisma, parsedCSVRows);
        break;
      case TableEnum.PI:
        count = addPIMittausRecord(prisma, parsedCSVRows);
        break;
      case TableEnum.RC:
        count = addRCMittausRecord(prisma, parsedCSVRows);
        break;
      case TableEnum.RP:
        count = addRPMittausRecord(prisma, parsedCSVRows);
        break;
      case TableEnum.TG:
        count = addTGMittausRecord(prisma, parsedCSVRows);
        break;
      case TableEnum.TSIGHT:
        count = addTsightMittausRecord(prisma, parsedCSVRows);
        break;
      default:
        throw new Error(`Unhandled table type: ${table}`);
    }
    return count;
  } catch (e) {
    log.error('Error inserting measurement data: ' + table + ' ' + e);
    throw e;
  }
}

function constructRataosoite(track: string, location: string): Rataosoite {
  //Track: "008 KOKOL LR"
  //Location: "630+0850.00"

  /*  rataosuus_numero character varying(40), -- for example '006'
  rataosuus_nimi character varying(40), -- for example 'LHRP'
  raide_numero integer, -- for example 2
  rata_kilometri integer, -- for example 130
  rata_metrit DECIMAL -- for example 100.00*/
  const splittedTrack = track.split(' ');
  let raideNumero = '';
  let rataosuusNimi = '';
  let rataosuusNumero = '';
  if (splittedTrack.length == 3) {
    rataosuusNumero = splittedTrack[0];
    rataosuusNimi = splittedTrack[1];
    raideNumero = splittedTrack[2];
  }

  const splittedLocation = location.split('+');
  let rataKilometri = null;
  let rataMetrit = null;
  try {
    rataKilometri = Number(splittedLocation[0]);
    rataMetrit = Number(splittedLocation[1]);
  } catch (e) {
    log.error('constructRataosoite fail ' + track + location);
    throw Error('Illegal location: ' + location);
  }

  const rataosoite: Rataosoite = {
    raide_numero: raideNumero,
    rata_kilometri: rataKilometri,
    rata_metrit: rataMetrit,
    rataosuus_nimi: rataosuusNimi,
    rataosuus_numero: rataosuusNumero,
  };
  return rataosoite;
}

function convertCoord(coord: string) {
  return Number(coord.replace(/[^0-9$.,]/g, ''));
}

function handleNan(row: any, missingOptionalColumns: string[] | undefined) {
  //skip common mittaus fields except ajonopeus
  const {
    id,
    raportti_id,
    running_date,
    jarjestelma,
    sscount,
    rataosoite,
    sijainti,
    track,
    location,
    latitude,
    longitude,
    lat,
    long,
    raide_numero,
    rata_kilometri,
    rata_metrit,
    rataosuus_nimi,
    rataosuus_numero,
    ...measurements
  } = row;

  let nanFields = {};
  const NAN_REASON_POSTFIX = '_nan_reason';
  let missingOptionalColumnsFields = {};
  if (missingOptionalColumns) {
    missingOptionalColumnsFields = handleNanMissingColumns(
      missingOptionalColumns,
      NAN_REASON_POSTFIX,
    );
  }
  for (const [key, value] of Object.entries(measurements)) {
    if (value) {
      if (isNaN(Number(value))) {
        const stringValue = value as string;
        if (stringValue == '∞') {
          // @ts-ignore
          nanFields[key + NAN_REASON_POSTFIX] = 'INF_VALUE';
        } else if (stringValue == '-∞') {
          // @ts-ignore
          nanFields[key + NAN_REASON_POSTFIX] = 'MINUS_INF_VALUE';
        } else if (stringValue.toLowerCase() == 'inv') {
          // @ts-ignore
          nanFields[key + NAN_REASON_POSTFIX] = 'INV_VALUE';
        } else if (stringValue.toLowerCase() == 'nan') {
          // @ts-ignore
          nanFields[key + NAN_REASON_POSTFIX] = 'NAN_VALUE';
        } else if (stringValue.toLowerCase() == 'null') {
          // @ts-ignore
          nanFields[key + NAN_REASON_POSTFIX] = 'NULL_VALUE';
        } else {
          // @ts-ignore
          nanFields[key + NAN_REASON_POSTFIX] = 'UNKNOWN_VALUE';
        }
        //Measurement fields will be set to NaN.
        measurements[key] = 'NaN';
      }
    } else {
      // @ts-ignore
      nanFields[key + NAN_REASON_POSTFIX] = 'EMPTY_VALUE';
      //Measurement fields will be set to NaN.
      measurements[key] = 'NaN';
    }
  }
  return { ...measurements, ...nanFields, ...missingOptionalColumnsFields };
}

function handleNanMissingColumns(
  missingOptionalColumns: string[],
  NAN_REASON_POSTFIX: string,
) {
  //skip common mittaus fields except ajonopeus
  const commonMittausFields: string[] = [
    'id',
    'raportti_id',
    'running_date',
    'jarjestelma',
    'sscount',
    'rataosoite',
    'sijainti',
    'track',
    'location',
    'latitude',
    'longitude',
    'lat',
    'long',
    'raide_numero',
    'rata_kilometri',
    'rata_metrit',
    'rataosuus_nimi',
    'rataosuus_numero',
  ];
  let nanFields = {};
  let measurements = {};

  for (const missingOptionalColumn of missingOptionalColumns) {
    if (!commonMittausFields.includes(missingOptionalColumn)) {
      // @ts-ignore
      nanFields[missingOptionalColumn + NAN_REASON_POSTFIX] = 'MISSING_COLUMN';
      //Add measurement fields with NaN value.
      // @ts-ignore
      measurements[missingOptionalColumn] = 'NaN';
    }
  }

  return { ...measurements, ...nanFields };
}

export function convertToDBRow(
  row: any,
  runningDate: Date,
  reportId: number,
  fileNamePrefix: string,
  missingOptionalColumns: string[] | undefined,
) {
  const rataosoite: Rataosoite = constructRataosoite(row.track, row.location);
  let lat = undefined;
  let long = undefined;

  if (row.latitude) {
    lat = convertCoord(row.latitude);
  }
  if (row.longitude) {
    long = convertCoord(row.longitude);
  }

  const convertedRow = {
    ...row,
    raportti_id: reportId,
    running_date: runningDate,
    jarjestelma: fileNamePrefix,
    lat,
    long,
    ...rataosoite,
  };
 const x =  {
    ...convertedRow,
    ...handleNan(convertedRow, missingOptionalColumns),
  };

  switch (fileNamePrefix) {
    case 'AMS':
      return convertDataToAMSMittaus(x);
      break
  }
  return x;

}

/**
 * Delete all mittaus rows  from raportti
 */
export async function emptyRaporttiMittausRows(
  reportId: number,
  dbConnection: DBConnection,
) {
  const { schema, prisma } = dbConnection;
  try {
    const result = await prisma.mittaus.deleteMany({
      where: {
        raportti_id: reportId, // Assuming reportId is the variable that holds the ID you want to delete
      },
    });

    log.info({ result: result }, 'Deleted mittaus rows');
  } catch (error) {
    log.error({ error, reportId }, 'Error deleting mittaus rows');
    throw error;
  }
}

export async function updateRaporttiStatus(
  id: number,
  status: string,
  error: null | string,
  dbConnection: DBConnection,
) {
  const { schema, prisma } = dbConnection;
  let errorSubstring = error;
  if (error) {
    errorSubstring = error.substring(0, 1000);
  }
  try {
    const updatedRaportti = await prisma.raportti.updateMany({
      where: {
        id: id,
        OR: [{ status: null }, { status: { not: 'ERROR' } }],
      },
      data: {
        status: status,
        error: errorSubstring,
      },
    });
  } catch (e) {
    log.error('Error updating raportti status');
    log.error(e);

    throw e;
  }
}
export async function updateRaporttiMetadataStatus(
  id: number,
  status: string,
  dbConnection: DBConnection,
) {
  const { schema, prisma } = dbConnection;
  try {
    const a = await prisma.raportti.update({
      where: { id: id },
      data: { metadata_status: status },
    });
  } catch (error) {
    log.error({ error }, 'Error updating raportti metadata_status');
    throw error;
  }
}

/*key": "Meeri/2022/Kamppis/20220202/20221020_TG_AMS_OHL_CW_Reports/554/KONVUS/1/2022/Over Head Line Geometry/20221020_144556/TextualReports/OHL_20221020_554_KONVUS_1_662_753.csv",
"file_name": "OHL_20221020_554_KONVUS_1_662_753.csv",
  "bucket_arn": "arn:aws:s3:::s3-raita-dev-premain-inspection-data",
  "bucket_name": "s3-raita-dev-premain-inspection-data",
  "size": 67343922,
  "metadata": {
  "source_system": "Meeri",
    "zip_reception__year": "2022",
    "campaign": "Kamppis",
    "zip_reception__date": "20220202",
    "zip_name": "20221020_TG_AMS_OHL_CW_Reports",
    "track_number": "554",
    "track_part": "KONVUS",
    "track_id": "1",
    "year": 2022,
    "system": "OHL",
    "inspection_datetime": "2022-10-20T11:45:56.000Z",
    "report_category": "TextualReports",
    "file_type": "csv",
    "inspection_date": "2022-10-20T00:00:00.000Z",
    "km_start": 662,
    "km_end": 753,
    "parser_version": "1.2.0",
    "parsed_at_datetime": "2024-03-13T10:14:28.427Z"
},
"hash": "bfd88d25e3840470f80db9ca9713f49a68addcb4da3c8790e418dd78594b32a1",
  "tags": {},
"reportId": 237*/

export async function updateRaporttiMetadata(
  data: Array<FileMetadataEntry>,
  dbConnection: DBConnection,
) {
  const { schema, prisma } = dbConnection;
  for (const metaDataEntry of data) {
    const parsingErrors = metaDataEntry.errors;
    const raporttiData = {
      size: metaDataEntry.size,
      hash: metaDataEntry.hash,
      ...metaDataEntry.metadata,
      track_number: metaDataEntry.metadata.track_number?.toString(),
      system:
        metaDataEntry.metadata.system == 'LSI-TSI'
          ? jarjestelma.LSI_TSI
          : (metaDataEntry.metadata.system as jarjestelma),
    };
    try {
      let id;
      if (metaDataEntry.reportId) {
        id = metaDataEntry.reportId;
      } else {
        throw new Error('ReportID undefined');
      }
      try {
        await prisma.raportti.update({
          where: { id: id },
          data: raporttiData,
        });
        if (parsingErrors) {
          await updateRaporttiMetadataStatus(id, 'ERROR', dbConnection);
        } else {
          await updateRaporttiMetadataStatus(id, 'SUCCESS', dbConnection);
        }
      } catch (e) {
        log.error('Update error to raportti table: ' + e);
        await updateRaporttiMetadataStatus(id, 'ERROR', dbConnection);
        throw e;
      }
    } catch (e) {
      log.error('Error in raportti metadata updating: ' + e);
      throw e;
    }
  }
}

export async function updateRaporttiChunks(
  id: number,
  chunks: number,
  dbConnection: DBConnection,
) {
  const { schema, prisma } = dbConnection;

  try {
    const a = await prisma.raportti.update({
      where: { id: id },
      data: { chunks_to_process: chunks },
    });
  } catch (e) {
    log.error('Error updating raportti status');
    log.error(e);

    throw e;
  }
}

export async function substractRaporttiChunk(
  id: number,
  dbConnection: DBConnection,
) {
  const { schema, prisma } = dbConnection;

  try {
    const a = await prisma.raportti.update({
      where: { id: id },
      data: {
        chunks_to_process: {
          decrement: 1,
        },
      },
    });
  } catch (e) {
    log.error('Error updating raportti status');
    log.error(e);

    throw e;
  }
}

/**
 *  @return amount of chunks left to process
 */
export async function raporttiChunksToProcess(
  id: number,
  dbConnection: DBConnection,
): Promise<number> {
  const { schema, prisma } = dbConnection;

  try {
    const chunks = await prisma.raportti.findUnique({
      where: { id: id },
      select: {
        chunks_to_process: true,
      },
    });
    return Number(chunks?.chunks_to_process);
  } catch (e) {
    log.error('Error SELECT chunks_to_process ');
    log.error(e);

    throw e;
  }
}

export async function insertRaporttiData(
  key: string,
  fileName: string,
  status: string | null,
  dbConnection: DBConnection,
): Promise<number> {
  const data: Raportti = {
    key,
    status,
    file_name: fileName,
    chunks_to_process: -1,
    events: null,
  };

  const { schema, prisma } = dbConnection;
  try {
    const raportti = await prisma.raportti.create({
      data: {
        key: key,
        status: status,
        file_name: fileName,
        chunks_to_process: -1,
        events: null,
      },
    });
    return raportti.id;
  } catch (e) {
    log.error('Error inserting raportti data');
    log.error(e);

    throw e;
  }
}

export async function writeMissingColumnsToDb(
  reportId: number,
  columnNames: string[],
  dbConnection: DBConnection,
): Promise<void> {
  const { schema, prisma } = dbConnection;

  const values = columnNames.map(name => ({
    raportti_id: reportId,
    column_name: name,
  }));

  const a = await prisma.puuttuva_kolumni.createMany({
    data: values,
    skipDuplicates: true,
  }); // conflict comes from unique constraint when this is ran for each file chunk
}

async function addAMSMittausRecord(
  prisma: PrismaClient,
  parsedCSVRows: any[],
): Promise<number> {
  try {
   // const convertedData = convertDataToAMSMittausArray(parsedCSVRows);
    const recordCount = await prisma.ams_mittaus.createMany({
      data: parsedCSVRows,
    });
    return recordCount.count;
  } catch {
    throw new Error(`Error in mittaus additions`);
  }
}
async function addOHLMittausRecord(
  prisma: PrismaClient,
  parsedCSVRows: any[],
): Promise<number> {
  try {
    const convertedData = convertDataToOhlMittausArray(parsedCSVRows);
    const recordCount = await prisma.ohl_mittaus.createMany({
      data: convertedData,
    });
    return recordCount.count;
  } catch {
    throw new Error(`Error in mittaus additions OHL`);
  }
}

async function addPIMittausRecord(
  prisma: PrismaClient,
  parsedCSVRows: any[],
): Promise<number> {
  try {
    const convertedData = convertDataToPiMittausArray(parsedCSVRows);
    const recordCount = await prisma.pi_mittaus.createMany({
      data: convertedData,
    });
    return recordCount.count;
  } catch {
    throw new Error(`Error in mittaus additions PI`);
  }
}

async function addRCMittausRecord(
  prisma: PrismaClient,
  parsedCSVRows: any[],
): Promise<number> {
  try {
    const convertedData = convertDataToRcMittausArray(parsedCSVRows);
    const recordCount = await prisma.rc_mittaus.createMany({
      data: convertedData,
    });
    return recordCount.count;
  } catch {
    throw new Error(`Error in mittaus additions`);
  }
}

async function addRPMittausRecord(
  prisma: PrismaClient,
  parsedCSVRows: any[],
): Promise<number> {
  try {
    const convertedData = convertDataToRpMittausArray(parsedCSVRows);
    const recordCount = await prisma.rp_mittaus.createMany({
      data: convertedData,
    });
    return recordCount.count;
  } catch {
    throw new Error(`Error in mittaus additions`);
  }
}

async function addTGMittausRecord(
  prisma: PrismaClient,
  parsedCSVRows: any[],
): Promise<number> {
  try {
    const convertedData = convertDataToTgMittausArray(parsedCSVRows);
    const recordCount = await prisma.tg_mittaus.createMany({
      data: convertedData,
    });
    return recordCount.count;
  } catch {
    throw new Error(`Error in mittaus additions TG`);
  }
}

async function addTsightMittausRecord(
  prisma: PrismaClient,
  parsedCSVRows: any[],
): Promise<number> {
  try {
    const convertedData = convertDataToTsightMittausArray(parsedCSVRows);
    const recordCount = await prisma.tsight_mittaus.createMany({
      data: convertedData,
    });
    return recordCount.count;
  } catch {
    throw new Error(`Error in mittaus additions TSIGHT`);
  }
}
enum TableEnum {
  AMS = 'ams_mittaus',
  OHL = 'ohl_mittaus',
  PI = 'pi_mittaus',
  RC = 'rc_mittaus',
  RP = 'rp_mittaus',
  TG = 'tg_mittaus',
  TSIGHT = 'tsight_mittaus',
}

export function produceGeoviiteBatchUpdateSql(
  batch: GeoviiteClientResultItem[],
  timestamp: Date,
  system: string | null,
  updateAlsoNonConvertedLatLong: boolean, //use when we insert flipped coords
) {
  const queryArray = [];
  const valsArray = [];


  const longQueryArray: string[] = [];
  const latQueryArray: string[] = [];
  const flippedOriginalLongQueryArray: string[] = [];
  const flippedOriginalLatQueryArray: string[] = [];
  const rataosuusNumeroQueryArray: string[] = [];
  const kmQueryArray: string[] = [];
  const mQueryArray: string[] = [];
  const rataosuusNimiQueryArray: string[] = [];
  const raideNumeroQueryArray: string[] = [];
  const valimatkaQueryArray: string[] = [];
  const sijRaideQueryArray: string[] = [];
  const sijRaideKuvQueryArray: string[] = [];
  const sijRaideTyyppiQueryArray: string[] = [];
  const sijRaideOidQueryArray: string[] = [];
  const ratanumeroOidQueryArray: string[] = [];
  const virheQueryArray: string[] = [];
  const timestampQueryArray: string[] = [];

  const longValsArray: (number | undefined)[] = [];
  const latValsArray: (number | undefined)[] = [];
  const flippedOriginalLongValsArray: (number | undefined)[] = [];
  const flippedOriginalLatValsArray: (number | undefined)[] = [];
  const rataosuusNumeroValsArray: any[] = [];
  const kmValsArray: (number | undefined)[] = [];
  const mValsArray: (number | null)[] = [];
  const rataosuusNimiValsArray: (number | string | null)[] = [];
  const raideNumeroValsArray: (string | number | null)[] = [];
  const valimatkaValsArray: (number | undefined)[] = [];
  const sijRaideValsArray: (string | number | undefined)[] = [];
  const sijRaideKuvValsArray: (string | number | undefined)[] = [];
  const sijRaideTyyppiValsArray: (string | number | undefined)[] = [];
  const sijRaideOidValsArray: (string | number | undefined)[] = [];
  const ratanumeroOidValsArray: (string | number | undefined)[] = [];
  const virheValsArray: (string | number | null)[] = [];
  const timestampValsArray: (number | Date)[] = [];

  //Add first row with fake vals with -1 id so nothing is ever updated. This is needed because "At least one of the result expressions in a CASE specification must be an expression other than the NULL constant".
  //Othervise we occasiationally get type error if all vals for some column are all null.
  longQueryArray.push(getSubtableUpdateQueryBeginning(system));
  longQueryArray.push(` then `);
  longValsArray.push(-1);
  longValsArray.push(-1.1);

  latQueryArray.push(` END, geoviite_konvertoitu_lat = CASE when id = `);
  latQueryArray.push(` then `);
  latValsArray.push(-1);
  latValsArray.push(-1.1);

  if(updateAlsoNonConvertedLatLong) {
    //flippedOriginalLong

    flippedOriginalLongQueryArray.push(` END, long = CASE when id = `,);
    flippedOriginalLongQueryArray.push(` then `);
    flippedOriginalLongValsArray.push(-1);
    flippedOriginalLongValsArray.push(-1.1);

    //flippedOriginalLat
    flippedOriginalLatQueryArray.push(` END, lat = CASE when id = `);
    flippedOriginalLatQueryArray.push(` then `);
    flippedOriginalLatValsArray.push(-1);
    flippedOriginalLatValsArray.push(-1.1);


  }

  rataosuusNumeroQueryArray.push(
    ` END, geoviite_konvertoitu_rataosuus_numero = CASE when id = `,
  );
  rataosuusNumeroQueryArray.push(` then `);
  rataosuusNumeroValsArray.push(-1);
  rataosuusNumeroValsArray.push('');

  rataosuusNimiQueryArray.push(
    ` END, geoviite_konvertoitu_rataosuus_nimi = CASE when id = `,
  );
  rataosuusNimiQueryArray.push(` then `);
  rataosuusNimiValsArray.push(-1);
  rataosuusNimiValsArray.push('');

  kmQueryArray.push(
    ` END, geoviite_konvertoitu_rata_kilometri = CASE when id = `,
  );
  kmQueryArray.push(` then `);
  kmValsArray.push(-1);
  kmValsArray.push(-1);

  mQueryArray.push(` END, geoviite_konvertoitu_rata_metrit= CASE when id = `);
  mQueryArray.push(` then `);
  mValsArray.push(-1);
  mValsArray.push(-1.1);

  raideNumeroQueryArray.push(
    ` END, geoviite_konvertoitu_raide_numero = CASE when id = `,
  );
  raideNumeroQueryArray.push(` then `);
  raideNumeroValsArray.push(-1);
  raideNumeroValsArray.push('');

  valimatkaQueryArray.push(` END, geoviite_valimatka= CASE when id = `);
  valimatkaQueryArray.push(` then `);
  valimatkaValsArray.push(-1);
  valimatkaValsArray.push(-1.1);

  sijRaideQueryArray.push(` END, geoviite_sijaintiraide= CASE when id = `);
  sijRaideQueryArray.push(` then `);
  sijRaideValsArray.push(-1);
  sijRaideValsArray.push('');

  sijRaideKuvQueryArray.push(
    ` END, geoviite_sijaintiraide_kuvaus = CASE when id = `,
  );
  sijRaideKuvQueryArray.push(` then `);
  sijRaideKuvValsArray.push(-1);
  sijRaideKuvValsArray.push('');

  sijRaideTyyppiQueryArray.push(
    ` END, geoviite_sijaintiraide_tyyppi = CASE when id = `,
  );
  sijRaideTyyppiQueryArray.push(` then `);
  sijRaideTyyppiValsArray.push(-1);
  sijRaideTyyppiValsArray.push('');

  sijRaideOidQueryArray.push(
    ` END, geoviite_sijaintiraide_oid = CASE when id = `,
  );
  sijRaideOidQueryArray.push(` then `);
  sijRaideOidValsArray.push(-1);
  sijRaideOidValsArray.push('');

  ratanumeroOidQueryArray.push(
    ` END, geoviite_ratanumero_oid = CASE when id = `,
  );
  ratanumeroOidQueryArray.push(` then `);
  ratanumeroOidValsArray.push(-1);
  ratanumeroOidValsArray.push('');

  virheQueryArray.push(` END, geoviite_virhe = CASE when id = `);
  virheQueryArray.push(` then `);
  virheValsArray.push(-1);
  virheValsArray.push('');

  timestampQueryArray.push(` END, geoviite_updated_at = CASE when id = `);
  timestampQueryArray.push(` then `);
  timestampValsArray.push(-1);
  timestampValsArray.push(timestamp);

  const idArray: number[] = [];

  batch.forEach((row: GeoviiteClientResultItem) => {

    idArray.push(row.id);

    //long
    longQueryArray.push(` when id = `);
    longQueryArray.push(` then `);
    longValsArray.push(row.id);
    longValsArray.push(row.x);

    //lat
    latQueryArray.push(` when id = `);
    latQueryArray.push(` then `);
    latValsArray.push(row.id);
    latValsArray.push(row.y);

    if(updateAlsoNonConvertedLatLong){
      //flippedOriginalLong

      flippedOriginalLongQueryArray.push(` when id = `);
      flippedOriginalLongQueryArray.push(` then `);
      flippedOriginalLongValsArray.push(row.id);
      flippedOriginalLongValsArray.push(row.inputLong);


      flippedOriginalLatQueryArray.push(` when id = `);
      flippedOriginalLatQueryArray.push(` then `);
      flippedOriginalLatValsArray.push(row.id);
      flippedOriginalLatValsArray.push(row.inputLat);

    }

    //rataosuus_numero
    rataosuusNumeroQueryArray.push(` when id = `);
    rataosuusNumeroQueryArray.push(` then `);
    rataosuusNumeroValsArray.push(row.id);
    rataosuusNumeroValsArray.push(row.ratanumero);

    //rataosuus_nimi
    rataosuusNimiQueryArray.push(` when id = `);
    rataosuusNimiQueryArray.push(` then `);
    rataosuusNimiValsArray.push(row.id);
    rataosuusNimiValsArray.push(null);

    //rata_kilometri
    kmQueryArray.push(` when id = `);
    kmQueryArray.push(` then `);
    kmValsArray.push(row.id);
    kmValsArray.push(row.ratakilometri);

    //rata_metrit
    mQueryArray.push(` when id = `);
    mQueryArray.push(` then `);
    mValsArray.push(row.id);
    let rata_metrit = '';
    if (row.ratametri || row.ratametri == 0) {
      rata_metrit = `${row.ratametri}.`;
      if (row.ratametri_desimaalit  || row.ratametri_desimaalit == 0) {
        rata_metrit = `${row.ratametri}.${row.ratametri_desimaalit}`;
      }
    } else if (row.ratametri_desimaalit) {
      rata_metrit = `0.${row.ratametri_desimaalit}`;
    }
    const mPart: number | null = rata_metrit ? Number(rata_metrit) : null;
    mValsArray.push(mPart);

    //raide_numero
    raideNumeroQueryArray.push(` when id = `);
    raideNumeroQueryArray.push(` then `);
    raideNumeroValsArray.push(row.id);
    raideNumeroValsArray.push(null);

    //valimatka
    valimatkaQueryArray.push(` when id = `);
    valimatkaQueryArray.push(` then `);
    valimatkaValsArray.push(row.id);
    valimatkaValsArray.push(row.valimatka);

    //sijaintiraide
    sijRaideQueryArray.push(` when id = `);
    sijRaideQueryArray.push(` then `);
    sijRaideValsArray.push(row.id);
    sijRaideValsArray.push(row.sijaintiraide);

    //sijaintiraide_kuvaus
    sijRaideKuvQueryArray.push(` when id = `);
    sijRaideKuvQueryArray.push(` then `);
    sijRaideKuvValsArray.push(row.id);
    sijRaideKuvValsArray.push(row.sijaintiraide_kuvaus);

    //sijaintiraide_tyyppi
    sijRaideTyyppiQueryArray.push(` when id = `);
    sijRaideTyyppiQueryArray.push(` then `);
    sijRaideTyyppiValsArray.push(row.id);
    sijRaideTyyppiValsArray.push(row.sijaintiraide_tyyppi);

    //sijaintiraide_oid
    sijRaideOidQueryArray.push(` when id = `);
    sijRaideOidQueryArray.push(` then `);
    sijRaideOidValsArray.push(row.id);
    sijRaideOidValsArray.push(row.sijaintiraide_oid);

    //ratanumero_oid
    ratanumeroOidQueryArray.push(` when id = `);
    ratanumeroOidQueryArray.push(` then `);
    ratanumeroOidValsArray.push(row.id);
    ratanumeroOidValsArray.push(row.ratanumero_oid);

    //virhe
    virheQueryArray.push(` when id = `);
    virheQueryArray.push(` then `);
    virheValsArray.push(row.id);
    const virhe: string | null = row.virheet
      ? row.virheet.toString().length > 200
        ? row.virheet?.toString().substring(0, 200)
        : row.virheet.toString()
      : null;
    virheValsArray.push(virhe);

    //updated_at
    timestampQueryArray.push(` when id = `);
    timestampQueryArray.push(` then `);
    timestampValsArray.push(row.id);
    timestampValsArray.push(timestamp);
  });

  queryArray.push(...longQueryArray);
  valsArray.push(...longValsArray);

  queryArray.push(...latQueryArray);
  valsArray.push(...latValsArray);

  if(updateAlsoNonConvertedLatLong){
    queryArray.push(...flippedOriginalLongQueryArray);
    valsArray.push(...flippedOriginalLongValsArray);

    queryArray.push(...flippedOriginalLatQueryArray);
    valsArray.push(...flippedOriginalLatValsArray);
  }

  queryArray.push(...rataosuusNumeroQueryArray);
  valsArray.push(...rataosuusNumeroValsArray);

  queryArray.push(...rataosuusNimiQueryArray);
  valsArray.push(...rataosuusNimiValsArray);

  queryArray.push(...kmQueryArray);
  valsArray.push(...kmValsArray);

  queryArray.push(...mQueryArray);
  valsArray.push(...mValsArray);

  queryArray.push(...raideNumeroQueryArray);
  valsArray.push(...raideNumeroValsArray);

  queryArray.push(...valimatkaQueryArray);
  valsArray.push(...valimatkaValsArray);

  queryArray.push(...sijRaideQueryArray);
  valsArray.push(...sijRaideValsArray);

  queryArray.push(...sijRaideKuvQueryArray);
  valsArray.push(...sijRaideKuvValsArray);

  queryArray.push(...sijRaideTyyppiQueryArray);
  valsArray.push(...sijRaideTyyppiValsArray);

  queryArray.push(...sijRaideOidQueryArray);
  valsArray.push(...sijRaideOidValsArray);

  queryArray.push(...ratanumeroOidQueryArray);
  valsArray.push(...ratanumeroOidValsArray);

  queryArray.push(...virheQueryArray);
  valsArray.push(...virheValsArray);

  queryArray.push(...timestampQueryArray);
  valsArray.push(...timestampValsArray);

  //WHERE part
  let firstRow = true;
  idArray.forEach(id => {
    if (firstRow) {
      queryArray.push(` END WHERE id = `);
    } else {
      queryArray.push(` OR id = `);
    }
    firstRow = false;
  });

  valsArray.push(...idArray);

  queryArray.push('');

  return Prisma.sql(queryArray, ...valsArray);
}



// First call to produceGeoviiteBatchUpdateSql should be done with decimal vals in decimal fields, cause postgres deduces datatypes from the first
// call to the prepared statement. Otherwise if the first val to decimal fields is int, later decimal vals cause error:  incorrect binary data format in bind parameter
export function produceGeoviiteBatchUpdateStatementInitSql(
  saveBatchSize: number,
  system: string | null,
  updateAlsoNonConvertedLatLong: boolean,
) {
  const batch: GeoviiteClientResultItem[] = [];
  for (let index = 0; index < saveBatchSize; index++) {
    const item: GeoviiteClientResultItem = {
      id: -1,
      ratametri: 123,
      ratametri_desimaalit: 231,
      valimatka: 124.124,
      x: 999.999,
      y: 999.999,
      inputLat: 999.999,
      inputLong: 999.999,
    };
    batch.push(item);
  }
  const sql = produceGeoviiteBatchUpdateSql(
    batch,
    new Date(2024, 12, 24),
    system,
    updateAlsoNonConvertedLatLong,
  );
  return sql;
}


export async function getMittausSubtable(system: string | null, prisma: any) {
  switch (system) {
    case 'AMS':
      return prisma.ams_mittaus;
      break;
    case 'OHL':
      return prisma.ohl_mittaus;
      break;
    case 'PI':
      return prisma.pi_mittaus;
      break;
    case 'RC':
      return prisma.rc_mittaus;
      break;
    case 'RP':
      return prisma.rp_mittaus;
      break;
    case 'TG':
      return prisma.tg_mittaus;
      break;
    case 'TSIGHT':
      return prisma.tsight_mittaus;
      break;
    default: {
      log.trace(
        `Tried getting unknonwn subtable ${system}. Returning parent table 'mittaus'`,
      );
      return prisma.mittaus;
    }
  }
}

export function getSubtableUpdateQueryBeginning(system: string | null) {
  switch (system) {
    case 'AMS':
      return `UPDATE ams_mittaus SET geoviite_konvertoitu_long = CASE when id = `;
      break;
    case 'OHL':
      return `UPDATE ohl_mittaus SET geoviite_konvertoitu_long = CASE when id = `;
      break;
    case 'PI':
      return `UPDATE pi_mittaus SET geoviite_konvertoitu_long = CASE when id = `;
      break;
    case 'RC':
      return `UPDATE rc_mittaus SET geoviite_konvertoitu_long = CASE when id = `;
      break;
    case 'RP':
      return `UPDATE rp_mittaus SET geoviite_konvertoitu_long = CASE when id = `;
      break;
    case 'TG':
      return `UPDATE tg_mittaus SET geoviite_konvertoitu_long = CASE when id = `;
      break;
    case 'TSIGHT':
      return `UPDATE tsight_mittaus SET geoviite_konvertoitu_long = CASE when id = `;
      break;
    default: {
      log.trace(
        `Tried getting unknonwn subtable ${system}. Returning parent table 'mittaus'`,
      );
      return `UPDATE mittaus SET geoviite_konvertoitu_long = CASE when id = `;
    }
  }
}
