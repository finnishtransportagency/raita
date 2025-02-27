export type KnownSuffix =
  (typeof fileSuffixesToIncludeInMetadataParsing)[keyof typeof fileSuffixesToIncludeInMetadataParsing];

export type ExcelSuffix =
  | (typeof fileSuffixesToIncludeInMetadataParsing)['XLSX_FILE']
  | (typeof fileSuffixesToIncludeInMetadataParsing)['XLS_FILE'];

export const fileSuffixesToIncludeInMetadataParsing = {
  TXT_FILE: 'txt',
  PDF_FILE: 'pdf',
  CSV_FILE: 'csv',
  XLSX_FILE: 'xlsx',
  XLS_FILE: 'xls',
} as const;

export const KNOWN_IGNORED_FILE_SUFFIXES = ['png'];

export const ZIP_SUFFIX = 'zip';
export const FILEPART_SUFFIX = 'filepart';
export const EMPTY_FILE_INDICATOR = 'EMPTY';

export const DATA_TIME_ZONE = 'Europe/Helsinki';

// Constant that is meant to be temporary to address Excel-parsing.
// See Jira 242.
// Identifier here is lowercased though it is expected that incoming
// data has the words capitalized. Comparisons must lowercase the data.
export const SUBMISSION_REPORT_INDICATOR = 'submission report';

export type RaitaSourceSystem =
  (typeof raitaSourceSystems)[keyof typeof raitaSourceSystems];

export const raitaSourceSystems = {
  Meeri_FIX: 'Meeri_FIX', // This is for accepting data that will not be handled by data process automatically
  Meeri: 'Meeri',
  Emma: 'Emma',
  Elli: 'Elli',
} as const;

export const EXTRACTION_SPEC_PATH =
  'backend/lambdas/dataProcess/parsingConfiguration';
export const RAITA_PARSING_EXCEPTION = '[RAITA PARSING EXCEPTION]';
export const RAITA_CSV_PARSING_EXCEPTION = '[RAITA CSV PARSING EXCEPTION]';
export const RAITA_CSV_DB_EXCEPTION = '[RAITA CSV DB EXCEPTION';
export const SSM_CLOUDFRONT_CERTIFICATE_ARN =
  'raita-cloudfront-certificate-arn';
export const SSM_CLOUDFRONT_DOMAIN_NAME = 'raita-cloudfront-domain-name';
export const SSM_DMZ_API_DOMAIN_NAME = 'raita-dmz-api-domain-name';
export const SFTP_POLICY_ACCOUNT_ID = 'raita-sftp-policy-account-id';
export const SOA_POLICY_ACCOUNT_ID = 'raita-soa-policy-account-id';
export const SFTP_POLICY_USER_ID = 'raita-sftp-policy-user-id';
export const SFTP_RAITA_DEVELOPER_POLICY_USER_ID =
  'raita-sftp-raita-developer-policy-user-id';
export const VAYLA_POLICY_USER_ID = 'raita-vayla-policy-user-id';
export const LORAM_POLICY_USER_ID = 'raita-loram-policy-user-id';
export const SSM_JWT_TOKEN_ISSUER = 'raita-jwt-token-issuer';
export const SSM_API_KEY = 'raita-api-key';
export const SSM_DEFAULT_EC2_AMI_ID = 'Vayla-AMI-2023-CISLEVEL1';

/**
 * Sender email address
 */
export const SSM_EMAIL_SENDER_ADDRESS = 'raita-email-sender-address';
export const SSM_SMTP_ENDPOINT = 'raita-smtp-endpoint';
export const SMTP_PORT = 587;
/**
 * Comma separated email addresses
 */
export const SSM_EMAIL_REPORTS_RECEIVERS = 'raita-email-reports-receivers';
/**
 * JSON with fields username and passwords
 */
export const SECRET_KEY_SMTP_CREDENTIALS = 'raita-smtp-credentials';

export const REQUEST_HEADER_API_KEY = 'x-api-key';
export const RAITA_APIKEY_USER_UID = 'raita-api-key-user';

export const ENVIRONMENTS = {
  dev: 'dev',
  prod: 'prod',
} as const;

export const PRODUCTION_BRANCH = 'prod';
export const PRODUCTION_STACK_ID = PRODUCTION_BRANCH;
export const DEVELOPMENT_MAIN_BRANCH = 'main';
export const DEVELOPMENT_MAIN_STACK_ID = DEVELOPMENT_MAIN_BRANCH;
export const DEVELOPMENT_PREMAIN_BRANCH = 'test/pre-main';
export const DEVELOPMENT_PREMAIN_STACK_ID = 'premain';
export const CSV_GENERATION_MAX_RAPORTTI_ROW_COUNT = 1000; // TODO: this is just a guess, determine a proper limit

export const GEOVIITE_HOSTNAME_DEV = 'https://avoinapi.testivaylapilvi.fi/';
export const GEOVIITE_HOSTNAME_PROD = 'https://avoinapi.vaylapilvi.fi/';
