import { IAms } from './amsCsvSchema';
import postgres from 'postgres';
import { getEnvOrFail } from '../../../../../utils';
import { getSecretsManagerSecret } from '../../../../utils/secretsManager';
import { AmsDBSchema } from './amsDBSchema';

let connection: postgres.Sql;
//todo set false
const localDevDB = true;

export async function writeRowsToDB3(
  header: string[],
  parsedCSVRows: AmsDBSchema[],
) {
  parsedCSVRows.forEach(row => writeRowToDB(row));

  const schema = 'public';
  const timestamp = new Date(Date.now()).toISOString();
  const sql = await getConnectionLocalDev();

  return await sql`
    INSERT INTO ${sql(schema)}.ams_mittaus
    (sscount, raportti_id, running_date)
    VALUES (19, 3, ${timestamp})`;
}

async function writeRowToDB(row: AmsDBSchema) {
  let schema;
  let sql;
  if (localDevDB) {
    schema = 'public';
    sql = await getConnectionLocalDev();
  } else {
    schema = getEnvOrFail('RAITA_PGSCHEMA');
    sql = await getConnection();
  }

  const timestamp = new Date(Date.now()).toISOString();

  try {
    let a = await sql`INSERT INTO ${sql(schema)}.ams_mittaus ${sql(row)} `;
    console.log(a);
    return a;
  } catch (e) {
    console.log('err');
    console.log(e);
    return null;
  }
}

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
  parsedCSVRows: AmsDBSchema[],
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
  connection = postgres({ password, transform: { undefined: null } }, );
  return connection;
}

export async function getConnectionLocalDev() {
  if (connection) {
    return connection;
  }
  const password = 'password';
  connection = postgres({ password, username: 'postgres', transform: { undefined: null } });
  return connection;
}
