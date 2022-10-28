import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RaitaApiStack } from './raita-api';
import { RaitaCloudfrontStack } from './raita-cloudfront';
import { getRaitaStackConfig, RaitaEnvironment } from './config';
import { isPermanentStack } from './utils';
import { RaitaDataProcessStack } from './raita-data-process';
import { RaitaDatabaseStack } from './raita-database';
import { Role } from 'aws-cdk-lib/aws-iam';
import { Port } from 'aws-cdk-lib/aws-ec2';
import { FrontendStack } from './raita-frontend';

interface RaitaStackProps extends StackProps {
  readonly raitaEnv: RaitaEnvironment;
  readonly stackId: string;
}

export class RaitaStack extends Stack {
  #raitaStackIdentifier: string;

  constructor(scope: Construct, id: string, props: RaitaStackProps) {
    super(scope, id, props);
    this.#raitaStackIdentifier = id.toLowerCase();
    const { raitaEnv, stackId } = props;
    const config = getRaitaStackConfig(this);

    // Create vpc
    const raitaVPC = new ec2.Vpc(this, `raita-vpc`, {
      vpcName: `vpc-${this.#raitaStackIdentifier}`,
      cidr: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // Add s3 Gateway enpoint to allow for lambda access to s3
    const s3GatewayEndpoint = raitaVPC.addGatewayEndpoint('s3-endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    // Create databases resources
    const dbStack = new RaitaDatabaseStack(this, 'stack-db', {
      raitaStackIdentifier: this.#raitaStackIdentifier,
      raitaEnv,
      vpc: raitaVPC,
    });

    // Create data processing resources
    const dataProcessStack = new RaitaDataProcessStack(
      this,
      'stack-dataprocess',
      {
        raitaStackIdentifier: this.#raitaStackIdentifier,
        raitaEnv,
        vpc: raitaVPC,
        openSearchDomain: dbStack.openSearchDomain,
        openSearchMetadataIndex: config.openSearchMetadataIndex,
        parserConfigurationFile: config.parserConfigurationFile,
      },
    );

    // Create API Gateway
    const raitaApi = new RaitaApiStack(this, 'stack-api', {
      inspectionDataBucket: dataProcessStack.inspectionDataBucket,
      openSearchDomain: dbStack.openSearchDomain,
      raitaEnv,
      raitaStackIdentifier: this.#raitaStackIdentifier,
      openSearchMetadataIndex: config.openSearchMetadataIndex,
      vpc: raitaVPC,
    });

    const frontendStack = new FrontendStack(this, 'stack-fe', {
      raitaEnv,
      raitaStackIdentifier: this.#raitaStackIdentifier,
    });

    // Grant data processor lambdas permissions to call OpenSearch endpoints
    this.createManagedPolicy({
      name: 'DataProcessOpenSearchHttpPolicy',
      serviceRoles: [dataProcessStack.dataProcessorlambdaServiceRole],
      resources: [dbStack.openSearchDomain.domainArn],
      actions: ['es:ESHttpGet', 'es:ESHttpPost', 'es:ESHttpPut'],
    });

    // Grant api lambdas permissions to call OpenSearch endpoints
    this.createManagedPolicy({
      name: 'ApiOpenSearchHttpPolicy',
      serviceRoles: [raitaApi.raitaApilambdaServiceRole],
      resources: [dbStack.openSearchDomain.domainArn],
      actions: ['es:ESHttpGet', 'es:ESHttpPost', 'es:ESHttpPut'],
    });

    // Allow traffic from lambdas to OpenSearch
    dbStack.openSearchDomain.connections.allowFrom(
      dataProcessStack.metadataParserFn,
      Port.allTraffic(),
      'Allows parser lambda to connect to Opensearch.',
    );
    dbStack.openSearchDomain.connections.allowFrom(
      raitaApi.osQueryHandlerFn,
      Port.allTraffic(),
      'Allows parser lambda to connect to Opensearch.',
    );

    // if (isPermanentStack(stackId, raitaEnv)) {
    //   new RaitaCloudfrontStack(this, 'stack-cf', {
    //     raitaStackId: this.#raitaStackIdentifier,
    // const frontendStack = new FrontendStack(this, 'stack-fe', {
    //   raitaEnv,
    //   raitaStackIdentifier: this.#raitaStackIdentifier,
    // });

    // Create Cloudfront stack conditionally - only for main and prod stackIds
    // Feature branches do not provide access from outside
    if (isPermanentStack(stackId, raitaEnv)) {
      new RaitaCloudfrontStack(this, 'stack-cf', {
        raitaStackIdentifier: this.#raitaStackIdentifier,
        raitaEnv: raitaEnv,
        cloudfrontCertificateArn: config.cloudfrontCertificateArn,
        cloudfrontDomainName: config.cloudfrontDomainName,
        frontendBucket: frontendStack.frontendBucket,
      });
    }
  }

  private createManagedPolicy({
    name,
    serviceRoles,
    actions,
    resources,
  }: {
    name: string;
    serviceRoles: Array<Role>;
    actions: Array<string>;
    resources: Array<string>;
  }) {
    // Create a ManagedPolicy that allows lambda role to call open search endpoints
    const managedPolicy = new iam.ManagedPolicy(
      this,
      `managedpolicy-${this.#raitaStackIdentifier}-${name}`,
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
