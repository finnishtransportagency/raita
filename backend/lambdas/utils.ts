import { S3EventRecord } from 'aws-lambda';
import {
  ExcelSuffix,
  fileSuffixesToIncludeInMetadataParsing,
  KNOWN_IGNORED_FILE_SUFFIXES,
  KnownSuffix,
  SUBMISSION_REPORT_INDICATOR,
} from '../../constants';
import {
  getGetEnvWithPreassignedContext,
  isRaitaSourceSystem,
} from '../../utils';
import { FileMetadataEntry } from '../types';
import { compareVersionStrings } from '../utils/compareVersionStrings';
import { raportti } from '@prisma/client';

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
  errorType: string = 'GENERIC_PARSING_ERROR';
  fileName: string;
  constructor(message: string, errorType?: string, fileName?: string) {
    super(message);
    if (errorType) {
      this.errorType = errorType;
    }
    if (fileName) {
      this.fileName = fileName;
    }
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

/**
 * Extract and decode key from S3 event record
 */
export const getDecodedS3ObjectKey = (eventRecord: S3EventRecord) =>
  decodeUriString(eventRecord.s3.object.key).replace(/\+/g, ' ');

export type KeyData = ReturnType<typeof getKeyData>;

/**
 * Takes in an decoded key and returns extracted informatin from it
 */
export const getKeyData = (key: string) => {
  const path = key.split('/');
  const rootFolder = path[0];
  const fileName = path[path.length - 1];
  const lastDotInFileName = fileName.lastIndexOf('.');
  const fileBaseName =
    lastDotInFileName >= 0 ? fileName.slice(0, lastDotInFileName) : fileName;
  const fileSuffix =
    lastDotInFileName >= 0 && fileName.length - 1 > lastDotInFileName
      ? fileName.slice(lastDotInFileName + 1)
      : '';
  const keyWithoutSuffix = fileSuffix
    ? key.slice(0, -(fileSuffix.length + 1))
    : key;
  return {
    path,
    rootFolder,
    fileName,
    fileBaseName,
    fileSuffix,
    keyWithoutSuffix,
  };
};

// Helper that is meant to be temporary to address Excel parsing. See Jira 242.
export const isSubmissionReport = ({
  fileBaseName,
  fileSuffix,
}: {
  fileBaseName: string;
  fileSuffix: string;
}) =>
  isExcelSuffix(fileSuffix) &&
  fileBaseName.toLowerCase().includes(SUBMISSION_REPORT_INDICATOR);

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

// Type guards

export function isZipPath(arg: Array<string>): arg is ZipPath {
  const [system] = arg;
  return arg.length === 5 && !!system && isRaitaSourceSystem(system);
}

/**
 * Check if arg file path references either 'system', 'year', 'campaign' or 'date' in the predefined file structure
 */
export function isZipParentPath(arg: Array<string>): boolean {
  const [system] = arg;
  return (
    arg.length > 0 && arg.length < 5 && !!system && isRaitaSourceSystem(system)
  );
}

/**
 * Check if arg is a valid zip path referencing a 'campaign' or 'date'
 * Will reject if path is too broad, referencing 'system' or 'year'
 */
export function isCampaignOrMoreSpecificPath(arg: Array<string>): boolean {
  const [system] = arg;
  return (
    arg.length > 2 && arg.length < 5 && !!system && isRaitaSourceSystem(system)
  );
}

export function isKnownSuffix(arg: string): arg is KnownSuffix {
  return Object.values(fileSuffixesToIncludeInMetadataParsing).some(
    suffix => suffix === arg,
  );
}
export function isKnownIgnoredSuffix(arg: string): boolean {
  return KNOWN_IGNORED_FILE_SUFFIXES.includes(arg);
}

export function isExcelSuffix(arg: string): arg is ExcelSuffix {
  return (
    fileSuffixesToIncludeInMetadataParsing.XLSX_FILE === arg ||
    fileSuffixesToIncludeInMetadataParsing.XLS_FILE === arg
  );
}

export function isCsvSuffix(arg: string): arg is ExcelSuffix {
  return fileSuffixesToIncludeInMetadataParsing.CSV_FILE === arg;
}

export function getOriginalZipNameFromPath(path: string[]): string {
  if (path.length < 5) {
    return '';
  }
  return `${path.slice(0, 5).join('/')}.zip`;
}

export async function checkExistingHash(
  entry: FileMetadataEntry,
  foundReport: raportti,
): Promise<boolean> {
  const skipHashCheck = entry.options.skip_hash_check;
  const requireNewerParserVersion = entry.options.require_newer_parser_version;

  if (skipHashCheck && foundReport.hash === entry.hash) return true;

  if (foundReport.hash !== entry.hash) return true;

  if (requireNewerParserVersion) {
    const newVersion = entry.metadata.parser_version;
    const existingVersion = foundReport.parser_version;
    return (
      compareVersionStrings(
        newVersion as any as string,
        existingVersion as any as string,
      ) >= 0
    );
  } else return false;
}
