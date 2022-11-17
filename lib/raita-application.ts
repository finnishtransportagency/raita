import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RaitaEnvironment } from './config';
import { getRemovalPolicy } from './utils';
import {
  AnyPrincipal,
  Effect,
  PolicyStatement,
  Role,
} from 'aws-cdk-lib/aws-iam';
import { Port } from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';

import { RaitaApiStack } from './raita-api';
import { DataProcessStack } from './raita-data-process';

interface ApplicationStackProps extends NestedStackProps {
  readonly raitaStackIdentifier: string;
  readonly raitaEnv: RaitaEnvironment;
  readonly vpc: ec2.IVpc;
  readonly openSearchMetadataIndex: string;
  readonly parserConfigurationFile: string;
  readonly sftpPolicyAccountId: string;
  readonly sftpPolicyUserId: string;
}

/**
 * OpenSearch documentation available at: https://docs.aws.amazon.com/opensearch-service/latest/developerguide/what-is.html
 */
export class ApplicationStack extends NestedStack {
  constructor(scope: Construct, id: string, props: ApplicationStackProps) {
    super(scope, id, props);
    const {
      raitaStackIdentifier,
      raitaEnv,
      vpc,
      openSearchMetadataIndex,
      parserConfigurationFile,
      sftpPolicyAccountId,
      sftpPolicyUserId,
    } = props;

    // Create and configure OpenSearch domain
    const openSearchDomain = this.createOpenSearchDomain({
      name: 'db',
      raitaEnv: raitaEnv,
      vpc,
      raitaStackIdentifier,
    });

    // Create data processing resources
    const dataProcessStack = new DataProcessStack(this, 'stack-dataprocess', {
      raitaStackIdentifier: raitaStackIdentifier,
      raitaEnv,
      vpc,
      openSearchDomain: openSearchDomain,
      openSearchMetadataIndex: openSearchMetadataIndex,
      parserConfigurationFile: parserConfigurationFile,
      sftpPolicyAccountId: sftpPolicyAccountId,
      sftpPolicyUserId: sftpPolicyUserId,
    });

    // Create API Gateway
    const raitaApi = new RaitaApiStack(this, 'stack-api', {
      inspectionDataBucket: dataProcessStack.inspectionDataBucket,
      openSearchDomain: openSearchDomain,
      raitaEnv,
      raitaStackIdentifier: raitaStackIdentifier,
      openSearchMetadataIndex: openSearchMetadataIndex,
      vpc,
    });

    // Grant data processor lambdas permissions to call OpenSearch endpoints
    this.createManagedPolicy({
      name: 'DataProcessOpenSearchHttpPolicy',
      raitaStackIdentifier,
      serviceRoles: [dataProcessStack.dataProcessorLambdaServiceRole],
      resources: [openSearchDomain.domainArn],
      actions: ['es:ESHttpGet', 'es:ESHttpPost', 'es:ESHttpPut'],
    });

    // Grant api lambdas permissions to call OpenSearch endpoints
    this.createManagedPolicy({
      name: 'ApiOpenSearchHttpPolicy',
      raitaStackIdentifier,
      serviceRoles: [raitaApi.raitaApiLambdaServiceRole],
      resources: [openSearchDomain.domainArn],
      actions: ['es:ESHttpGet', 'es:ESHttpPost', 'es:ESHttpPut'],
    });

    // Allow traffic from lambdas to OpenSearch
    openSearchDomain.connections.allowFrom(
      dataProcessStack.handleInspectionFileEventFn,
      Port.allTraffic(),
      'Allows parser lambda to connect to Opensearch.',
    );
    openSearchDomain.connections.allowFrom(
      raitaApi.handleFilesRequestFn,
      Port.allTraffic(),
      'Allows parser lambda to connect to Opensearch.',
    );
    openSearchDomain.connections.allowFrom(
      raitaApi.handleMetaRequestFn,
      Port.allTraffic(),
      'Allows meta endpoint handler lambda to connect to Opensearch.',
    );
  }

  /**
   * Creates OpenSearch domain
   */
  private createOpenSearchDomain({
    name,
    raitaEnv,
    vpc,
    raitaStackIdentifier,
  }: {
    name: string;
    raitaEnv: RaitaEnvironment;
    vpc: ec2.IVpc;
    raitaStackIdentifier: string;
  }) {
    const domainName = `${name}-${raitaStackIdentifier}`;
    const domainArn =
      'arn:aws:es:' +
      this.region +
      ':' +
      this.account +
      ':domain/' +
      domainName +
      '/*';
    // TODO: Identify parameters to move to environment (and move)
    return new opensearch.Domain(this, domainName, {
      domainName,
      version: opensearch.EngineVersion.OPENSEARCH_1_0,
      removalPolicy: getRemovalPolicy(raitaEnv),
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
      // must be enabled if VPC contains multiple private subnets.
      // zoneAwareness: {
      //   enabled: true,
      // },
      vpc,
      vpcSubnets: [
        {
          subnets: vpc.privateSubnets.slice(0, 1),
        },
      ],
      accessPolicies: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['es:ESHttp*'],
          principals: [new AnyPrincipal()],
          resources: [domainArn],
        }),
      ],
    });
  }

  private createManagedPolicy({
    name,
    serviceRoles,
    actions,
    resources,
    raitaStackIdentifier,
  }: {
    name: string;
    serviceRoles: Array<Role>;
    actions: Array<string>;
    resources: Array<string>;
    raitaStackIdentifier: string;
  }) {
    // Create a ManagedPolicy that allows lambda role to call open search endpoints
    const managedPolicy = new iam.ManagedPolicy(
      this,
      `managedpolicy-${raitaStackIdentifier}-${name}`,
      {
        roles: serviceRoles,
      },
    );
    managedPolicy.addStatements(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources,
        actions,
      }),
    );
    return managedPolicy;
  }
}
