import { Stack, StackProps } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';
import { RaitaEnvironment } from './config';
import { Bucket } from 'aws-cdk-lib/aws-s3';

interface CloudfrontStackProps extends StackProps {
  readonly raitaStackIdentifier: string;
  readonly raitaEnv: RaitaEnvironment;
  readonly cloudfrontCertificateArn: string;
  readonly cloudfrontDomainName: string;
  readonly frontendBucket: Bucket;
}

// Based on: https://idanlupinsky.com/blog/static-site-deployment-using-aws-cloudfront-and-the-cdk/
export class RaitaCloudfrontStack extends Stack {
  constructor(scope: Construct, id: string, props: CloudfrontStackProps) {
    super(scope, id, props);
    const {
      raitaStackIdentifier,
      cloudfrontCertificateArn,
      cloudfrontDomainName,
      frontendBucket,
    } = props;

    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(
      this,
      'CloudFrontOriginAccessIdentity',
    );

    frontendBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [frontendBucket.arnForObjects('*')],
        principals: [
          new iam.CanonicalUserPrincipal(
            cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId,
          ),
        ],
      }),
    );

    const certificate = acm.Certificate.fromCertificateArn(
      this,
      `certificate-${raitaStackIdentifier}`,
      cloudfrontCertificateArn,
    );

    const cloudfrontDistribution = new cloudfront.Distribution(
      this,
      `cloudfront`,
      {
        domainNames: [cloudfrontDomainName],
        certificate,
        defaultRootObject: 'index.html',
        comment: `cloudfront for ${raitaStackIdentifier}`,
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        defaultBehavior: {
          origin: new origins.S3Origin(frontendBucket, {
            originAccessIdentity: cloudfrontOAI,
          }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      },
    );
  }
}
