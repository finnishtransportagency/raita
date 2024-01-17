import postgres from 'postgres';
import { getSecretsManagerSecret } from './secretsManager';
import { getEnvOrFail } from '../../utils';

export async function getPostgresLogs(
  startTimestamp: string,
  endTimestamp: string,
) {
  const password = await getSecretsManagerSecret('database_password');
  const sql = await postgres({ password });
  const schema = getEnvOrFail('RAITA_PGSCHEMA');
  return await sql`
  SELECT * FROM ${sql(schema)}.logging
  WHERE log_timestamp BETWEEN ${startTimestamp} AND ${endTimestamp}`;
}
