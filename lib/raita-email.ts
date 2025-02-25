import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Duration, NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import * as path from 'path';
import { Construct } from 'constructs';
import { DatabaseEnvironmentVariables, RaitaEnvironment } from './config';

import {
  getDatabaseEnvironmentVariables,
  prismaBundlingOptions,
} from './utils';
import { createRaitaServiceRole } from './raitaResourceCreators';

interface EmailStackProps extends NestedStackProps {
  readonly raitaStackIdentifier: string;
  readonly raitaEnv: RaitaEnvironment;
  readonly stackId: string;
  readonly vpc: IVpc;
  readonly prismaLambdaLayer: lambda.LayerVersion;
  readonly inspectionDataBucket: Bucket;
  readonly emailSenderAddress: string;
  readonly smtpEndpoint: string;
}

export class EmailProcessStack extends NestedStack {
  public readonly emailLambdaServiceRole: iam.Role;
  public readonly handleErrorEmailEventFn: NodejsFunction;
  public readonly handleReportEmailEventFn: NodejsFunction;

  constructor(scope: Construct, id: string, props: EmailStackProps) {
    super(scope, id, props);
    const {
      raitaStackIdentifier,
      raitaEnv,
      stackId,
      vpc,
      prismaLambdaLayer,
      emailSenderAddress,
      smtpEndpoint,
    } = props;

    const databaseEnvironmentVariables = getDatabaseEnvironmentVariables(
      stackId,
      raitaEnv,
    );
    this.emailLambdaServiceRole = createRaitaServiceRole({
      scope: this,
      name: 'EmailLambdaServiceRole',
      servicePrincipal: 'lambda.amazonaws.com',
      policyName: 'service-role/AWSLambdaVPCAccessExecutionRole',
      raitaStackIdentifier,
    });

    // Create lambda for emailing errors
    const handleErrorReportEmailFn = this.createErrorReportEmailHandler({
      name: 'dp-handler-error-email-transportation',
      lambdaRole: this.emailLambdaServiceRole,
      raitaStackIdentifier,
      raitaEnv,
      vpc,
      databaseEnvironmentVariables,
      prismaLambdaLayer,
      emailSenderAddress,
      smtpEndpoint,
    });

    // send notification weekly: monday 08:00
    const weeklyRule = new events.Rule(
      this,
      `error-report-email-schedule-rule`,
      {
        schedule: events.Schedule.cron({
          minute: '0',
          // time zone is seemingly not supported by the CDK yet, this is in UTC meaning it will change with winter/summer time
          hour: '6',
          weekDay: '2', // week starts at sunday, 2 = monday
        }),
      },
    );
    weeklyRule.addTarget(new targets.LambdaFunction(handleErrorReportEmailFn));

    this.emailLambdaServiceRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ssm:GetParameter', 'secretsmanager:GetSecretValue'],
        resources: ['*'], // TODO: specify keys?
      }),
    );
  }
  private createErrorReportEmailHandler({
    name,
    lambdaRole,
    raitaStackIdentifier,
    raitaEnv,
    vpc,
    databaseEnvironmentVariables,
    prismaLambdaLayer,
    emailSenderAddress,
    smtpEndpoint,
  }: {
    name: string;
    lambdaRole: iam.Role;
    raitaStackIdentifier: string;
    raitaEnv: RaitaEnvironment;
    vpc: IVpc;
    databaseEnvironmentVariables: DatabaseEnvironmentVariables;
    prismaLambdaLayer: lambda.LayerVersion;
    emailSenderAddress: string;
    smtpEndpoint: string;
  }) {
    const sendEmailHandler = new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 1024,
      timeout: Duration.seconds(180),
      runtime: Runtime.NODEJS_20_X,
      handler: 'handleErrorReportEmail',
      entry: path.join(
        __dirname,
        `../backend/lambdas/email/handleErrorReportEmail/handleErrorReportEmail.ts`,
      ),
      environment: {
        REGION: this.region,
        RAITA_ENV: raitaEnv,
        VERIFIED_SENDER_ADDRESS: emailSenderAddress,
        SMTP_ENDPOINT: smtpEndpoint,
        ...databaseEnvironmentVariables,
      },
      role: lambdaRole,
      vpc,
      bundling: prismaBundlingOptions,
      layers: [prismaLambdaLayer],
      vpcSubnets: {
        subnets: vpc.privateSubnets,
      },
    });

    return sendEmailHandler;
  }
}
