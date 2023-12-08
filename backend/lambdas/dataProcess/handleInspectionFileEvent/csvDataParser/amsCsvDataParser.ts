import { ERROR_CODES, parseCSVContent } from '../../../../utils/zod-csv/zcsv';
import { amsSchema, IAms } from './amsCsvSchema';
import { tidyUpFileBody } from './utils';
import { getEnvOrFail } from '../../../../../utils';
import postgres from 'postgres';
import {
  baseObjectInputType,
  baseObjectOutputType,
  objectUtil,
  TypeOf,
  ZodEffects,
  ZodError,
  ZodNumber,
  ZodObject,
  ZodString,
  ZodTypeAny,
} from 'zod';

let connection: postgres.Sql;

function tidyHeadersAMSSpecific(headerLine: string): string {
  return headerLine
    .replace(/Running Dynamics\.Ajonopeus/, 'ams_ajonopeus')
    .replace(/Running Dynamics\./g, '');
}

export async function parseAMSCSVData(csvFileBody: string) {
  const tidyedFileBody = tidyUpFileBody(csvFileBody, tidyHeadersAMSSpecific);

  const parsedCSVContent = parseCSVContent(tidyedFileBody, amsSchema);

  if (parsedCSVContent.success) {
    console.log('write to db');
    await writeRowsToDB(parsedCSVContent.header, parsedCSVContent.validRows);
  }
  return parsedCSVContent;
}

async function getConnection() {
  if (connection) {
    return connection;
  }
  // const password = await getSecretsManagerSecret('database_password');
  const password = 'password';
  connection = postgres({ password, username: 'postgres' });
  return connection;
}

async function writeRowToDB(header: string[], row: IAms) {
  const schema = 'public';
  const timestamp = new Date(Date.now()).toISOString();
  const sql = await getConnection();
  const values = Object.values(row);


  //  const sqlString =    'INSERT INTO public.ams_mittaus (' + header + ')VALUES (' + values + ')';
  const sqlString = 'INSERT INTO public.ams_mittaus (id) VALUES (99)';
  console.log(sqlString);
  try {
    return await sql`INSERT INTO ${sql(schema)}.ams_mittaus ${sql(row)}`;
  } catch (e) {
    console.log('err');
    console.log(e);
    return null;
  }
  console.log('did');
}

async function writeRowsToDB(header: string[], parsedCSVRows: IAms[]) {
  parsedCSVRows.forEach(row => writeRowToDB(header, row));

  const schema = 'public';
  const timestamp = new Date(Date.now()).toISOString();
  const sql = await getConnection();

  return await sql`
    INSERT INTO ${sql(schema)}.ams_mittaus
    (id, sscount)
    VALUES (13,19)`;
}
