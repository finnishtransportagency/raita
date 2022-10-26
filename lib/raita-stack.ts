import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Stack, StackProps } from 'aws-cdk-lib';
import { S3EventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
import { RaitaApiStack } from './raita-api';
import { CloudfrontStack } from './raita-cloudfront';
import { getRaitaStackConfig, RaitaEnvironment } from './config';
import { fileSuffixesToIncudeInMetadataParsing } from '../constants';
import { getRemovalPolicy, isPermanentStack } from './utils';

interface RaitaStackProps extends StackProps {
  readonly raitaEnv: RaitaEnvironment;
  readonly stackId: string;
}

export class RaitaStack extends Stack {
  #raitaStackIdentifier: string;

  constructor(scope: Construct, id: string, props: RaitaStackProps) {
    super(scope, id, props);
    const { raitaEnv, stackId } = props;
    this.#raitaStackIdentifier = id.toLowerCase();

    // OPEN: Move to parameter store?
    const config = getRaitaStackConfig(this);

    // Create buckets
    const dataBucket = createRaitaBucket({
      scope: this,
      name: 'parser-input-data',
      raitaEnv,
      raitaStackIdentifier: this.#raitaStackIdentifier,
    });

    const configurationBucket = createRaitaBucket({
      scope: this,
      name: 'parser-configuration-data',
      raitaEnv,
      raitaStackIdentifier: this.#raitaStackIdentifier,
    });

    const lambdaServiceRole = this.createServiceRole(
      'LambdaServiceRole',
      'lambda.amazonaws.com',
      'service-role/AWSLambdaVPCAccessExecutionRole',
    );

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

    // START DATA INGESTION

    // new RaitaDataIngestionStack(this, 'data-ingestion', {
    //   raitaStackIdentifier: this.#raitaStackIdentifier,
    //   raitaEnv,
    //   targetBucket: dataBucket,
    //   lambdaServiceRole,
    // });

    const dataReceptionBucket = createRaitaBucket({
      scope: this,
      name: 'data-reception',
      raitaEnv,
      raitaStackIdentifier: this.#raitaStackIdentifier,
    });

    const zipHandlerFn = this.createZipHandler({
      name: 'zip-handler',
      sourceBuckets: [dataReceptionBucket],
      targetBucket: dataBucket,
      lambdaRole: lambdaServiceRole,
      raitaStackIdentifier: this.#raitaStackIdentifier,
    });

    // END DATA INGESTION

    // Create and configure OpenSearch domain
    const openSearchDomain = this.createOpenSearchDomain({
      name: 'raitadb',
      raitaEnv: props.raitaEnv,
      vpc: raitaVPC,
    });

    // Create a ManagedPolicy that allows lambda role to call open search endpoints
    // TODO: Least privileges approach to lambda service roles (separate roles for lambdas calling OpenSearch?)
    const openSearchHttpPolicy = new iam.ManagedPolicy(
      this,
      `managedpolicy-${this.#raitaStackIdentifier}-openSearchHttpPolicy`,
      {
        roles: [lambdaServiceRole],
      },
    );
    openSearchHttpPolicy.addStatements(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: [openSearchDomain.domainArn],
        actions: ['es:ESHttpPost', 'es:ESHttpGet', 'es:ESHttpPut'],
      }),
    );

    // Create meta data parser lambda
    const metadataParserFn = this.createMetadataParser({
      name: 'metadata-parser',
      sourceBuckets: [dataBucket],
      openSearchDomainEndpoint: openSearchDomain.domainEndpoint,
      openSearchMetadataIndex: config.openSearchMetadataIndex,
      configurationBucketName: configurationBucket.bucketName,
      configurationFile: config.parserConfigurationFile,
      lambdaRole: lambdaServiceRole,
      region: this.region,
    });
    // Grant lambda read to configuration bucket
    configurationBucket.grantRead(metadataParserFn);
    // Grant lamba permissions to OpenSearch index
    openSearchDomain.grantIndexReadWrite(
      config.openSearchMetadataIndex,
      metadataParserFn,
    );

    // Create API Gateway
    new RaitaApiStack(this, 'stack-api', {
      dataBucket,
      lambdaServiceRole,
      raitaEnv,
      raitaStackIdentifier: this.#raitaStackIdentifier,
      openSearchDomainEndpoint: openSearchDomain.domainEndpoint,
      openSearchMetadataIndex: config.openSearchMetadataIndex,
      vpc: raitaVPC,
    });

    // Cloudfront stack is created conditionally - only for main and prod stackIds
    // Feature branches do not provide access from outside
    if (isPermanentStack(stackId, raitaEnv)) {
      new CloudfrontStack(this, 'stack-cf', {
        raitaStackId: this.#raitaStackIdentifier,
        raitaEnv: raitaEnv,
        cloudfrontCertificateArn: config.cloudfrontCertificateArn,
        cloudfrontDomainName: config.cloudfrontDomainName,
      });
    }
  }

  /**
   * Creates the parser lambda and add S3 buckets as event sources,
   * granting lambda read access to these buckets
   */
  private createMetadataParser({
    name,
    sourceBuckets,
    openSearchDomainEndpoint,
    configurationBucketName,
    configurationFile,
    openSearchMetadataIndex,
    lambdaRole,
    region,
  }: {
    name: string;
    sourceBuckets: Array<cdk.aws_s3.Bucket>;
    openSearchDomainEndpoint: string;
    configurationBucketName: string;
    configurationFile: string;
    lambdaRole: iam.Role;
    openSearchMetadataIndex: string;
    region: string;
  }) {
    const parser = new NodejsFunction(this, name, {
      functionName: `lambda-${this.#raitaStackIdentifier}-${name}`,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'metadataParser',
      entry: path.join(
        __dirname,
        `../backend/lambdas/metadataParser/metadataParser.ts`,
      ),
      environment: {
        OPENSEARCH_DOMAIN: openSearchDomainEndpoint,
        CONFIGURATION_BUCKET: configurationBucketName,
        CONFIGURATION_FILE: configurationFile,
        METADATA_INDEX: openSearchMetadataIndex,
        REGION: region,
      },
      role: lambdaRole,
    });

    sourceBuckets.forEach(bucket => {
      const fileSuffixes = Object.values(fileSuffixesToIncudeInMetadataParsing);
      // TODO: Currently reacts only to CREATE events
      // OPEN: Currently separate event source for each suffix type. Replace with better alternative is exists?
      fileSuffixes.forEach(suffix => {
        parser.addEventSource(
          new S3EventSource(bucket, {
            events: [s3.EventType.OBJECT_CREATED],
            filters: [
              {
                suffix,
              },
            ],
          }),
        );
      });
      bucket.grantRead(parser);
    });
    return parser;
  }

  /**
   * Creates OpenSearch domain
   */
  private createOpenSearchDomain({
    name,
    raitaEnv,
    vpc,
  }: {
    name: string;
    raitaEnv: RaitaEnvironment;
    vpc: ec2.Vpc;
  }) {
    const domainName = `${name}-${this.#raitaStackIdentifier}`;

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
      vpc,
      vpcSubnets: [
        {
          subnets: vpc.isolatedSubnets.slice(0, 1),
        },
      ],
    });
  }

  /**
   * Creates a data bucket for the stacks
   */
  private createBucket({
    name,
    raitaEnv,
  }: {
    name: string;
    raitaEnv: RaitaEnvironment;
  }) {
    return new s3.Bucket(this, name, {
      bucketName: `s3-${this.#raitaStackIdentifier}-${name}`,
      versioned: true,
      removalPolicy: getRemovalPolicy(raitaEnv),
      autoDeleteObjects: raitaEnv === 'dev' ? true : false,
    });
  }

  /**
   * Creates service role with based on AWS managed policy
   * identified by policyName
   */
  private createServiceRole(
    name: string,
    servicePrincipal: string,
    policyName: string,
  ) {
    return new iam.Role(this, name, {
      roleName: `${name}-${this.#raitaStackIdentifier}`,
      assumedBy: new iam.ServicePrincipal(servicePrincipal),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName(policyName)],
    });
  }
}
