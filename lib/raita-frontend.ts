import { NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import * as path from 'path';
import { RaitaEnvironment } from './config';
import { createRaitaBucket } from './raitaResourceCreators';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { isDevelopmentPreMainStack } from './utils';
import { CanonicalUserPrincipal } from 'aws-cdk-lib/aws-iam';

interface FrontendStackProps extends NestedStackProps {
  readonly raitaStackIdentifier: string;
  readonly raitaEnv: RaitaEnvironment;
  stackId: string;
}

export class FrontendStack extends NestedStack {
  public readonly frontendBucket: Bucket;
  public readonly maintenancePageBucket: Bucket;

  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);
    const { raitaEnv, raitaStackIdentifier, stackId } = props;

    this.frontendBucket = createRaitaBucket({
      scope: this,
      name: 'front',
      raitaEnv,
      raitaStackIdentifier,
    });

    // Deploy pipeline front end build products to S3 bucket
    const buildDir = '../frontend/out';
    new BucketDeployment(this, 'FrontendDeployment', {
      sources: [Source.asset(path.join(__dirname, buildDir))],
      destinationBucket: this.frontendBucket,
    });

    this.maintenancePageBucket = createRaitaBucket({
      scope: this,
      name: 'maintenance-page',
      raitaEnv,
      raitaStackIdentifier,
    });
    const maintenanceBuildDir = '../frontend/maintenance_page';
    new BucketDeployment(this, 'MaintenancePageDeployment', {
      sources: [Source.asset(path.join(__dirname, maintenanceBuildDir))],
      destinationBucket: this.maintenancePageBucket,
    });
    if (isDevelopmentPreMainStack(stackId, raitaEnv)) {
      // save bucket arn for use by main stack, in dev premain stack only
      new StringParameter(this, `bucket-arn-param`, {
        parameterName: `raita-${raitaEnv}-${stackId}-front-bucket-arn`,
        stringValue: this.frontendBucket.bucketArn,
      });

      //give read access to main cf distribution
      const OAIIdParam = StringParameter.fromStringParameterName(
        this,
        'oai-id-param-import',
        'raita-dev-main-cloudfront-oai-id',
      );
      if (OAIIdParam && OAIIdParam.stringValue) {
        this.frontendBucket.grantRead(
          new CanonicalUserPrincipal(OAIIdParam.stringValue),
          '*',
        );
      }
    }
  }
}
