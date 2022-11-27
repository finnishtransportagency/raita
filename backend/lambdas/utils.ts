import {
  getGetEnvWithPreassignedContext,
  isRaitaSourceSystem,
} from '../../utils';

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
export const getRaitaLambdaErrorResponse = (err: unknown) => ({
  statusCode: (err instanceof RaitaLambdaError && err.statusCode) || 500,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ message: getClientErrorMessage(err) }, null, 2),
});

/**
 * Returns success response object for Raita API requests
 */
export const getRaitaSuccessResponse = (body: Record<string, any>) => ({
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
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

export const getOpenSearchLambdaConfigOrFail = () => {
  const getEnv = getGetEnvWithPreassignedContext('Metadata parser lambda');
  return {
    openSearchDomain: getEnv('OPENSEARCH_DOMAIN'),
    region: getEnv('REGION'),
    metadataIndex: getEnv('METADATA_INDEX'),
  };
};

export const decodeS3EventPropertyString = (s: string) => s.replace(/\+/g, ' ');

export const getKeyConstituents = (key: string) => {
  const path = key.split('/');
  const fileName = path[path.length - 1];
  const [fileBaseName, fileSuffix] = fileName.split('.');
  return { path, fileName, fileBaseName, fileSuffix };
};

// Expected structure for zip file path parts is designated in the PathType type
// If the path parts are not following, processing the file will lead into data inconsistencies
// Only tuple length and source system are validated
export type ZipPath = [
  system: 'Meeri' | 'Emma' | 'Elli',
  year: string,
  campaign: string,
  date: string,
  fileName: string,
];

export function isZipPath(arg: Array<string>): arg is ZipPath {
  const [system] = arg;
  return arg.length === 5 && !!system && isRaitaSourceSystem(system);
}
