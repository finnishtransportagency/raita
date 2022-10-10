import {
  Duration,
  NestedStack,
  NestedStackProps,
  RemovalPolicy,
} from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

import { Construct } from 'constructs';

interface FrontendInfraStackProps extends NestedStackProps {}

// Based on: https://idanlupinsky.com/blog/static-site-deployment-using-aws-cloudfront-and-the-cdk/
export class RaitaGatewayStack extends NestedStack {
  constructor(scope: Construct, props: FrontendInfraStackProps) {
    super(scope, 'stack-fe', props);

    // TODO: Make env dependent, currently hardcoded to dev --> test
    const domainName = 'raita-dev.vayla.fi';

    const feBucket = new s3.Bucket(this, 'WebsiteBucket', {
      publicReadAccess: false,
      accessControl: s3.BucketAccessControl.PRIVATE,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      // TODO - Update to env dependency
      removalPolicy: RemovalPolicy.DESTROY,
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

    // const zone = route53.HostedZone.fromLookup(this, 'HostedZone',
    // { domainName: domainName });
    // const certificate = new acm.DnsValidatedCertificate(this,
    //   'SiteCertificate',
    //   {
    //       domainName: domainName,
    //       hostedZone: zone,
    //       region: 'us-east-1',
    //   });

    //   const responseHeaderPolicy = new cloudfront.ResponseHeadersPolicy(this, 'SecurityHeadersResponseHeaderPolicy', {
    //     comment: 'Security headers response header policy',
    //     securityHeadersBehavior: {
    //         contentSecurityPolicy: {
    //             override: true,
    //             contentSecurityPolicy: "default-src 'self'"
    //         },
    //         strictTransportSecurity: {
    //             override: true,
    //             accessControlMaxAge: Duration.days(2 * 365),
    //             includeSubdomains: true,
    //             preload: true
    //         },
    //         contentTypeOptions: {
    //             override: true
    //         },
    //         referrerPolicy: {
    //             override: true,
    //             referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN
    //         },
    //         xssProtection: {
    //             override: true,
    //             protection: true,
    //             modeBlock: true
    //         },
    //         frameOptions: {
    //             override: true,
    //             frameOption: cloudfront.HeadersFrameOption.DENY
    //         }
    //     }
    // });

    const cloudfrontDistribution = new cloudfront.Distribution(
      this,
      'cloudfront',
      {
        // certificate: certificate,
        domainNames: [domainName],
        defaultRootObject: 'index.html',
        defaultBehavior: {
          origin: new origins.S3Origin(feBucket, {
            originAccessIdentity: cloudfrontOAI,
          }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          // responseHeadersPolicy: responseHeaderPolicy
        },
      },
    );

    new cloudfront.Distribution(this, 'distro', {
      defaultBehavior: {
        origin: new origins.S3Origin(feBucket),
        // edgeLambdas: [
        //   {
        //     functionVersion,
        //     eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
        //   },
        // ],
      },
    });
  }
}
