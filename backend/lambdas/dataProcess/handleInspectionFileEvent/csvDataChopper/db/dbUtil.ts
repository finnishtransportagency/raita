import postgres from 'postgres';
import { getEnvOrFail } from '../../../../../../utils';
import { getSecretsManagerSecret } from '../../../../../utils/secretsManager';
import { Mittaus } from './model/Mittaus';
import { Rataosoite } from './model/Rataosoite';
import { log } from '../../../../../utils/logger';

let connection: postgres.Sql;

export async function getDBConnection() {
  let schema;
  let sql;
  log.info('STACK_ID' + process.env.STACK_ID);
  log.info('ENVIRONMENT' + process.env.ENVIRONMENT);
  //  if (isLocalDevStack()) {
  if (process.env.ENVIRONMENT == 'kalle') {
    schema = 'public';
    sql = await getConnectionLocalDev();
  } else {
    schema = getEnvOrFail('RAITA_PGSCHEMA');
    sql = await getConnection();
  }
  return { schema, sql };
}
//UPDATE yourtable SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326);

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
      // log.error('XError inserting measurement data: ' + table + ' ' + e);
      // log.error(e);
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
    return connection;
  }
  const password = await getSecretsManagerSecret('database_password');
  connection = postgres({ password, transform: { undefined: null } });
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

export function convertToDBRow(
  row: Mittaus,
  runningDate: Date,
  reportId: number,
  fileNamePrefix: string,
) {
  const rataosoite: Rataosoite = constructRataosoite(row.track, row.location);
  return {
    ...row,
    raportti_id: reportId,
    running_date: runningDate,
    jarjestelma: fileNamePrefix,
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
  log.info("raporttiChunksToProcess");
  let { schema, sql } = await getDBConnection();
  log.info("got conn: " + schema);
  try {
    const chunks = await sql`SELECT chunks_to_process FROM ${sql(
      schema,
    )}.raportti  WHERE id = ${id};`.catch((e)=>{log.error(e); throw e;});
    log.info("got chunks");

    return Number(chunks[0].chunks_to_process);
  } catch (e) {
    log.error('Error SELECT chunks_to_process ');
    log.error(e);
    throw e;
  }
}





