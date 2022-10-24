import { Stack, StackProps, CfnJson, CustomResource } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { S3EventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import {
  CfnIdentityPool,
  UserPool,
  CfnIdentityPoolRoleAttachment,
  CfnUserPoolGroup,
} from 'aws-cdk-lib/aws-cognito';
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  PhysicalResourceId,
  Provider,
} from 'aws-cdk-lib/custom-resources';
import {
  ManagedPolicy,
  Role,
  ServicePrincipal,
  AnyPrincipal,
  Effect,
  PolicyStatement,
  FederatedPrincipal,
} from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';
import { RaitaGatewayStack } from './raita-gateway';
import { getRaitaStackConfig, RaitaEnvironment } from './config';
import {
  fileSuffixesToIncudeInMetadataParsing,
  RaitaSourceSystem,
} from '../constants';
import { getRemovalPolicy, isPermanentStack } from './utils';
import { CloudfrontStack } from './raita-cloudfront';
import { RaitaApiStack } from './raita-api';

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
    // Use stackId as cognitoDomainPrefix
    const cognitoDomainPrefix = this.#raitaStackIdentifier;

    // OPEN: Move to parameter store?
    const config = getRaitaStackConfig(this);

    // Create buckets
    const dataBucket = this.createBucket({
      name: 'parser-input-data',
      raitaEnv,
    });
    const configurationBucket = this.createBucket({
      name: 'parser-configuration-data',
      raitaEnv,
    });

    // Create Cognito user and identity pools
    const userPool = this.createUserPool({
      name: 'opensearch-pool',
      cognitoDomainPrefix: cognitoDomainPrefix,
      raitaEnv,
    });
    const idPool = this.createIdentityPool('opensearch');

    // Create roles
    const osAdminUserRole = this.createUserRole(
      idPool,
      'OpenSearchAdminUserRole',
    );
    const openSearchServiceRole = this.createServiceRole(
      'OpenSearchServiceRole',
      'es.amazonaws.com',
      'AmazonESCognitoAccess',
    );
    const lambdaServiceRole = this.createServiceRole(
      'LambdaServiceRole',
      'lambda.amazonaws.com',
      'service-role/AWSLambdaVPCAccessExecutionRole',
    );

    // Create Cognito user groups
    this.createAdminUserGroup({
      name: 'admins',
      userPool: userPool,
      adminUserRole: osAdminUserRole,
    });

    const raitaVPC = new ec2.Vpc(this, `raita-vpc`, {
      vpcName: `vpc-${this.#raitaStackIdentifier}`,
      // cidr: "10.0.0.0/16",
      // maxAzs: 3,
      // natGateways: 1,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // Create and configure OpenSearch domain
    const openSearchDomain = this.createOpenSearchDomain({
      name: 'raita',
      cognitoIdPool: idPool,
      cognitoOpenSearchServiceRole: openSearchServiceRole,
      cognitoUserPool: userPool,
      masterUserRole: lambdaServiceRole,
      raitaEnv: props.raitaEnv,
    });

    // Create a ManagedPolicy that allows admin role and lambda role to call
    // open search endpoints
    // TODO: Least privileges approach to lambda service roles (separate roles for lambdas calling OpenSearch?)
    const openSearchHttpPolicy = new ManagedPolicy(
      this,
      `managedpolicy-${this.#raitaStackIdentifier}-openSearchHttpPolicy`,
      {
        roles: [osAdminUserRole, lambdaServiceRole],
      },
    );
    openSearchHttpPolicy.addStatements(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: [openSearchDomain.domainArn],
        actions: ['es:ESHttpPost', 'es:ESHttpGet', 'es:ESHttpPut'],
      }),
    );

    this.configureIdentityPool({
      userPool: userPool,
      identityPool: idPool,
      cognitoDomainPrefix: cognitoDomainPrefix,
      esDomain: openSearchDomain,
      esLimitedUserRole: openSearchServiceRole,
    });

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
      raitaSourceSystems: config.raitaSourceSystems,
    });

    // Configure the mapping between OS roles and AWS roles (a.k.a. backend roles)
    this.configureOpenSearchRoleMapping({
      lambdaServiceRole,
      osAdminUserRole: osAdminUserRole,
      openSearchDomain,
    });

    // Create API Gateway
    new RaitaApiStack(this, 'stack-api', {
      dataBucket,
      lambdaServiceRole,
      userPool,
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

    // Grant lambda read to configuration bucket
    configurationBucket.grantRead(metadataParserFn);
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
    raitaSourceSystems,
  }: {
    name: string;
    sourceBuckets: Array<cdk.aws_s3.Bucket>;
    openSearchDomainEndpoint: string;
    configurationBucketName: string;
    configurationFile: string;
    lambdaRole: Role;
    openSearchMetadataIndex: string;
    region: string;
    raitaSourceSystems: Array<RaitaSourceSystem>;
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
    cognitoIdPool,
    cognitoOpenSearchServiceRole,
    cognitoUserPool,
    masterUserRole,
    raitaEnv,
  }: {
    name: string;
    cognitoIdPool: CfnIdentityPool;
    cognitoOpenSearchServiceRole: Role;
    cognitoUserPool: UserPool;
    masterUserRole: Role;
    raitaEnv: RaitaEnvironment;
  }) {
    const domainName = `${name}-${this.#raitaStackIdentifier}`;

    // TODO: Check if asterisk can be dropped out
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
      useUnsignedBasicAuth: true,
      fineGrainedAccessControl: {
        masterUserArn: masterUserRole.roleArn,
      },
      cognitoDashboardsAuth: {
        identityPoolId: cognitoIdPool.ref,
        role: cognitoOpenSearchServiceRole,
        userPoolId: cognitoUserPool.userPoolId,
      },
      // TODO: Define least privileges access policy here
      accessPolicies: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['es:ESHttp*'],
          principals: [new AnyPrincipal(), masterUserRole],
          resources: [domainArn],
        }),
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

  private createIdentityPool(name: string) {
    return new CfnIdentityPool(this, name, {
      identityPoolName: `identitypool-${this.#raitaStackIdentifier}-${name}`,
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [],
    });
  }

  private createUserPool({
    name,
    cognitoDomainPrefix,
    raitaEnv,
  }: {
    name: string;
    cognitoDomainPrefix: string;
    raitaEnv: RaitaEnvironment;
  }) {
    const userPool = new UserPool(this, name, {
      userPoolName: `userpool-${this.#raitaStackIdentifier}-${name}`,
      selfSignUpEnabled: false,
      removalPolicy: getRemovalPolicy(raitaEnv),
      signInAliases: {
        username: true,
        email: true,
      },
    });
    userPool.addDomain('cognitoDomain', {
      cognitoDomain: {
        domainPrefix: cognitoDomainPrefix,
      },
    });
    return userPool;
  }

  private createServiceRole(
    name: string,
    servicePrincipal: string,
    policyName: string,
  ) {
    return new Role(this, name, {
      roleName: `${name}-${this.#raitaStackIdentifier}`,
      assumedBy: new ServicePrincipal(servicePrincipal),
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName(policyName)],
    });
  }

  private createUserRole(idPool: CfnIdentityPool, name: string) {
    return new Role(this, name, {
      roleName: `${name}-${this.#raitaStackIdentifier}`,
      assumedBy: new FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: { 'cognito-identity.amazonaws.com:aud': idPool.ref },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
    });
  }

  private createAdminUserGroup({
    name,
    userPool,
    adminUserRole,
  }: {
    name: string;
    userPool: UserPool;
    adminUserRole: Role;
  }) {
    new CfnUserPoolGroup(this, name, {
      groupName: `${name}-${this.#raitaStackIdentifier}`,
      userPoolId: userPool.userPoolId,
      roleArn: adminUserRole.roleArn,
    });
  }

  /**
   * A magical method based on example from
   * https://github.com/aws-samples/amazon-elasticsearch-service-with-cognito
   */
  private configureIdentityPool({
    userPool,
    identityPool,
    cognitoDomainPrefix,
    esDomain,
    esLimitedUserRole,
  }: {
    userPool: cdk.aws_cognito.UserPool;
    identityPool: cdk.aws_cognito.CfnIdentityPool;
    cognitoDomainPrefix: string;
    esDomain: cdk.aws_opensearchservice.Domain;
    esLimitedUserRole: Role;
  }) {
    // Get the userPool clientId
    const userPoolClients = new AwsCustomResource(this, 'clientIdResource', {
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: [userPool.userPoolArn],
      }),
      onCreate: {
        service: 'CognitoIdentityServiceProvider',
        action: 'listUserPoolClients',
        parameters: {
          UserPoolId: userPool.userPoolId,
        },
        physicalResourceId: PhysicalResourceId.of(
          `ClientId-${cognitoDomainPrefix}`,
        ),
      },
    });
    userPoolClients.node.addDependency(esDomain);
    userPoolClients.node.addDependency(userPool);
    const clientId = userPoolClients.getResponseField(
      'UserPoolClients.0.ClientId',
    );

    // Attach userPoolId to identityPool
    const providerName = `cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}:${clientId}`;
    new CfnIdentityPoolRoleAttachment(this, 'userPoolRoleAttachment', {
      identityPoolId: identityPool.ref,
      roles: {
        authenticated: esLimitedUserRole.roleArn,
      },
      roleMappings: new CfnJson(this, 'roleMappingsJson', {
        value: {
          [providerName]: {
            Type: 'Token',
            AmbiguousRoleResolution: 'AuthenticatedRole',
          },
        },
      }),
    });
  }

  private configureOpenSearchRoleMapping({
    lambdaServiceRole,
    osAdminUserRole,
    openSearchDomain,
  }: {
    lambdaServiceRole: Role;
    osAdminUserRole: Role;
    openSearchDomain: cdk.aws_opensearchservice.Domain;
  }) {
    // Create lambda for sending requests to OpenSearch API
    const osRequestsFnName = 'handle-os-request';
    const osRequestsFn = new NodejsFunction(this, osRequestsFnName, {
      functionName: `lambda-${this.#raitaStackIdentifier}-${osRequestsFnName}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'sendOpenSearchAPIRequest',
      entry: path.join(
        __dirname,
        `../backend/lambdas/osRequests/osRequests.ts`,
      ),
      timeout: cdk.Duration.seconds(30),
      role: lambdaServiceRole,
      environment: {
        OPENSEARCH_DOMAIN_ENDPOINT: openSearchDomain.domainEndpoint,
        REGION: this.region,
      },
    });

    const esRequestProvider = new Provider(this, 'esRequestProvider', {
      onEventHandler: osRequestsFn,
    });

    const esRequests = new CustomResource(this, 'esRequestsResource', {
      serviceToken: esRequestProvider.serviceToken,
      properties: {
        requests: [
          {
            method: 'PUT',
            path: '/_plugins/_security/api/rolesmapping/all_access',
            body: {
              backend_roles: [
                osAdminUserRole.roleArn,
                lambdaServiceRole.roleArn,
              ],
              hosts: [],
              users: [],
            },
          },
        ],
      },
    });
    esRequests.node.addDependency(openSearchDomain);
  }
}
