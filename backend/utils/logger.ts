import pino from 'pino';

// Logger implemetation here is duplicated by a copy under backend/containers/zipHandler.
// Update both implementations if changes are needed.

const level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info';

const XRAY_ENV_NAME = '_X_AMZN_TRACE_ID';
const TRACE_ID_REGEX = /^Root=(.+);Parent=(.+);/;
export const getCorrelationId = () => {
  const tracingInfo = process.env[XRAY_ENV_NAME] || '';
  const matches = tracingInfo.match(TRACE_ID_REGEX) || ['', '', ''];
  const correlationId = matches[1];
  if (correlationId) {
    return correlationId;
  }
  return undefined;
};

function getLogger(tag: string) {
  return pino({
    level,
    // Remove unused default fields
    base: undefined,
    mixin: () => {
      return {
        correlationId: getCorrelationId(),
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
  });
}

export const log = getLogger('RAITA_BACKEND');
export const logParsingException = getLogger('RAITA_PARSING_EXCEPTION');
export const logPipeline = getLogger('RAITA_PIPELINE');
