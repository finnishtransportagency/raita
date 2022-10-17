import { getEnvOrFail } from '../utils';
import * as ssm from 'aws-cdk-lib/aws-ssm';
// import { Construct } from '@aws-cdk/core';
import {
  SSM_CLOUDFRONT_CERTIFICATE_ARN,
  SSM_CLOUDFRONT_DOMAIN_NAME,
} from '../constants';
import { Construct } from 'constructs';

export type RaitaEnvironment = typeof environments[keyof typeof environments];

function isRaitaEnvironment(arg: string | undefined): arg is RaitaEnvironment {
  return !!arg && Object.values(environments).includes(arg as any);
}

const environments = {
  dev: 'dev',
  prod: 'prod',
} as const;

// NOTE: TO BE DECIDED AND POSSIBLY MOVED AROUND
const productionBranch = 'prod';
const productionStackId = productionBranch;
const developmentMainBranch = 'main';
const developmentMainStackId = developmentMainBranch;

// Returns token that resolves during deployment to SSM parameter value
const getSSMParameter = (scope: Construct, parameterName: string) =>
  ssm.StringParameter.valueForStringParameter(scope, parameterName);

const getStackId = (branch: string): string => {
  const stackId = getEnvOrFail('STACK_ID');
  if (branch === developmentMainBranch && stackId !== developmentMainStackId) {
    throw new Error(
      `For branch ${developmentMainBranch} stack id must match the branch`,
    );
  }
  if (branch === productionBranch && stackId !== productionStackId) {
    throw new Error(
      `For branch ${productionBranch} stack id must match the branch`,
    );
  }
  return stackId;
};

export const getPipelineConfig = () => {
  const envFromEnvironment = getEnvOrFail('ENVIRONMENT');
  if (isRaitaEnvironment(envFromEnvironment)) {
    // Determine which Gitbub branch to use: Branch for production env is fixed, for other environments it is read from environment
    const branch =
      envFromEnvironment === environments.prod
        ? productionBranch
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
