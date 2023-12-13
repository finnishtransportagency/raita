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

export async function writeRowsToDB(
  parsedCSVRows: any[],
  table: string,
): Promise<postgres.Row> {
  const { schema, sql } = await getDBConnection();

  try {
    const [id] = await sql`INSERT INTO ${sql(schema)}.${sql(table)} ${sql(
      parsedCSVRows,
    )} returning id`;
    console.log(id);
    return id;
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
