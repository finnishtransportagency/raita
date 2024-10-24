import postgres from 'postgres';
import { getEnvOrFail } from '../../../../../utils';
import { getSecretsManagerSecret } from '../../../../utils/secretsManager';
import { Mittaus } from './model/Mittaus';
import { Rataosoite } from './model/Rataosoite';
import { log } from '../../../../utils/logger';
import { FileMetadataEntry, ParseValueResult } from '../../../../types';
import { Raportti } from './model/Raportti';
import { getPrismaClient } from '../../../../utils/prismaClient';
import {
  convertDataToAMSMittausArray,
  convertDataToOhlMittausArray,
  convertDataToPiMittausArray,
  convertDataToRcMittausArray,
  convertDataToRpMittausArray,
  convertDataToTgMittausArray,
  convertDataToTsightMittausArray,
} from './converters/dataConverters';
import { jarjestelma, PrismaClient } from '@prisma/client';

let connection: postgres.Sql;
let connCount = 0;
let connReuseCount = 0;

export async function getPostgresDBConnection(): Promise<PostgresDBConnection> {
  const schema = getEnvOrFail('RAITA_PGSCHEMA');
  const sql = await getConnection();
  return { schema, sql };
}

export async function getDBConnection(): Promise<DBConnection> {
  const schema = getEnvOrFail('RAITA_PGSCHEMA');
  const sql = await getConnection();
  const prisma = await getPrismaClient();

  return { schema, sql, prisma };
}

export type DBConnection = {
  schema: string;
  sql: postgres.Sql<{}>;
  prisma: PrismaClient;
};
export type PostgresDBConnection = {
  schema: string;
  sql: postgres.Sql<{}>;
};

export async function writeRowsToDB(
  parsedCSVRows: any[],
  table: string,
  dbConnection: DBConnection,
): Promise<number> {
  const { schema, sql, prisma } = dbConnection;
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

async function getConnection() {
  if (connection) {
    connReuseCount++;
    return connection;
  }
  const password = await getSecretsManagerSecret('database_password');
  connection = postgres({
    password,
    transform: { undefined: null },
    max: 1,
  });
  connCount++;
  return connection;
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
  row: Mittaus,
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
  return {
    ...convertedRow,
    ...handleNan(convertedRow, missingOptionalColumns),
  };
}

/**
 * Delete all mittaus rows  from raportti
 */
export async function emptyRaporttiMittausRows(
  reportId: number,
  dbConnection: DBConnection,
) {
  const { schema, sql, prisma } = dbConnection;
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
  const { schema, sql, prisma } = dbConnection;
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
  const { schema, sql, prisma } = dbConnection;
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
  const { schema, sql, prisma } = dbConnection;
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
  const { schema, sql, prisma } = dbConnection;

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
  const { schema, sql, prisma } = dbConnection;

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

export async function raporttiChunksToProcess(
  id: number,
  dbConnection: DBConnection,
) {
  const { schema, sql, prisma } = dbConnection;

  try {
    const chunks = await prisma.raportti.findUnique({
      where: { id: id },
      select: {
        chunks_to_process: true,
      },
    });
    return Number(chunks);
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

  const { schema, sql, prisma } = dbConnection;
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
  const { schema, sql, prisma } = dbConnection;

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
    const convertedData = convertDataToAMSMittausArray(parsedCSVRows);
    const recordCount = await prisma.ams_mittaus.createMany({
      data: convertedData,
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
