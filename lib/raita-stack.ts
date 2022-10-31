import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CloudfrontStack } from './raita-cloudfront';
import { FrontendStack } from './raita-frontend';
import { getRaitaStackConfig, RaitaEnvironment } from './config';
import { isPermanentStack } from './utils';
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
    new ApplicationStack(this, 'stack-db', {
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
      new CloudfrontStack(this, 'stack-cf', {
        raitaStackIdentifier: this.#raitaStackIdentifier,
        raitaEnv: raitaEnv,
        cloudfrontCertificateArn: config.cloudfrontCertificateArn,
        cloudfrontDomainName: config.cloudfrontDomainName,
        frontendBucket: frontendStack.frontendBucket,
      });
    }
  }
}
