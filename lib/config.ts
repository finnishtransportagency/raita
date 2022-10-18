import { getEnvOrFail } from '../utils';
import * as ssm from 'aws-cdk-lib/aws-ssm';
// import { Construct } from '@aws-cdk/core';
import {
  DEVELOPMENT_MAIN_BRANCH,
  DEVELOPMENT_MAIN_STACK_ID,
  ENVIRONMENTS,
  PRODUCTION_BRANCH,
  PRODUCTION_STACK_ID,
  SSM_CLOUDFRONT_CERTIFICATE_ARN,
  SSM_CLOUDFRONT_DOMAIN_NAME,
} from '../constants';
import { Construct } from 'constructs';

export type RaitaEnvironment = typeof ENVIRONMENTS[keyof typeof ENVIRONMENTS];

function isRaitaEnvironment(arg: string | undefined): arg is RaitaEnvironment {
  return !!arg && Object.values(ENVIRONMENTS).includes(arg as any);
}

// Returns token that resolves during deployment to SSM parameter value
const getSSMParameter = (scope: Construct, parameterName: string) =>
  ssm.StringParameter.valueForStringParameter(scope, parameterName);

const getStackId = (branch: string): string => {
  const stackId = getEnvOrFail('STACK_ID');
  if (
    branch === DEVELOPMENT_MAIN_BRANCH &&
    stackId !== DEVELOPMENT_MAIN_STACK_ID
  ) {
    throw new Error(
      `For branch ${DEVELOPMENT_MAIN_BRANCH} stack id must match the branch`,
    );
  }
  if (branch === PRODUCTION_BRANCH && stackId !== PRODUCTION_STACK_ID) {
    throw new Error(
      `For branch ${PRODUCTION_BRANCH} stack id must match the branch`,
    );
  }
  return stackId;
};

export const getPipelineConfig = () => {
  const envFromEnvironment = getEnvOrFail('ENVIRONMENT');
  if (isRaitaEnvironment(envFromEnvironment)) {
    // Determine which Gitbub branch to use: Branch for production env is fixed, for other environments it is read from environment
    const branch =
      envFromEnvironment === ENVIRONMENTS.prod
        ? PRODUCTION_BRANCH
        : getEnvOrFail('BRANCH');
    return {
      env: envFromEnvironment,
      branch,
      stackId: getStackId(branch),
      authenticationToken: 'github-token',
      tags: {
        Environment: envFromEnvironment,
        Project: 'raita',
      },
    };
  }
  throw new Error(
    `Environment value ${envFromEnvironment} for ENVIRONMENT is not valid Raita environment.`,
  );
};

// RaitaStack specific configuration
// These values are used solely by metadata parser
// Pending possible move to SSM Parameter Store (after discussion)
export const getRaitaStackConfig = (scope: Construct) => ({
  parserConfigurationFile: 'extractionSpec.json',
  openSearchMetadataIndex: 'metadata-index',
  cloudfrontCertificateArn: getSSMParameter(
    scope,
    SSM_CLOUDFRONT_CERTIFICATE_ARN,
  ),
  cloudfrontDomainName: getSSMParameter(scope, SSM_CLOUDFRONT_DOMAIN_NAME),
});
