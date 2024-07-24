import postgres from 'postgres';
import { getEnvOrFail } from '../../../../../utils';
import { getSecretsManagerSecret } from '../../../../utils/secretsManager';
import { Mittaus } from './model/Mittaus';
import { Rataosoite } from './model/Rataosoite';
import { log } from '../../../../utils/logger';
import { FileMetadataEntry, ParseValueResult } from '../../../../types';
import { Raportti } from './model/Raportti';

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

export async function writeRowsToDB(
  parsedCSVRows: any[],
  table: string,
  dbConnection: DBConnection,
): Promise<number> {
  const { schema, sql } = dbConnection;

  try {
    const rows = await sql`INSERT INTO ${sql(schema)}.${sql(table)} ${sql(
      parsedCSVRows,
    )} returning latitude, longitude, id`.catch(e => {
      log.error(e);
      throw e;
    });
    //  await populateGisPoints(rows, schema, table, sql);
    //  log.info("populatedGisPoints ");

    return rows.length;
  } catch (e) {
    // log.error('Error inserting measurement data: ' + table + ' ' + e);
    // log.error(e);
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

export async function updateRaporttiStatus(
  id: number,
  status: string,
  error: null | string,
  dbConnection: DBConnection,
) {
  const { schema, sql } = dbConnection;
  let errorSubstring = error;
  if (error) {
    errorSubstring = error.substring(0, 1000);
  }
  try {
    const a = await sql`UPDATE ${sql(schema)}.raportti
                            SET status = ${status},
                                error  = ${errorSubstring}
                            WHERE id = ${id}
                            AND (status IS NULL
                            OR status <> 'ERROR');`.catch(e => {
      log.error('Error updateRaporttiStatus: ' + e);

      throw e;
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
  try {
    const a = await sql`UPDATE ${sql(schema)}.raportti
                            SET metadata_status = ${status}
                            WHERE id = ${id};`;
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
  const { schema, sql } = dbConnection;
  for (const metaDataEntry of data) {
    const parsingErrors = metaDataEntry.errors;
    const raporttiData = {
      size: metaDataEntry.size,
      hash: metaDataEntry.hash,
      ...metaDataEntry.metadata,
    };
    try {
      let id;
      if (metaDataEntry.reportId) {
        id = metaDataEntry.reportId;
      } else {
        throw new Error('ReportID undefined');
      }
      try {
        const rowList = await sql`UPDATE ${sql(schema)}.raportti
                                  set ${sql(raporttiData)}
                                  WHERE id = ${id};`.catch(e => {
          log.error('Error updating metadata to db: ' + e);
          throw e;
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

  try {
    const a = await sql`UPDATE ${sql(
      schema,
    )}.raportti SET chunks_to_process = ${chunks} WHERE id = ${id};`;
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

  try {
    const a = await sql`UPDATE ${sql(
      schema,
    )}.raportti SET chunks_to_process = chunks_to_process - 1  WHERE id = ${id};`;
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
  try {
    const chunks = await sql`SELECT chunks_to_process FROM ${sql(
      schema,
    )}.raportti  WHERE id = ${id};`.catch(e => {
      log.error(e);
      throw e;
    });

    return Number(chunks[0].chunks_to_process);
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

  const { schema, sql } = dbConnection;
  try {
    const [id] = await sql`INSERT INTO ${sql(schema)}.raportti ${sql(
      data,
    )} returning id`;
    log.debug(id);

    return id.id;
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

  const values = columnNames.map(name => ({
    raportti_id: reportId,
    column_name: name,
  }));

  await sql`INSERT INTO ${sql(schema)}.puuttuva_kolumni ${sql(
    values,
  )} ON CONFLICT DO NOTHING`; // conflict comes from unique constraint when this is ran for each file chunk
}
