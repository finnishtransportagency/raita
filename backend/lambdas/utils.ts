import { getGetEnvWithPreassignedContext } from '../../utils';

/**
 * Error class for Raita API lambdas
 */
export class RaitaLambdaError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class RaitaParseError extends Error {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Returns error message to be returned to client
 */
export const getClientErrorMessage = (err: unknown) =>
  (err instanceof RaitaLambdaError && err.message) ||
  'An error occurred processing the request.';

/**
 * Returns error response object for Raita API requests
 */
export const getRaitaLambdaError = (err: unknown) => ({
  statusCode: (err instanceof RaitaLambdaError && err.statusCode) || 500,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ message: getClientErrorMessage(err) }, null, 2),
});

/**
 * Return decoded uri string or if decode fails, the original uri string
 */
export const decodeUriString = (uriString: string) => {
  try {
    return decodeURIComponent(uriString);
  } catch (error) {
    return uriString;
  }
};

export const decodeS3EventPropertyString = (s: string) => s.replace(/\+/g, ' ');

export const getOpenSearchLambdaConfigOrFail = () => {
  const getEnv = getGetEnvWithPreassignedContext('Metadata parser lambda');
  return {
    openSearchDomain: getEnv('OPENSEARCH_DOMAIN'),
    region: getEnv('REGION'),
    metadataIndex: getEnv('METADATA_INDEX'),
  };
};
