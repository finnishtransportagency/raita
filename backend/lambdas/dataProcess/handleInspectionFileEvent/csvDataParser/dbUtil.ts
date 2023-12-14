import postgres from 'postgres';
import { getEnvOrFail } from '../../../../../utils';
import { getSecretsManagerSecret } from '../../../../utils/secretsManager';
import { Mittaus } from './Mittaus';
import { Rataosoite } from './rataosoite';

let connection: postgres.Sql;
//todo set false
const localDevDB = true;

export async function getDBConnection() {
  let schema;
  let sql;
  if (localDevDB) {
    schema = 'public';
    sql = await getConnectionLocalDev();
  } else {
    schema = getEnvOrFail('RAITA_PGSCHEMA');
    sql = await getConnection();
  }
  return { schema, sql };
}

async function populateGisPoints(
  rows: postgres.Row[] &
    Iterable<NonNullable<postgres.Row[][number]>> &
    postgres.ResultQueryMeta<
      postgres.Row[]['length'],
      keyof postgres.Row[][number]
    >,
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
    console.log(latitude);

    sqlString += 'update ';
    sqlString += table;
    sqlString += " set sijainti=st_geomfromtext('POINT(";
    sqlString += longitude;
    sqlString += ' ';
    sqlString += latitude;
    sqlString += ')';
    sqlString += "', 4326) where id=";
    sqlString += id;
    sqlString += ';';
  });
  console.log(sqlString);
  const a = await sql.unsafe(sqlString);
  console.log(a);
}

export async function writeRowsToDB(
  parsedCSVRows: any[],
  table: string,
): Promise<postgres.Row> {
  const { schema, sql } = await getDBConnection();

  try {
    const rows = await sql`INSERT INTO ${sql(schema)}.${sql(table)} ${sql(
      parsedCSVRows,
    )} returning latitude, longitude, id`;
    await populateGisPoints(rows, table, sql);

    return rows;

  } catch (e) {
    console.log('err');
    console.log(e);
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
    raideNumero =  splittedTrack[2];
  }

  const splittedLocation = location.split('+');
  let rataKilometri = null;
  let rataMetrit = null;
  try{
    rataKilometri =  Number(splittedLocation[0]);
    rataMetrit = Number(splittedLocation[1]);
  }
  catch (e) {
    throw Error("Illegal location: " + location);
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
) {
  const rataosoite: Rataosoite = constructRataosoite(row.track, row.location);
  return { ...row, raportti_id: reportId, running_date: runningDate , ...rataosoite};
}

