export const SSM_CLOUDFRONT_CERTIFICATE_ARN =
  'raita-cloudfront-certificate-arn';
export const SSM_CLOUDFRONT_DOMAIN_NAME = 'raita-cloudfront-domain-name';

export const ENVIRONMENTS = {
  dev: 'dev',
  prod: 'prod',
} as const;

// NOTE: TO BE DECIDED AND POSSIBLY MOVED AROUND
export const PRODUCTION_BRANCH = 'prod';
export const PRODUCTION_STACK_ID = PRODUCTION_BRANCH;
export const DEVELOPMENT_MAIN_BRANCH = 'main';
export const DEVELOPMENT_MAIN_STACK_ID = DEVELOPMENT_MAIN_BRANCH;
