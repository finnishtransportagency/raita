import { PrismaClient } from '@prisma/client';
import { getEnvOrFail } from '../../utils';
import { getSecretsManagerSecret } from './secretsManager';

export const getPrismaClient = async () => {
  const user = getEnvOrFail('PGUSER');
  const host = getEnvOrFail('PGHOST');
  const schema = getEnvOrFail('RAITA_PGSCHEMA');
  const port = getEnvOrFail('PGPORT');
  const database = getEnvOrFail('PGDATABASE');
  const password = await getSecretsManagerSecret('database_password');

  return new PrismaClient({
    datasources: {
      db: {
        url: `postgresql://${user}:${password}@${host}:${port}/${database}?schema=${schema}`,
      },
    },
  });
};
