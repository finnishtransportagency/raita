import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RaitaCloudfrontStack } from './raita-cloudfront';
import { RaitaDatabaseStack } from './raita-database';
import { FrontendStack } from './raita-frontend';
import { getRaitaStackConfig, RaitaEnvironment } from './config';
import { isPermanentStack } from './utils';

interface RaitaStackProps extends StackProps {
  readonly raitaEnv: RaitaEnvironment;
  readonly stackId: string;
}

export class RaitaStack extends Stack {
  #raitaStackIdentifier: string;

  constructor(scope: Construct, id: string, props: RaitaStackProps) {
    super(scope, id, props);
    this.#raitaStackIdentifier = id.toLowerCase();
    const { raitaEnv, stackId } = props;
    const config = getRaitaStackConfig(this);

    // Create vpc
    const raitaVPC = new ec2.Vpc(this, `raita-vpc`, {
      vpcName: `vpc-${this.#raitaStackIdentifier}`,
      cidr: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // Add s3 Gateway enpoint to allow for lambda access to s3
    const s3GatewayEndpoint = raitaVPC.addGatewayEndpoint('s3-endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    // Create databases resources
    const dbStack = new RaitaDatabaseStack(this, 'stack-db', {
      raitaStackIdentifier: this.#raitaStackIdentifier,
      raitaEnv,
      vpc: raitaVPC,
      openSearchMetadataIndex: config.openSearchMetadataIndex,
      parserConfigurationFile: config.parserConfigurationFile,
    });

    // Create frontend stack to hold frontend artifacts
    const frontendStack = new FrontendStack(this, 'stack-fe', {
      raitaEnv,
      raitaStackIdentifier: this.#raitaStackIdentifier,
    });

    // Create Cloudfront stack conditionally - only for main and prod stackIds
    // Feature branches do not provide access from outside
    if (isPermanentStack(stackId, raitaEnv)) {
      new RaitaCloudfrontStack(this, 'stack-cf', {
        raitaStackIdentifier: this.#raitaStackIdentifier,
        raitaEnv: raitaEnv,
        cloudfrontCertificateArn: config.cloudfrontCertificateArn,
        cloudfrontDomainName: config.cloudfrontDomainName,
        frontendBucket: frontendStack.frontendBucket,
      });
    }
  }
}
