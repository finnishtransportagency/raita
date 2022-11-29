export const fileSuffixesToIncudeInMetadataParsing = {
  TXT_FILE: 'txt',
  PDF_FILE: 'pdf',
  CSV_FILE: 'csv',
} as const;

export type RaitaSourceSystem =
  typeof raitaSourceSystems[keyof typeof raitaSourceSystems];

export const raitaSourceSystems = {
  Meeri: 'Meeri',
  Emma: 'Emma',
  Elli: 'Elli',
} as const;

export const ZIP_SUFFIX = 'zip';

export const RAITA_PARSING_EXCEPTION = '[RAITA PARSING EXCEPTION]';
export const SSM_CLOUDFRONT_CERTIFICATE_ARN =
  'raita-cloudfront-certificate-arn';
export const SSM_CLOUDFRONT_DOMAIN_NAME = 'raita-cloudfront-domain-name';
export const SSM_DMZ_API_DOMAIN_NAME = 'raita-dmz-api-domain-name';
export const SFTP_POLICY_ACCOUNT_ID = 'raita-sftp-policy-account-id';
export const SFTP_POLICY_USER_ID = 'raita-sftp-policy-user-id';

export const ENVIRONMENTS = {
  dev: 'dev',
  prod: 'prod',
} as const;

export const PRODUCTION_BRANCH = 'prod';
export const PRODUCTION_STACK_ID = PRODUCTION_BRANCH;
export const DEVELOPMENT_MAIN_BRANCH = 'main';
export const DEVELOPMENT_MAIN_STACK_ID = DEVELOPMENT_MAIN_BRANCH;
