import { Stack, StackProps } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';
import { RaitaEnvironment } from './config';
import { isDevelopmentMainStack, isPermanentStack } from './utils';
import { FrontendStack } from './raita-frontend';
import {
  AllowedMethods,
  BehaviorOptions,
  CachePolicy,
  OriginRequestPolicy,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import * as path from 'path';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

interface CloudfrontStackProps extends StackProps {
  readonly raitaStackIdentifier: string;
  readonly raitaEnv: RaitaEnvironment;
  readonly stackId: string;
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
    } = props;

    // Create frontend stack to hold frontend artifacts
    const frontendStack = new FrontendStack(this, 'stack-fe', {
      raitaEnv,
      raitaStackIdentifier,
    });

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

      const frontEndBehavior = {
        origin: new origins.S3Origin(frontendStack.frontendBucket, {
          originAccessIdentity: cloudfrontOAI,
        }),
        functionAssociations: [
          {
            function: new cloudfront.Function(
              this,
              'FrontendRedirectCFFunction',
              {
                code: cloudfront.FunctionCode.fromFile({
                  filePath: path.join(
                    __dirname,
                    '../backend/lambdas/cloudfront/frontendRedirect/handleFrontendRedirect.js',
                  ),
                }),
              },
            ),
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
      };

      let importedBucket = null;
      if (isDevelopmentMainStack(stackId, raitaEnv)) {
        const bucketArnParam = StringParameter.fromStringParameterName(
          this,
          'premain-front-bucket-arn',
          'raita-dev-premain-front-bucket-arn', // TODO
        );
        if (bucketArnParam && bucketArnParam.stringValue) {
          importedBucket = Bucket.fromBucketArn(
            this,
            'front-premain-import',
            bucketArnParam.stringValue,
          );
        }
      }
      let additionalBehaviors = {};

      if (importedBucket && isDevelopmentMainStack(stackId, raitaEnv)) {
        const frontEndPremainBehavior = {
          origin: new origins.S3Origin(importedBucket, {
            originAccessIdentity: cloudfrontOAI,
          }),
          functionAssociations: [
            {
              function: new cloudfront.Function(
                this,
                'FrontendRedirectCFFunction',
                {
                  // TODO config overwrite?
                  code: cloudfront.FunctionCode.fromFile({
                    filePath: path.join(
                      __dirname,
                      '../backend/lambdas/cloudfront/frontendRedirect/handleFrontendRedirect.js',
                    ),
                  }),
                },
              ),
              eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
            },
          ],
          allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        };
        additionalBehaviors = {
          [`/premain/api*`]: apiProxyBehavior,
          [`/api*`]: apiProxyBehavior,
          [`/premain*`]: frontEndPremainBehavior,
          [`/oauth2*`]: apiProxyBehavior,
        };
      } else {
        // production
        additionalBehaviors = {
          [`/api*`]: apiProxyBehavior,
          [`/oauth2*`]: apiProxyBehavior,
        };
      }
      new cloudfront.Distribution(this, `cloudfront`, {
        domainNames: [cloudfrontDomainName],
        certificate,
        defaultRootObject: 'reports.html',
        comment: `cloudfront for ${raitaStackIdentifier}`,
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        defaultBehavior: frontEndBehavior,
        additionalBehaviors,
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
