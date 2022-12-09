import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { Role } from 'aws-cdk-lib/aws-iam';
import { Port } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { RaitaEnvironment } from './config';
import { getRemovalPolicy, isDevelopmentMainStack } from './utils';
import { RaitaApiStack } from './raita-api';
import { DataProcessStack } from './raita-data-process';
import { BastionStack } from './raita-bastion';

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
      cloudfrontDomainName,
    } = props;

    // Create and configure OpenSearch domain
    const openSearchDomain = this.createOpenSearchDomain({
      name: 'db',
      raitaEnv,
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
    const raitaApiStack = new RaitaApiStack(this, 'stack-api', {
      inspectionDataBucket: dataProcessStack.inspectionDataBucket,
      openSearchDomain: openSearchDomain,
      raitaEnv,
      stackId,
      jwtTokenIssuer,
      raitaStackIdentifier: raitaStackIdentifier,
      openSearchMetadataIndex: openSearchMetadataIndex,
      cloudfrontDomainName: cloudfrontDomainName,
      vpc,
    });

    // Create Bastion Host for dev
    if (isDevelopmentMainStack(stackId, raitaEnv)) {
      const bastionStack = new BastionStack(this, 'stack-bastion', {
        raitaStackIdentifier,
        vpc,
        securityGroup: raitaSecurityGroup,
        albDns: raitaApiStack.alb.loadBalancerDnsName,
        databaseDomainEndpoint: openSearchDomain.domainEndpoint,
      });

      /**
       * Create a policy granting bastion host (role) the permissions
       * to make calls to OpenSearch endpoints
       * NOTE 1: See Jira issue 231.
       */
      this.createManagedPolicy({
        name: 'BastionOpenSearchHttpPolicy',
        raitaStackIdentifier,
        serviceRoles: [bastionStack.bastionRole],
        resources: [openSearchDomain.domainArn],
        actions: ['es:ESHttpGet', 'es:ESHttpPost', 'es:ESHttpPut'],
      });
    }

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
      serviceRoles: [raitaApiStack.raitaApiLambdaServiceRole],
      resources: [openSearchDomain.domainArn],
      actions: ['es:ESHttpGet', 'es:ESHttpPost', 'es:ESHttpPut'],
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
    return new opensearch.Domain(this, domainName, {
      domainName,
      version: opensearch.EngineVersion.OPENSEARCH_1_3,
      enableVersionUpgrade: true,
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
