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
import { ro } from 'date-fns/locale';

let connection: postgres.Sql;
let connCount = 0;
let connReuseCount = 0;

export async function getDBConnection(): Promise<{
  schema: string;
  sql: postgres.Sql<{}>;
}> {
  const schema = getEnvOrFail('RAITA_PGSCHEMA');
  const sql = await getConnection();
  return { schema, sql };
}

export type DBConnection = { schema: string; sql: postgres.Sql<{}> };

function processCSVRows(rows: any[]) {
  const stringValues = [
    'jarjestelma',
    'running_date',
    'sijainti',
    'rataosuus_nimi',
    'modified',
    'created',
  ];

  return rows.map(row => {
    for (const key in row) {
      delete row.sijainti;
      const value = row[key];
      if (Number.isNaN(value) && !stringValues.includes(key)) {
        row[key] = null;
      }
    }
    row.raportti_id = parseInt(row.raportti_id);
    row.id = parseInt(row.id);
    return row;
  });
}

export async function writeRowsToDB(
  parsedCSVRows: any[],
  table: string,
  dbConnection: DBConnection,
): Promise<number> {
  const { schema, sql } = dbConnection;

  try {
    let count;
    switch (table) {
      case TableEnum.AMS:
        count = await addAMSMittausRecord(processCSVRows(parsedCSVRows));
        break;
      case TableEnum.OHL:
        count = await addOHLMittausRecord(processCSVRows(parsedCSVRows));
        break;
      case TableEnum.PI:
        count = await addPIMittausRecord(processCSVRows(parsedCSVRows));
        break;
      case TableEnum.RC:
        count = await addRCMittausRecord(processCSVRows(parsedCSVRows));
        break;
      case TableEnum.RP:
        count = await addRPMittausRecord(processCSVRows(parsedCSVRows));
        break;
      case TableEnum.TG:
        count = await addTGMittausRecord(processCSVRows(parsedCSVRows));
        break;
      case TableEnum.TSIGHT:
        count = await addTsightMittausRecord(processCSVRows(parsedCSVRows));
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
  const { schema, sql } = dbConnection;
  try {
    const result = await sql`DELETE FROM ${sql(
      schema,
    )}.mittaus WHERE raportti_id = ${reportId}`;
    log.info({ result: result[0] }, 'Deleted mittaus rows');
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
  const { schema, sql } = dbConnection;
  const prisma = await getPrismaClient();
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
  const { schema, sql } = dbConnection;
  const prisma = await getPrismaClient();
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
  const prisma = await getPrismaClient();
  for (const metaDataEntry of data) {
    const parsingErrors = metaDataEntry.errors;
    const raporttiData = {
      size: metaDataEntry.size,
      hash: metaDataEntry.hash,
      ...metaDataEntry.metadata,
      track_number: metaDataEntry.metadata.track_number?.toString(),
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
  const { schema, sql } = dbConnection;
  const prisma = await getPrismaClient();

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
  const { schema, sql } = dbConnection;
  const prisma = await getPrismaClient();

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
  const { schema, sql } = dbConnection;
  const prisma = await getPrismaClient();
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
): Promise<number> {
  const data: Raportti = {
    key,
    status,
    file_name: fileName,
    chunks_to_process: -1,
    events: null,
  };

  const prisma = await getPrismaClient();
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

    console.debug(raportti.id);
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
  const { schema, sql } = dbConnection;
  const prisma = await getPrismaClient();
  const values = columnNames.map(name => ({
    raportti_id: reportId,
    column_name: name,
  }));

  const a = await prisma.puuttuva_kolumni.createMany({
    data: values,
    skipDuplicates: true,
  }); // conflict comes from unique constraint when this is ran for each file chunk
}

async function addAMSMittausRecord(parsedCSVRows: any[]): Promise<number> {
  const prisma = await getPrismaClient();
  const convertedData = convertDataToAMSMittausArray(parsedCSVRows);

  let count = 0;
  const recordCounts = await Promise.all(
    convertedData.map(row => {
      log.info(`THIS IS DATA: ${JSON.stringify(row)}`);
      try {
        const recordCount = prisma.ams_mittaus.create({
          data: row,
        });
        count += 1;
        return recordCount;
      } catch (error) {
        log.error(`Error adding AMS Mittaus records: ${error}`);
        throw error;
      }
    }),
  );
  return count;
}

async function addOHLMittausRecord(parsedCSVRows: any[]): Promise<number> {
  const prisma = await getPrismaClient();
  const convertedData = convertDataToOhlMittausArray(parsedCSVRows);
  let count = 0;
  const recordCounts = await Promise.all(
    convertedData.map(row => {
      try {
        const recordCount = prisma.ohl_mittaus.create({
          data: row,
        });
        count += 1;
        return recordCount;
      } catch (error) {
        log.error(`Error adding OHL Mittaus records: ${error}`);
        throw error;
      }
    }),
  );
  return count;
}

async function addPIMittausRecord(parsedCSVRows: any[]): Promise<number> {
  const prisma = await getPrismaClient();
  const convertedData = convertDataToPiMittausArray(parsedCSVRows);
  let count = 0;
  const recordCounts = await Promise.all(
    convertedData.map(row => {
      try {
        const recordCount = prisma.pi_mittaus.create({
          data: row,
        });
        count += 1;
        return recordCount;
      } catch (error) {
        log.error(`Error adding PI Mittaus records: ${error}`);
        throw error;
      }
    }),
  );
  return count;
}

async function addRCMittausRecord(parsedCSVRows: any[]): Promise<number> {
  const convertedData = convertDataToRcMittausArray(parsedCSVRows);
  const prisma = await getPrismaClient();
  let count = 0;
  const recordCounts = await Promise.all(
    convertedData.map(row => {
      try {
        const recordCount = prisma.rc_mittaus.create({
          data: row,
        });
        count += 1;
        return recordCount;
      } catch (error) {
        log.error(`Error adding RC Mittaus records: ${error}`);
        throw error;
      }
    }),
  );
  return count;
}

async function addRPMittausRecord(parsedCSVRows: any[]): Promise<number> {
  const convertedData = convertDataToRpMittausArray(parsedCSVRows);
  const prisma = await getPrismaClient();
  let count = 0;
  const recordCounts = await Promise.all(
    convertedData.map(row => {
      try {
        const recordCount = prisma.rp_mittaus.create({
          data: row,
        });
        count += 1;
        return recordCount;
      } catch (error) {
        log.error(`Error adding RP Mittaus records: ${error}`);
        throw error;
      }
    }),
  );
  return count;
}

async function addTGMittausRecord(parsedCSVRows: any[]): Promise<number> {
  const convertedData = convertDataToTgMittausArray(parsedCSVRows);
  const prisma = await getPrismaClient();
  log.info(`DATA TO TG_MITTAUS`);
  let count = 0;
  const recordCounts = await Promise.all(
    convertedData.map(row => {
      try {
        const recordCount = prisma.tg_mittaus.create({
          data: row,
        });
        count += 1;
        return recordCount;
      } catch (error) {
        log.error(`Error adding TG Mittaus records: ${error}`);
        throw error;
      }
    }),
  );
  return count;
}

async function addTsightMittausRecord(parsedCSVRows: any[]): Promise<number> {
  const convertedData = convertDataToTsightMittausArray(parsedCSVRows);
  const prisma = await getPrismaClient();
  let count = 0;
  const recordCounts = await Promise.all(
    convertedData.map(row => {
      try {
        const recordCount = prisma.tsight_mittaus.create({
          data: row,
        });
        count += 1;
        return recordCount;
      } catch (error) {
        log.error(`Error adding TSIGHT Mittaus records: ${error}`);
        throw error;
      }
    }),
  );
  return count;
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
