import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Port } from 'aws-cdk-lib/aws-ec2';
import { BundlingOutput, NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RaitaEnvironment } from './config';
import { getEnvDependentOsConfiguration, isPermanentStack } from './utils';

import { RaitaApiStack } from './raita-api';
import { DataProcessStack } from './raita-data-process';
import { BastionStack } from './raita-bastion';
import { PsqlClientStack } from './raita-psql-client-ec2';
import { SSM_API_KEY } from '../constants';
import { Code, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import path from 'path';

interface ApplicationStackProps extends NestedStackProps {
  readonly raitaStackIdentifier: string;
  readonly stackId: string;
  readonly raitaEnv: RaitaEnvironment;
  readonly jwtTokenIssuer: string;
  readonly vpc: ec2.IVpc;
  readonly raitaSecurityGroup: ec2.ISecurityGroup;
  readonly openSearchMetadataIndex: string;
  readonly parserConfigurationFile: string;
  readonly sftpPolicyAccountId: string;
  readonly sftpPolicyUserId: string;
  readonly sftpRaitaDeveloperPolicyUserId: string;
  readonly soaPolicyAccountId: string;
  readonly vaylaPolicyUserId: string;
  readonly loramPolicyUserId: string;
  readonly cloudfrontDomainName: string;
}

/**
 * OpenSearch documentation available at: https://docs.aws.amazon.com/opensearch-service/latest/developerguide/what-is.html
 */
export class ApplicationStack extends NestedStack {
  constructor(scope: Construct, id: string, props: ApplicationStackProps) {
    super(scope, id, props);
    const {
      raitaStackIdentifier,
      stackId,
      raitaEnv,
      jwtTokenIssuer,
      vpc,
      raitaSecurityGroup,
      openSearchMetadataIndex,
      parserConfigurationFile,
      sftpPolicyAccountId,
      sftpPolicyUserId,
      sftpRaitaDeveloperPolicyUserId,
      soaPolicyAccountId,
      vaylaPolicyUserId,
      loramPolicyUserId,
      cloudfrontDomainName,
    } = props;

    // Create and configure OpenSearch domain
    const openSearchDomain = this.createOpenSearchDomain({
      name: 'db',
      raitaEnv,
      vpc,
      raitaStackIdentifier,
    });

    // Create a lambda layer containing prisma client and engine, to avoid bundling big engine files for every lambda
    const prismaLambdaLayer = new LayerVersion(this, 'prisma-layer-version', {
      code: Code.fromAsset(path.join(__dirname, '../'), {
        bundling: {
          image: Runtime.NODEJS_20_X.bundlingImage,
          command: ['bash', './create-prisma-lambda-layer.sh'],
          outputType: BundlingOutput.NOT_ARCHIVED,
          workingDirectory: '/asset-input',
        },
      }),
    });

    // Create data processing resources
    const dataProcessStack = new DataProcessStack(this, 'stack-dataprocess', {
      raitaStackIdentifier: raitaStackIdentifier,
      raitaEnv,
      stackId,
      vpc,
      openSearchDomain: openSearchDomain,
      openSearchMetadataIndex: openSearchMetadataIndex,
      parserConfigurationFile: parserConfigurationFile,
      sftpPolicyAccountId: sftpPolicyAccountId,
      sftpPolicyUserId: sftpPolicyUserId,
      sftpRaitaDeveloperPolicyUserId: sftpRaitaDeveloperPolicyUserId,
      soaPolicyAccountId: soaPolicyAccountId,
      vaylaPolicyUserId: vaylaPolicyUserId,
      loramPolicyUserId: loramPolicyUserId,
      prismaLambdaLayer,
    });

    // Create API Gateway
    const raitaApiStack = new RaitaApiStack(this, 'stack-api', {
      inspectionDataBucket: dataProcessStack.inspectionDataBucket,
      dataReceptionBucket: dataProcessStack.dataReceptionBucket,
      csvDataBucket: dataProcessStack.csvDataBucket,
      openSearchDomain: openSearchDomain,
      raitaEnv,
      stackId,
      jwtTokenIssuer,
      raitaStackIdentifier: raitaStackIdentifier,
      openSearchMetadataIndex: openSearchMetadataIndex,
      cloudfrontDomainName: cloudfrontDomainName,
      vpc,
      raitaSecurityGroup,
      prismaLambdaLayer,
    });

    // Create Bastion Host for dev (main branch/stack) and production
    if (isPermanentStack(stackId, raitaEnv)) {
      new BastionStack(this, 'stack-bastion', {
        raitaStackIdentifier,
        vpc,
        securityGroup: raitaSecurityGroup,
        albDns: raitaApiStack.alb.loadBalancerDnsName,
        databaseDomainEndpoint: openSearchDomain.domainEndpoint,
      });
    }

    // Create an ec2 machine for easy postgres access for dev (main branch/stack) and production
    if (isPermanentStack(stackId, raitaEnv)) {
      new PsqlClientStack(this, 'stack-psql-client', {
        raitaStackIdentifier,
        vpc,
        securityGroup: new ec2.SecurityGroup(this, 'psql-client-sg', {
          vpc,
          allowAllOutbound: true,
        }),
      });
    }

    // Grant data processor lambdas permissions to call OpenSearch endpoints
    // TODO: RAITA-273 Review if this can be dropped as permissions are given directly to metadata index
    this.createManagedPolicy({
      name: 'DataProcessOpenSearchHttpPolicy',
      raitaStackIdentifier,
      serviceRoles: [dataProcessStack.dataProcessorLambdaServiceRole],
      resources: [openSearchDomain.domainArn],
      actions: ['es:ESHttpGet', 'es:ESHttpPost', 'es:ESHttpPut'],
    });

    // Grant api lambdas permissions to get API-key from
    // SSM Parameterstore
    this.createManagedPolicy({
      name: 'ApiParameterStorePolicy',
      raitaStackIdentifier,
      serviceRoles: [
        raitaApiStack.raitaApiLambdaServiceRole,
        raitaApiStack.raitaApiDeleteRequestLambdaServiceRole,
        raitaApiStack.raitaApiZipRequestLambdaServiceRole,
        raitaApiStack.raitaApiGraphqlLambdaServiceRole,
      ],
      resources: [
        `arn:aws:ssm:${this.region}:${this.account}:parameter/${SSM_API_KEY}`,
      ],
      actions: ['ssm:GetParameter'],
    });

    // Grant api lambdas permissions to call OpenSearch endpoints
    // TODO: RAITA-273 Review if this can be dropped as permissions are given directly to metadata index
    this.createManagedPolicy({
      name: 'ApiOpenSearchHttpPolicy',
      raitaStackIdentifier,
      serviceRoles: [
        raitaApiStack.raitaApiLambdaServiceRole,
        raitaApiStack.raitaApiDeleteRequestLambdaServiceRole,
      ],
      resources: [openSearchDomain.domainArn],
      actions: ['es:ESHttpGet', 'es:ESHttpPost', 'es:ESHttpPut'],
    });

    // Grant api handleZipRequestLambda permission to invoke the
    // handleZipProcess lambda.
    this.createManagedPolicy({
      name: 'ApiZipProcessInvokePolicy',
      raitaStackIdentifier,
      serviceRoles: [raitaApiStack.raitaApiZipRequestLambdaServiceRole],
      resources: [raitaApiStack.handleZipProcessFn.functionArn],
      actions: ['lambda:invokeFunction'],
    });

    this.createManagedPolicy({
      name: 'GraphqlCsvGenerationInvokePolicy',
      raitaStackIdentifier,
      serviceRoles: [raitaApiStack.raitaApiGraphqlLambdaServiceRole],
      resources: [raitaApiStack.handleCsvGenerationFn.functionArn],
      actions: ['lambda:invokeFunction'],
    });

    // Allow connections to OpenSearch
    openSearchDomain.connections.allowFrom(
      raitaSecurityGroup,
      Port.tcp(443),
      'Allow connections to Opensearch from Raita Security group.',
    );

    // TODO: This can be likely simplified by assigning Default Raita
    // serity group to below lambdas - allowFrom calls should become unnecessary
    // (Jira 207)
    // Allow traffic from lambdas to OpenSearch
    openSearchDomain.connections.allowFrom(
      dataProcessStack.handleInspectionFileEventFn,
      Port.allTraffic(),
      'Allows parser lambda to connect to Opensearch.',
    );
    openSearchDomain.connections.allowFrom(
      raitaApiStack.handleFilesRequestFn,
      Port.allTraffic(),
      'Allows parser lambda to connect to Opensearch.',
    );
    openSearchDomain.connections.allowFrom(
      raitaApiStack.handleMetaRequestFn,
      Port.allTraffic(),
      'Allows meta endpoint handler lambda to connect to Opensearch.',
    );
    openSearchDomain.connections.allowFrom(
      raitaApiStack.handleDeleteRequestFn,
      Port.allTraffic(),
      'Allows delete endpoint handler lambda to connect to Opensearch.',
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
    return new opensearch.Domain(this, domainName, {
      domainName,
      version: opensearch.EngineVersion.OPENSEARCH_1_3,
      enableVersionUpgrade: true,
      nodeToNodeEncryption: true,
      enforceHttps: true,
      vpc,
      encryptionAtRest: {
        enabled: true,
      },
      ...getEnvDependentOsConfiguration(raitaEnv, vpc.privateSubnets),
      // See RAITA-231 for removing wildcard permissions from AnyPrincipal
      accessPolicies: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['es:ESHttp*'],
          principals: [new iam.AnyPrincipal()],
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
    serviceRoles: Array<iam.Role>;
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
