import { Stack, StackProps, CustomResource } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { CfnIdentityPool, UserPool } from 'aws-cdk-lib/aws-cognito';
import { Provider } from 'aws-cdk-lib/custom-resources';
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

    const idPool = this.createIdentityPool(applicationPrefix);

    // Create roles
    const esAdminUserRole = this.createUserRole(idPool, 'esAdminUserRole');
    const lambdaServiceRole = this.createServiceRole(
      'lambdaServiceRole',
      'lambda.amazonaws.com',
      'service-role/AWSLambdaBasicExecutionRole',
    );

    // Create and configure OpenSearch domain
    const openSearchDomain = this.createOpenSearchDomain({
      domainName: 'raita-base',
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

    // Configure the mapping between OS roles and AWS roles (a.k.a. backend roles)
    this.configureOpenSearchRoleMapping({
      lambdaServiceRole,
      esAdminUserRole,
      openSearchDomain,
    });
  }

  /**
   * Create OpenSearch domain
   */
  private createOpenSearchDomain({
    domainName,
    masterUserRole,
  }: {
    domainName: string;

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
      // TODO: **** Define least privileges access policy here ****
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

  private configureOpenSearchRoleMapping({
    lambdaServiceRole,
    esAdminUserRole,
    openSearchDomain,
  }: {
    lambdaServiceRole: Role;
    esAdminUserRole: Role;
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
