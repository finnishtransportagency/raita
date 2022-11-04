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

    // Get existing vpc based on predetermined attributes
    const raitaVPC = ec2.Vpc.fromVpcAttributes(this, 'rataextra-vpc', {
      ...config.vpc,
    });

    // Create application resources (db, data process resources, api resources)
    // new ApplicationStack(this, 'stack-app', {
    //   raitaStackIdentifier: this.#raitaStackIdentifier,
    //   raitaEnv,
    //   vpc: raitaVPC,
    //   openSearchMetadataIndex: config.openSearchMetadataIndex,
    //   parserConfigurationFile: config.parserConfigurationFile,
    // });

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
