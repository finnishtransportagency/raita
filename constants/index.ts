export type KnownSuffix =
  typeof fileSuffixesToIncudeInMetadataParsing[keyof typeof fileSuffixesToIncudeInMetadataParsing];

export type ExcelSuffix =
  | typeof fileSuffixesToIncudeInMetadataParsing['XLSX_FILE']
  | typeof fileSuffixesToIncudeInMetadataParsing['XLS_FILE'];

export const fileSuffixesToIncudeInMetadataParsing = {
  TXT_FILE: 'txt',
  PDF_FILE: 'pdf',
  CSV_FILE: 'csv',
  XLSX_FILE: 'xlsx',
  XLS_FILE: 'xls',
} as const;

export const ZIP_SUFFIX = 'zip';
export const EMPTY_FILE_INDICATOR = 'EMPTY';

// Constant that is meant to be temporary to address Excel-parsing.
// See Jira 242.
// Identifier here is lowercased though it is expected that incoming
// data has the words capitalized. Comparisons must lowercase the data.
export const SUBMISSION_REPORT_INDICATOR = 'submission report';

export type RaitaSourceSystem =
  typeof raitaSourceSystems[keyof typeof raitaSourceSystems];

export const raitaSourceSystems = {
  Meeri: 'Meeri',
  Emma: 'Emma',
  Elli: 'Elli',
} as const;

export const RAITA_PARSING_EXCEPTION = '[RAITA PARSING EXCEPTION]';
export const SSM_CLOUDFRONT_CERTIFICATE_ARN =
  'raita-cloudfront-certificate-arn';
export const SSM_CLOUDFRONT_DOMAIN_NAME = 'raita-cloudfront-domain-name';
export const SSM_DMZ_API_DOMAIN_NAME = 'raita-dmz-api-domain-name';
export const SFTP_POLICY_ACCOUNT_ID = 'raita-sftp-policy-account-id';
export const SFTP_POLICY_USER_ID = 'raita-sftp-policy-user-id';
export const SSM_JWT_TOKEN_ISSUER = 'raita-jwt-token-issuer';
export const SSM_API_KEY = 'raita-api-key';

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
