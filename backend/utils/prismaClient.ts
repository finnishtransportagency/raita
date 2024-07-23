import { PrismaClient } from '@prisma/client';
import { getEnvOrFail } from '../../utils';
import { getSecretsManagerSecret } from './secretsManager';
import { log } from './logger';

export const getPrismaClient = async () => {
  const user = getEnvOrFail('PGUSER');
  const host = getEnvOrFail('PGHOST');
  const schema = getEnvOrFail('RAITA_PGSCHEMA');
  const port = getEnvOrFail('PGPORT');
  const database = getEnvOrFail('PGDATABASE');
  const password = await getSecretsManagerSecret('database_password');

  const client = new PrismaClient({
    datasources: {
      db: {
        url: `postgresql://${user}:${password}@${host}:${port}/${database}?schema=${schema}`,
      },
    },
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'stdout',
        level: 'error',
      },
      {
        emit: 'stdout',
        level: 'info',
      },
      {
        emit: 'stdout',
        level: 'warn',
      },
    ],
  });

  client.$on('query', e => {
    log.info({ query: e.query, params: e.params, duration: e.duration });
  });
  return client;
};
