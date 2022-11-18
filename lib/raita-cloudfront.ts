import { Stack, StackProps, Tags } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';
import { RaitaEnvironment } from './config';
import { isPermanentStack } from './utils';
import { FrontendStack } from './raita-frontend';
import {
  AllowedMethods,
  BehaviorOptions,
  CachePolicy,
  OriginRequestPolicy,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';

interface CloudfrontStackProps extends StackProps {
  readonly raitaStackIdentifier: string;
  readonly raitaEnv: RaitaEnvironment;
  readonly stackId: string;
  readonly tags: { [key: string]: string };
  readonly cloudfrontCertificateArn: string;
  readonly cloudfrontDomainName: string;
  readonly dmzApiEndpoint: string;
}

// Based on: https://idanlupinsky.com/blog/static-site-deployment-using-aws-cloudfront-and-the-cdk/
export class CloudfrontStack extends Stack {
  constructor(scope: Construct, id: string, props: CloudfrontStackProps) {
    super(scope, id, props);
    const {
      raitaStackIdentifier,
      cloudfrontCertificateArn,
      cloudfrontDomainName,
      dmzApiEndpoint,
      stackId,
      raitaEnv,
      tags,
    } = props;

    // Create frontend stack to hold frontend artifacts
    const frontendStack = new FrontendStack(this, 'stack-fe', {
      raitaEnv,
      raitaStackIdentifier,
    });
    // Object.entries(tags).forEach(([key, value]) =>
    //   Tags.of(frontendStack).add(key, value),
    // );

    // Create Cloudfront itself conditionally - only for main and prod stackIds
    // Feature branches do not provide access from outside
    if (isPermanentStack(stackId, raitaEnv)) {
      const cloudfrontOAI = new cloudfront.OriginAccessIdentity(
        this,
        'CloudFrontOriginAccessIdentity',
      );
      const certificate = acm.Certificate.fromCertificateArn(
        this,
        `certificate-${raitaStackIdentifier}`,
        cloudfrontCertificateArn,
      );

      const apiProxyBehavior: BehaviorOptions = {
        origin: new origins.HttpOrigin(dmzApiEndpoint),
        cachePolicy: CachePolicy.CACHING_DISABLED,
        originRequestPolicy: OriginRequestPolicy.ALL_VIEWER,
        allowedMethods: AllowedMethods.ALLOW_ALL,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      };

      new cloudfront.Distribution(this, `cloudfront`, {
        domainNames: [cloudfrontDomainName],
        certificate,
        defaultRootObject: 'index.html',
        comment: `cloudfront for ${raitaStackIdentifier}`,
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        defaultBehavior: {
          origin: new origins.S3Origin(frontendStack.frontendBucket, {
            originAccessIdentity: cloudfrontOAI,
          }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        additionalBehaviors: {
          '/api*': apiProxyBehavior,
          '/oauth2*': apiProxyBehavior,
        },
      });

      // Grant OAI permissions to access the frontend bucket resources
      frontendStack.frontendBucket.addToResourcePolicy(
        new iam.PolicyStatement({
          actions: ['s3:GetObject'],
          resources: [frontendStack.frontendBucket.arnForObjects('*')],
          principals: [
            new iam.CanonicalUserPrincipal(
              cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId,
            ),
          ],
        }),
      );
    }
  }
}
