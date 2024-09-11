import pino from 'pino';
import { pinoLambdaDestination } from 'pino-lambda';

// Logger implemetation here is duplicated by a copy under backend/containers/zipHandler.
// Update both implementations if changes are needed.

const level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info';

function getLogger(tag: string) {
  return pino(
    {
      level,
      // Remove unused default fields
      base: undefined,
      mixin: () => {
        return {
          tag,
        };
      },
      // Log level as text instead of number
      formatters: {
        level(label: string) {
          return { level: label };
        },
      },
      // Unix time to ISO time
      timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
    },
    pinoLambdaDestination(),
  );
}

export const log = getLogger('RAITA_BACKEND');
export const logLambdaInitializationError = getLogger(
  'RAITA_LAMBDA_INIT_ERROR',
);
export const logDatabaseOperation = getLogger('RAITA_DATABASE_OPERATION');
export const logParsingException = getLogger('RAITA_PARSING_EXCEPTION');
export const logCSVParsingException = getLogger('RAITA_CSV_PARSING_EXCEPTION');
export const logCSVDBException = getLogger('RAITA_CSV_DB_EXCEPTION');
export const logPipeline = getLogger('RAITA_PIPELINE');
