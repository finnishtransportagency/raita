import postgres from 'postgres';
import { getEnvOrFail } from '../../../../../utils';
import { getSecretsManagerSecret } from '../../../../utils/secretsManager';


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

export function convertToDBRow(row: any, runningDate: Date, reportId: number) {

  return { ...row, raportti_id: reportId, running_date: runningDate };
}
