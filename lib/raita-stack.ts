import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Stack, StackProps, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CloudfrontStack } from './raita-cloudfront';
import { getRaitaStackConfig, RaitaEnvironment } from './config';
import { ApplicationStack } from './raita-application';

interface RaitaStackProps extends StackProps {
  readonly raitaEnv: RaitaEnvironment;
  readonly stackId: string;
  readonly tags: { [key: string]: string };
}

export class RaitaStack extends Stack {
  constructor(scope: Construct, id: string, props: RaitaStackProps) {
    super(scope, id, props);
    const raitaStackIdentifier = id.toLowerCase();
    const { raitaEnv, stackId, tags } = props;

    // Get config based on Raita environment
    const config = getRaitaStackConfig(this, raitaEnv);

    // Get existing VPC based on predetermined attributes
    const raitaVPC = ec2.Vpc.fromVpcAttributes(this, 'raita-vpc', {
      ...config.vpc,
    });

    // Get existing security group based on predetermined attributes
    const raitaSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      'raita-security-group',
      config.securityGroupId,
    );

    // Create application resources (db, data process resources, api resources)
    const applicationStack = new ApplicationStack(this, 'stack-app', {
      raitaStackIdentifier,
      raitaEnv,
      stackId,
      jwtTokenIssuer: config.jwtTokenIssuer,
      vpc: raitaVPC,
      raitaSecurityGroup,
      parserConfigurationFile: config.parserConfigurationFile,
      sftpPolicyAccountId: config.sftpPolicyAccountId,
      sftpPolicyUserId: config.sftpPolicyUserId,
      sftpRaitaDeveloperPolicyUserId: config.sftpRaitaDeveloperPolicyUserId,
      soaPolicyAccountId: config.soaPolicyAccountId,
      vaylaPolicyUserId: config.vaylaPolicyUserId,
      loramPolicyUserId: config.loramPolicyUserId,
      cloudfrontDomainName: config.cloudfrontDomainName,
      emailSenderAddress: config.emailSenderAddress,
      smtpEndpoint: config.smtpEndpoint,
    });
    Object.entries(tags).forEach(([key, value]) =>
      Tags.of(applicationStack).add(key, value),
    );

    // Create Cloudfront stack
    const cloudFrontStack = new CloudfrontStack(this, 'stack-cf', {
      raitaStackIdentifier,
      raitaEnv,
      stackId,
      tags: tags,
    });
    Object.entries(tags).forEach(([key, value]) =>
      Tags.of(cloudFrontStack).add(key, value),
    );
  }
}
