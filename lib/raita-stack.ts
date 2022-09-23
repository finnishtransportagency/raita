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

export class RaitaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const applicationPrefix = 'raita-analysis';

    // Create buckets
    // TODO: Plan flexible bucket and configuration structure & naming to account for possible other source systems
    const dataBucket = this.createBucket('mermec-data');
    const configurationBucket = this.createBucket('mermec-configuration');

    // Create Cognito user and identity pools
    const userPool = this.createUserPool(applicationPrefix);
    const idPool = this.createIdentityPool(applicationPrefix);

    // Create roles
    const esLimitedUserRole = this.createUserRole(idPool, 'esLimitedUserRole');
    const esAdminUserRole = this.createUserRole(idPool, 'esAdminUserRole');
    const openSearchServiceRole = this.createServiceRole(
      'openSearchServiceRole',
      'es.amazonaws.com',
      'AmazonESCognitoAccess',
    );
    const lambdaServiceRole = this.createServiceRole(
      'lambdaServiceRole',
      'lambda.amazonaws.com',
      'service-role/AWSLambdaBasicExecutionRole',
    );

    // Create Cognito user groups
    this.createAdminUserGroup(userPool.userPoolId, esAdminUserRole.roleArn);
    this.createLimitedUserGroup(userPool.userPoolId, esLimitedUserRole.roleArn);

    // Create and configure OpenSearch domain
    // TODO: Might warrant refactor
    const openSearchDomain = this.createOpenSearchDomain({
      domainName: 'raita-base',
      cognitoIdPool: idPool,
      cognitoOpenSearchServiceRole: openSearchServiceRole,
      cognitoUserPool: userPool,
      masterUserRole: lambdaServiceRole,
    });

    // Create a ManagedPolicy that allows admin role and lambda role to call
    // open search endpoints
    const openSearchHttpPolicy = new ManagedPolicy(
      this,
      'openSearchHttpPolicy',
      {
        roles: [esAdminUserRole, lambdaServiceRole],
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
      applicationPrefix,
      esDomain: openSearchDomain,
      esLimitedUserRole: openSearchServiceRole,
    });

    // Create parser lambda
    const handleMermecFileEvents = this.createParserLambda({
      name: 'mermec-parser',
      sourceBuckets: [dataBucket],
      openSearchDomainEndpoint: openSearchDomain.domainEndpoint,
      configurationBucketName: configurationBucket.bucketName,
      lambdaRole: lambdaServiceRole,
    });
    // Configure the mapping between OS roles and AWS roles (a.k.a. backend roles)
    this.configureOpenSearchRoleMapping({
      lambdaServiceRole,
      esAdminUserRole,
      esLimitedUserRole,
      openSearchDomain,
    });
    // Grant lambda read to configuration bucket
    configurationBucket.grantRead(handleMermecFileEvents);
  }

  /**
   * Creates the parser lambda and add S3 buckets as event sources,
   * granting lambda read access to these buckets
   */
  private createParserLambda({
    name,
    sourceBuckets,
    openSearchDomainEndpoint,
    configurationBucketName,
    lambdaRole,
  }: {
    name: string;
    sourceBuckets: Array<cdk.aws_s3.Bucket>;
    openSearchDomainEndpoint: string;
    configurationBucketName: string;
    lambdaRole: Role;
  }) {
    const parser = new NodejsFunction(this, name, {
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'handleMermecFileEvents',
      entry: path.join(__dirname, `../lambda/mermecParser/mermecParser.ts`),
      environment: {
        OPENSEARCH_DOMAIN: openSearchDomainEndpoint,
        CONFIGURATION_BUCKET: configurationBucketName,
        // TODO: Temporarily hard coded
        REGION: 'eu-west-1',
      },
      role: lambdaRole,
    });
    sourceBuckets.forEach(bucket => {
      // OPEN: Figure out if some filtering can be applied alredy
      // at this level with filter property
      parser.addEventSource(
        new S3EventSource(bucket, {
          events: [s3.EventType.OBJECT_CREATED, s3.EventType.OBJECT_REMOVED],
        }),
      );
      bucket.grantRead(parser);
    });
    return parser;
  }

  /**
   * Creates OpenSearch domain
   */
  private createOpenSearchDomain({
    domainName,
    cognitoIdPool,
    cognitoOpenSearchServiceRole,
    cognitoUserPool,
    masterUserRole,
  }: {
    domainName: string;
    cognitoIdPool: CfnIdentityPool;
    cognitoOpenSearchServiceRole: Role;
    cognitoUserPool: UserPool;
    masterUserRole: Role;
  }) {
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
    // TODO: Configure removalPolicy as environment dependent
    return new opensearch.Domain(this, domainName, {
      version: opensearch.EngineVersion.OPENSEARCH_1_0,
      ebs: {
        volumeSize: 10,
        volumeType: ec2.EbsDeviceVolumeType.GENERAL_PURPOSE_SSD,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
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
   * Creates a user pool.
   * TODO: This setup is likely removed in the future as this is Raita specific user pool
   * TODO: Configure removalPolicy as environment dependent
   */
  private createUserPool(applicationPrefix: string) {
    const userPool = new UserPool(this, applicationPrefix + 'UserPool', {
      userPoolName: applicationPrefix + ' User Pool',
      selfSignUpEnabled: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      signInAliases: {
        username: true,
        email: true,
      },
    });
    userPool.addDomain('cognitoDomain', {
      cognitoDomain: {
        domainPrefix: applicationPrefix,
      },
    });
    return userPool;
  }

  /**
   * TODO: Configure removalPolicy as environment dependent AND autoDeleteObjects
   */
  private createBucket(bucketName: string) {
    return new s3.Bucket(this, bucketName, {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
  }

  private createIdentityPool(applicationPrefix: string) {
    return new CfnIdentityPool(this, applicationPrefix + 'IdentityPool', {
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [],
    });
  }

  private createServiceRole(
    identifier: string,
    servicePrincipal: string,
    policyName: string,
  ) {
    return new Role(this, identifier, {
      assumedBy: new ServicePrincipal(servicePrincipal),
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName(policyName)],
    });
  }

  private createUserRole(idPool: CfnIdentityPool, identifier: string) {
    return new Role(this, identifier, {
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

  private createLimitedUserGroup(
    userPoolId: string,
    limitedUserRoleArn: string,
  ) {
    new CfnUserPoolGroup(this, 'userPoolLimitedGroupPool', {
      userPoolId: userPoolId,
      groupName: 'es-limited-users',
      roleArn: limitedUserRoleArn,
    });
  }

  private createAdminUserGroup(userPoolId: string, adminUserRoleArn: string) {
    new CfnUserPoolGroup(this, 'userPoolAdminGroupPool', {
      userPoolId: userPoolId,
      groupName: 'es-admins',
      roleArn: adminUserRoleArn,
    });
  }

  /**
   * A magical method based on example from
   * https://github.com/aws-samples/amazon-elasticsearch-service-with-cognito
   */
  private configureIdentityPool({
    userPool,
    identityPool,
    applicationPrefix,
    esDomain,
    esLimitedUserRole,
  }: {
    userPool: cdk.aws_cognito.UserPool;
    identityPool: cdk.aws_cognito.CfnIdentityPool;
    applicationPrefix: string;
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
          `ClientId-${applicationPrefix}`,
        ),
      },
    });
    userPoolClients.node.addDependency(esDomain);
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
    esAdminUserRole,
    esLimitedUserRole,
    openSearchDomain,
  }: {
    lambdaServiceRole: Role;
    esAdminUserRole: Role;
    esLimitedUserRole: Role;
    openSearchDomain: cdk.aws_opensearchservice.Domain;
  }) {
    // Create lambda for sending requests to OpenSearch API
    const esRequestsFn = new NodejsFunction(this, 'esRequestsFn', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'sendOpenSearchAPIRequest',
      entry: path.join(__dirname, `../lambda/osRequests/osRequests.ts`),
      timeout: cdk.Duration.seconds(30),
      role: lambdaServiceRole,
      environment: {
        OPENSEARCH_DOMAIN: openSearchDomain.domainEndpoint,
      },
    });

    const esRequestProvider = new Provider(this, 'esRequestProvider', {
      onEventHandler: esRequestsFn,
    });

    // TODO: Add API call for esLimitedRole
    new CustomResource(this, 'esRequestsResource', {
      serviceToken: esRequestProvider.serviceToken,
      properties: {
        requests: [
          {
            method: 'PUT',
            path: '/_plugins/_security/api/rolesmapping/all_access',
            body: {
              backend_roles: [
                esAdminUserRole.roleArn,
                lambdaServiceRole.roleArn,
              ],
              hosts: [],
              users: [],
            },
          },
        ],
      },
    });
  }
}
