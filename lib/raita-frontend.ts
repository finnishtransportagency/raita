import { NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import * as path from 'path';
import { RaitaEnvironment } from './config';
import { createRaitaBucket } from './raitaResourceCreators';

interface FrontendStackProps extends NestedStackProps {
  readonly raitaStackIdentifier: string;
  readonly raitaEnv: RaitaEnvironment;
}

export class FrontendStack extends NestedStack {
  public readonly frontendBucket: Bucket;

  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);
    const { raitaEnv, raitaStackIdentifier } = props;

    this.frontendBucket = createRaitaBucket({
      scope: this,
      name: 'frontend',
      raitaEnv,
      raitaStackIdentifier,
    });

    // Deploy pipeline front end build products to S3 bucket
    const buildDir = '../frontend/out';
    new BucketDeployment(this, 'FrontendDeployment', {
      sources: [Source.asset(path.join(__dirname, buildDir))],
      destinationBucket: this.frontendBucket,
    });
  }
}
