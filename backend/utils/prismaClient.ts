import { PrismaClient } from '@prisma/client';
import { getEnvOrFail } from '../../utils';
import { getSecretsManagerSecret } from './secretsManager';
import { logDatabaseOperation } from './logger';

// disable query logging. TODO: some kind of flag to enable it, if needed
const enableQueryLogging = false;

export const getPrismaClient = async () => {
  const user = "postgres";
  const host = "localhost";
  const schema = "raita";
  const port = "5432";
  const database = "postgres";
  const password ="password";

  const client = new PrismaClient({
    datasources: {
      db: {
        url: `postgresql://${user}:${password}@${host}:${port}/${database}?schema=${schema}&connection_limit=3`,
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
        level: 'warn',
      },
    ],
  });

  if (enableQueryLogging) {
    // log query parameters and stats for all prisma queries
    client.$on('query', e => {
      logDatabaseOperation.info({
        query: e.query.replace('error', 'REPLACED'), // Don't trigger error log patterns by replacing 'error' in build query. There should be no actual error messages in the query string
        params: e.params,
        duration: e.duration,
      });
    });
  }
  return client;
};
