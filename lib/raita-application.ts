import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Port } from 'aws-cdk-lib/aws-ec2';
import { BundlingOutput, NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RaitaEnvironment } from './config';
import { isPermanentStack, isProductionStack } from './utils';

import { RaitaApiStack } from './raita-api';
import { DataProcessStack } from './raita-data-process';
import { BastionStack } from './raita-bastion';
import { PsqlClientStack } from './raita-psql-client-ec2';
import {
  GEOVIITE_HOSTNAME_DEV,
  GEOVIITE_HOSTNAME_PROD,
  SSM_API_KEY,
} from '../constants';
import { Code, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import path from 'path';
import { ConversionProcessStack } from './raita-geoviite-process';
import { EmailProcessStack } from './raita-email';

interface ApplicationStackProps extends NestedStackProps {
  readonly raitaStackIdentifier: string;
  readonly stackId: string;
  readonly raitaEnv: RaitaEnvironment;
  readonly jwtTokenIssuer: string;
  readonly vpc: ec2.IVpc;
  readonly raitaSecurityGroup: ec2.ISecurityGroup;
  readonly parserConfigurationFile: string;
  readonly sftpPolicyAccountId: string;
  readonly sftpPolicyUserId: string;
  readonly sftpRaitaDeveloperPolicyUserId: string;
  readonly soaPolicyAccountId: string;
  readonly vaylaPolicyUserId: string;
  readonly loramPolicyUserId: string;
  readonly cloudfrontDomainName: string;
  readonly emailSenderAddress: string;
  readonly smtpEndpoint: string;
}

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
      parserConfigurationFile,
      sftpPolicyAccountId,
      sftpPolicyUserId,
      sftpRaitaDeveloperPolicyUserId,
      soaPolicyAccountId,
      vaylaPolicyUserId,
      loramPolicyUserId,
      cloudfrontDomainName,
      emailSenderAddress,
      smtpEndpoint,
    } = props;

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
      parserConfigurationFile: parserConfigurationFile,
      sftpPolicyAccountId: sftpPolicyAccountId,
      sftpPolicyUserId: sftpPolicyUserId,
      sftpRaitaDeveloperPolicyUserId: sftpRaitaDeveloperPolicyUserId,
      soaPolicyAccountId: soaPolicyAccountId,
      vaylaPolicyUserId: vaylaPolicyUserId,
      loramPolicyUserId: loramPolicyUserId,
      prismaLambdaLayer,
    });

    // Create geoviite conversion process resources
    const geoviiteHostname = isProductionStack(stackId, raitaEnv)
      ? GEOVIITE_HOSTNAME_PROD
      : GEOVIITE_HOSTNAME_DEV;

    const conversionProcessStack = new ConversionProcessStack(
      this,
      'stack-conversion-process',
      {
        raitaStackIdentifier: raitaStackIdentifier,
        raitaEnv,
        stackId,
        vpc,
        prismaLambdaLayer,
        geoviiteHostname,
        readyForGeoviiteConversionQueue:
          dataProcessStack.readyForGeoviiteConversionQueue,
      },
    );

    // Create API Gateway
    const raitaApiStack = new RaitaApiStack(this, 'stack-api', {
      inspectionDataBucket: dataProcessStack.inspectionDataBucket,
      dataReceptionBucket: dataProcessStack.dataReceptionBucket,
      csvDataBucket: dataProcessStack.csvDataBucket,
      raitaEnv,
      stackId,
      jwtTokenIssuer,
      raitaStackIdentifier: raitaStackIdentifier,
      cloudfrontDomainName: cloudfrontDomainName,
      vpc,
      raitaSecurityGroup,
      prismaLambdaLayer,
    });

    if (isPermanentStack(stackId, raitaEnv)) {
      new EmailProcessStack(this, 'stack-emailprocess', {
        raitaStackIdentifier: raitaStackIdentifier,
        inspectionDataBucket: dataProcessStack.inspectionDataBucket,
        raitaEnv,
        stackId,
        vpc,
        prismaLambdaLayer,
        emailSenderAddress,
        smtpEndpoint,
      });
    }

    // Create Bastion Host for dev (main branch/stack) and production
    if (isPermanentStack(stackId, raitaEnv)) {
      new BastionStack(this, 'stack-bastion', {
        raitaStackIdentifier,
        vpc,
        securityGroup: raitaSecurityGroup,
        albDns: raitaApiStack.alb.loadBalancerDnsName,
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
      name: 'ApiAdminLogExportGenerationInvokePolicy',
      raitaStackIdentifier,
      serviceRoles: [
        raitaApiStack.raitaApiAdminLogExportRequestLambdaServiceRole,
      ],
      resources: [raitaApiStack.handleAdminLogExportGenerationFn.functionArn],
      actions: ['lambda:invokeFunction'],
    });

    this.createManagedPolicy({
      name: 'GraphqlCsvGenerationInvokePolicy',
      raitaStackIdentifier,
      serviceRoles: [raitaApiStack.raitaApiGraphqlLambdaServiceRole],
      resources: [raitaApiStack.handleCsvGenerationFn.functionArn],
      actions: ['lambda:invokeFunction'],
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
