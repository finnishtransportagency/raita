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

export async function getDBConnection() {
  let schema;
  let sql;
  //  if (isLocalDevStack()) { (ei toiminut)
  if (process.env.ENVIRONMENT == 'kalle') {
    schema = 'public';
    sql = await getConnectionLocalDev();
  } else {
    schema = getEnvOrFail('RAITA_PGSCHEMA');
    sql = await getConnection();
  }
  return { schema, sql };
}

async function populateGisPointsForTable(
  schema: string,
  table: string,
  sql: postgres.Sql<{}>,
) {
  var sqlString: string = '';
  sqlString += 'update ';
  sqlString += schema + '.' + table;
  sqlString +=
    ' set sijainti=ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)';
  sqlString += ' where sijainti IS NULL';

  await sql.unsafe(sqlString);
}

async function populateGisPoints(
  rows: postgres.Row[] &
    Iterable<NonNullable<postgres.Row[][number]>> &
    postgres.ResultQueryMeta<
      postgres.Row[]['length'],
      keyof postgres.Row[][number]
    >,
  schema: string,
  table: string,
  sql: postgres.Sql<{}>,
) {
  var sqlString: string = '';

  rows.forEach(row => {
    const latitudeString: string = row.latitude;
    const longitudeString: string = row.longitude;
    const latitude = latitudeString.split('°')[0];
    const longitude = longitudeString.split('°')[0];
    const id: string = row.id;

    //TODO is there nicer way to do this in the row insert?
    sqlString += 'update ';
    sqlString += schema + '.' + table;
    sqlString += " set sijainti=st_geomfromtext('POINT(";
    sqlString += longitude;
    sqlString += ' ';
    sqlString += latitude;
    sqlString += ')';
    sqlString += "', 4326) where id=";
    sqlString += id;
    sqlString += ';';
  });
  await sql.unsafe(sqlString);

}

export async function writeRowsToDB(
  parsedCSVRows: any[],
  table: string,
): Promise<number> {
  const { schema, sql } = await getDBConnection();

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
    log.info("connReuseCount: "+connReuseCount);
    return connection;
  }
  const password = await getSecretsManagerSecret('database_password');
  connection = postgres({
    password,
    transform: { undefined: null },
    idle_timeout: 20,
    max_lifetime: 60*3,
  });
  connCount++;
  log.info("connCount: "+connCount);
  return connection;
}

export async function getConnectionLocalDev() {
  if (connection) {
    return connection;
  }
  const password = 'password';
  connection = postgres({
    password,
    username: 'postgres',
    transform: { undefined: null },
    idle_timeout: 20,
    max_lifetime: 30,
  });
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

export function convertToDBRow(
  row: Mittaus,
  runningDate: Date,
  reportId: number,
  fileNamePrefix: string,
) {
  const rataosoite: Rataosoite = constructRataosoite(row.track, row.location);
  const lat = convertCoord(row.latitude);
  const long = convertCoord(row.longitude);

  return {
    ...row,
    raportti_id: reportId,
    running_date: runningDate,
    jarjestelma: fileNamePrefix,
    lat,
    long,
    ...rataosoite,
  };
}

export async function updateRaporttiStatus(
  id: number,
  status: string,
  error: null | string,
) {
  let { schema, sql } = await getDBConnection();
  let errorSubstring = error;
  if (error) {
    errorSubstring = error.substring(0, 1000);
  }
  log.info('error mesg to db: ' + errorSubstring);
  try {
    const a = await sql`UPDATE ${sql(schema)}.raportti
                            SET status = ${status},
                                error  = ${errorSubstring}
                            WHERE id = ${id};`.catch(e => {
      log.error('Error updateRaporttiStatus: ' + e);

      throw e;
    });

    log.info('inserted:' + a);
  } catch (e) {
    log.error('Error updating raportti status');
    log.error(e);

    throw e;
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

export async function updateRaporttiMetadata(data: Array<FileMetadataEntry>) {
  let { schema, sql } = await getDBConnection();
  for (const metaDataEntry of data) {
    const raporttiData = {
      size: metaDataEntry.size,
      ...metaDataEntry.metadata,
    };
    console.log(raporttiData);
    try {
      let id;
      if (metaDataEntry.reportId) {
        id = metaDataEntry.reportId;
      } else {
        throw new Error('ReportID unefined');
      }

      let tiedostotyyppi = metaDataEntry.metadata['tiedostotyyppi'];
      let zip_vastaanotto_vuosi = metaDataEntry.metadata['zip_reception__year'];

      const a = await sql`UPDATE ${sql(schema)}.raportti set
                            ${sql(raporttiData)}
                            WHERE id = ${id};`.catch(e => {
        log.error('Error updateRaporttiStatus: ' + e);

        throw e;
      });

      log.info('inserted:' + a);
    } catch (e) {
      log.error('Error updating raportti status');
      log.error(e);

      throw e;
    }
  }
}

export async function updateRaporttiChunks(id: number, chunks: number) {
  let { schema, sql } = await getDBConnection();

  try {
    const a = await sql`UPDATE ${sql(
      schema,
    )}.raportti SET chunks_to_process = ${chunks} WHERE id = ${id};`;

    log.info(a);
  } catch (e) {
    log.error('Error updating raportti status');
    log.error(e);

    throw e;
  }
}

export async function substractRaporttiChunk(id: number) {
  let { schema, sql } = await getDBConnection();

  try {
    const a = await sql`UPDATE ${sql(
      schema,
    )}.raportti SET chunks_to_process = chunks_to_process - 1  WHERE id = ${id};`;

    log.info(a);
  } catch (e) {
    log.error('Error updating raportti status');
    log.error(e);

    throw e;
  }
}

export async function raporttiChunksToProcess(id: number) {
  let { schema, sql } = await getDBConnection();
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
  fileBaseName: string,
  fileNamePrefix: string,
  metadata: ParseValueResult | null,
  status: string | null,
): Promise<number> {
  const data: Raportti = {
    key,
    status,
    file_name: fileBaseName,
    system: fileNamePrefix,
    chunks_to_process: -1,
    events: null,
  };

  let { schema, sql } = await getDBConnection();

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
