import {
  LORAM_POLICY_USER_ID,
  raitaSourceSystems,
  SOA_POLICY_ACCOUNT_ID,
  SSM_EMAIL_SENDER_ADDRESS,
  SSM_JWT_TOKEN_ISSUER,
  SSM_SMTP_ENDPOINT,
  VAYLA_POLICY_USER_ID,
} from '../constants';
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
  SSM_DMZ_API_DOMAIN_NAME,
  SFTP_POLICY_ACCOUNT_ID,
  SFTP_POLICY_USER_ID,
  SFTP_RAITA_DEVELOPER_POLICY_USER_ID,
} from '../constants';
import { Construct } from 'constructs';

export type RaitaEnvironment = (typeof ENVIRONMENTS)[keyof typeof ENVIRONMENTS];

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

interface AccountVpcResources {
  vpc: {
    readonly vpcId: string;
    readonly availabilityZones: Array<string>;
    readonly privateSubnetIds: Array<string>;
  };
  securityGroupId: string;
}

export const getAccountVpcResourceConfig = (
  raitaEnv: RaitaEnvironment,
): AccountVpcResources => {
  const vpcIds: Record<RaitaEnvironment, AccountVpcResources> = {
    dev: {
      vpc: {
        vpcId: 'vpc-02e4e06ed07180dfc',
        availabilityZones: ['eu-west-1a', 'eu-west-1b'],
        privateSubnetIds: [
          'subnet-030193d252c16075a',
          'subnet-0bcfa0aec6736ca62',
        ],
      },
      securityGroupId: 'sg-018e06b4bde756171',
    } as AccountVpcResources,
    prod: {
      vpc: {
        vpcId: 'vpc-08e6a6fe4f05c2c9e',
        availabilityZones: ['eu-west-1a', 'eu-west-1b'],
        privateSubnetIds: [
          'subnet-077a9e22a880f1f5d',
          'subnet-0f3c1b5baa422d1f7',
        ],
      },
      securityGroupId: 'sg-0b2d052c73469c708',
    } as AccountVpcResources,
  } as const;
  return vpcIds[raitaEnv];
};

// RaitaStack specific configuration
export const getRaitaStackConfig = (
  scope: Construct,
  raitaEnv: RaitaEnvironment,
) => ({
  parserConfigurationFile: 'extractionSpec.json',
  raitaSourceSystems: Object.values(raitaSourceSystems),
  cloudfrontCertificateArn: getSSMParameter(
    scope,
    SSM_CLOUDFRONT_CERTIFICATE_ARN,
  ),
  cloudfrontDomainName: getSSMParameter(scope, SSM_CLOUDFRONT_DOMAIN_NAME),
  dmzApiEndpoint: getSSMParameter(scope, SSM_DMZ_API_DOMAIN_NAME),
  sftpPolicyAccountId: getSSMParameter(scope, SFTP_POLICY_ACCOUNT_ID),
  // sftp user for data reception
  sftpPolicyUserId: getSSMParameter(scope, SFTP_POLICY_USER_ID),
  // RAITA developer sftp user for testing
  sftpRaitaDeveloperPolicyUserId: getSSMParameter(
    scope,
    SFTP_RAITA_DEVELOPER_POLICY_USER_ID,
  ),
  soaPolicyAccountId: getSSMParameter(scope, SOA_POLICY_ACCOUNT_ID),
  vaylaPolicyUserId: getSSMParameter(scope, VAYLA_POLICY_USER_ID),
  loramPolicyUserId: getSSMParameter(scope, LORAM_POLICY_USER_ID),
  jwtTokenIssuer: getSSMParameter(scope, SSM_JWT_TOKEN_ISSUER),
  emailSenderAddress: getSSMParameter(scope, SSM_EMAIL_SENDER_ADDRESS),
  smtpEndpoint: getSSMParameter(scope, SSM_SMTP_ENDPOINT),
  ...getAccountVpcResourceConfig(raitaEnv),
});

export type DatabaseEnvironmentVariables = {
  PGUSER: string;
  PGHOST: string;
  PGDATABASE: string;
  PGPORT: string;
  RAITA_PGSCHEMA: string;
};
