import { PrismaClient } from '@prisma/client';
import { getEnvOrFail } from '../../utils';
import { getSecretsManagerSecret } from './secretsManager';
import { logDatabaseOperation } from './logger';

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

  // log query parameters and stats for all prisma queries
  client.$on('query', e => {
    logDatabaseOperation.info({
      query: e.query.replace('error', 'REPLACED'), // Don't trigger error log patterns by replacing 'error' in build query. There should be no actual error messages in the query string
      params: e.params,
      duration: e.duration,
    });
  });
  return client;
};
