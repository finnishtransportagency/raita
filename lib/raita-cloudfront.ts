import { Stack, StackProps } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';
import { RaitaEnvironment } from './config';
import { getRemovalPolicy } from './utils';

interface FrontendInfraStackProps extends StackProps {
  readonly raitaStackId: string;
  readonly raitaEnv: RaitaEnvironment;
  readonly cloudfrontCertificateArn: string;
  readonly cloudfrontDomainName: string;
}

// Based on: https://idanlupinsky.com/blog/static-site-deployment-using-aws-cloudfront-and-the-cdk/
export class CloudfrontStack extends Stack {
  constructor(scope: Construct, id: string, props: FrontendInfraStackProps) {
    super(scope, id, props);
    const {
      raitaEnv,
      raitaStackId,
      cloudfrontCertificateArn,
      cloudfrontDomainName,
    } = props;

    const feBucket = new s3.Bucket(this, 'frontend', {
      bucketName: `s3-${raitaStackId}-frontend`,
      publicReadAccess: false,
      accessControl: s3.BucketAccessControl.PRIVATE,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: getRemovalPolicy(raitaEnv),
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(
      this,
      'CloudFrontOriginAccessIdentity',
    );

    feBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [feBucket.arnForObjects('*')],
        principals: [
          new iam.CanonicalUserPrincipal(
            cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId,
          ),
        ],
      }),
    );

    const certificate = acm.Certificate.fromCertificateArn(
      this,
      `certificate-${raitaStackId}`,
      cloudfrontCertificateArn,
    );

    const cloudfrontDistribution = new cloudfront.Distribution(
      this,
      `cloudfront`,
      {
        domainNames: [cloudfrontDomainName],
        certificate,
        defaultRootObject: 'index.html',
        comment: `cloudfront for ${raitaStackId}`,
        defaultBehavior: {
          origin: new origins.S3Origin(feBucket, {
            originAccessIdentity: cloudfrontOAI,
          }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      },
    );
  }
}
