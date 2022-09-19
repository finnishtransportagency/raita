import { Stack, StackProps } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { S3EventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

/**
 * TODO: UserPool and IdentityPool addition to stack
 *
 */

export class RaitaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const dataBucket = new s3.Bucket(this, 'mermec-data', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const configurationBucket = new s3.Bucket(this, 'mermec-configuration', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const openSearchDomain = new opensearch.Domain(this, 'mermec-base', {
      version: opensearch.EngineVersion.OPENSEARCH_1_0,
      ebs: {
        volumeSize: 10,
        volumeType: ec2.EbsDeviceVolumeType.GENERAL_PURPOSE_SSD,
      },
      capacity: {
        dataNodes: 1,
        dataNodeInstanceType: 't3.small.search',
      },
      nodeToNodeEncryption: true,
      encryptionAtRest: {
        enabled: true,
      },
      enforceHttps: true,
      useUnsignedBasicAuth: true,
    });

    const handleMermecFileEvents = new NodejsFunction(this, 'mermec-parser', {
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'handleMermecFileEvents',
      entry: path.join(__dirname, `../lambda/mermecParser/mermecParser.ts`),
      environment: {
        OPENSEARCH_DOMAIN: openSearchDomain.domainEndpoint,
        CONFIGURATION_BUCKET: configurationBucket.bucketName,
      },
    });

    dataBucket.grantRead(handleMermecFileEvents);
    configurationBucket.grantRead(handleMermecFileEvents);

    // OPEN: Figure out if some filtering can be applied alredy at this level with filter property
    handleMermecFileEvents.addEventSource(
      new S3EventSource(dataBucket, {
        events: [s3.EventType.OBJECT_CREATED, s3.EventType.OBJECT_REMOVED],
      }),
    );
  }
}
