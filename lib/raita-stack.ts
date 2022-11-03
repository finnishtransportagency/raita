import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CloudfrontStack } from './raita-cloudfront';
import { getRaitaStackConfig, RaitaEnvironment } from './config';
import { ApplicationStack } from './raita-application';

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

    // Create application resources (db, data process resources, api resources)
    new ApplicationStack(this, 'stack-app', {
      raitaStackIdentifier: this.#raitaStackIdentifier,
      raitaEnv,
      vpc: raitaVPC,
      openSearchMetadataIndex: config.openSearchMetadataIndex,
      parserConfigurationFile: config.parserConfigurationFile,
    });

    // Create Cloudfront stack
    new CloudfrontStack(this, 'stack-cf', {
      raitaStackIdentifier: this.#raitaStackIdentifier,
      raitaEnv,
      stackId,
      cloudfrontCertificateArn: config.cloudfrontCertificateArn,
      cloudfrontDomainName: config.cloudfrontDomainName,
    });
  }
}
