import { Stack, StackProps, CfnJson, CustomResource } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
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
import { RaitaEnvironment } from './config';
import { getRemovalPolicy } from './utils';

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

    /**
     * START VPC
     */

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

    /**
     * END VPC
     */

    // Create and configure OpenSearch domain
    const openSearchDomain = this.createOpenSearchDomain({
      name: 'raita',
      cognitoIdPool: idPool,
      cognitoOpenSearchServiceRole: openSearchServiceRole,
      cognitoUserPool: userPool,
      masterUserRole: lambdaServiceRole,
      raitaEnv: props.raitaEnv,
      vpc: raitaVPC,
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

    // Configure the mapping between OS roles and AWS roles (a.k.a. backend roles)
    this.configureOpenSearchRoleMapping({
      lambdaServiceRole,
      osAdminUserRole: osAdminUserRole,
      openSearchDomain,
      vpc: raitaVPC,
    });
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
    vpc,
  }: {
    name: string;
    cognitoIdPool: CfnIdentityPool;
    cognitoOpenSearchServiceRole: Role;
    cognitoUserPool: UserPool;
    masterUserRole: Role;
    raitaEnv: RaitaEnvironment;
    vpc: ec2.Vpc;
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
      // useUnsignedBasicAuth: true,
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
      vpc,
      vpcSubnets: [
        {
          subnets: vpc.isolatedSubnets.slice(0, 1),
        },
      ],
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
    vpc,
  }: {
    lambdaServiceRole: Role;
    osAdminUserRole: Role;
    openSearchDomain: cdk.aws_opensearchservice.Domain;
    vpc: ec2.Vpc;
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
      vpc,
      vpcSubnets: {
        subnets: vpc.isolatedSubnets.slice(0, 1),
      },
    });

    const osRequestProvider = new Provider(this, 'os-request-provider', {
      onEventHandler: osRequestsFn,
      vpc,
      vpcSubnets: {
        subnets: vpc.isolatedSubnets.slice(0, 1),
      },
    });

    const osRequests = new CustomResource(this, 'os-requests-resource', {
      serviceToken: osRequestProvider.serviceToken,
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
    osRequests.node.addDependency(openSearchDomain);
  }
}
