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
}

export class EmailProcessStack extends NestedStack {
  public readonly emailLambdaServiceRole: iam.Role;
  public readonly handleErrorEmailEventFn: NodejsFunction;
  public readonly handleReportEmailEventFn: NodejsFunction;

  constructor(scope: Construct, id: string, props: EmailStackProps) {
    super(scope, id, props);
    const { raitaStackIdentifier, raitaEnv, stackId, vpc, prismaLambdaLayer } =
      props;

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
      vpc,
      databaseEnvironmentVariables,
      prismaLambdaLayer,
    });

    // Create an EventBridge rule to trigger the Lambda weekly
    // const weeklyRule = new events.Rule(this, `${name}WeeklyScheduleRule`, {
    //   schedule: events.Schedule.cron({
    //     minute: '0', // At the 0th minute
    //     hour: '8', // At 8:00 AM
    //     weekDay: '1', // On Monday (1 represents Monday)
    //   }),
    // });
    // weeklyRule.addTarget(new targets.LambdaFunction(handleErrorReportEmailFn));

    //  const identity = new ses.CfnIdentity(this, 'Identity', {
    //    identityName: senderEmail,
    //  });

    //  const policy = new iam.PolicyDocument({
    //    statements: [
    //      new iam.PolicyStatement({
    //        effect: iam.Effect.ALLOW,
    //        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
    //        resources: ['*'],
    //        conditions: {
    //          StringEquals: {
    //            'ses:FromAddress': verifiedEmail,
    //          },
    //        },
    //      }),
    //    ],
    //  });

    //  new ses.CfnIdentityPolicy(this, 'IdentityPolicy', {
    //    identity: identity.ref,
    //    policy: policy.toJSON(),
    //  });

    // this.emailLambdaServiceRole.addToPolicy(
    //   new iam.PolicyStatement({
    //     effect: iam.Effect.ALLOW,
    //     actions: ['ssm:GetParameter', 'secretsmanager:GetSecretValue'],
    //     resources: ['*'], // TODO: specify keys?
    //   }),
    // );
  }
  private createErrorReportEmailHandler({
    name,
    lambdaRole,
    raitaStackIdentifier,
    vpc,
    databaseEnvironmentVariables,
    prismaLambdaLayer,
  }: {
    name: string;
    lambdaRole: iam.Role;
    raitaStackIdentifier: string;
    vpc: IVpc;
    databaseEnvironmentVariables: DatabaseEnvironmentVariables;
    prismaLambdaLayer: lambda.LayerVersion;
  }) {
    const sendEmailHandler = new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 1500,
      timeout: Duration.seconds(180),
      runtime: Runtime.NODEJS_20_X,
      handler: 'handleErrorReportEmail',
      entry: path.join(
        __dirname,
        `../backend/lambdas/email/handleErrorReportEmail/handleErrorReportEmail.ts`,
      ),
      environment: {
        REGION: this.region,
        RAITA_STACK_ID: raitaStackIdentifier,
        VERIFIED_SENDER_ADDRESS: 'TODO',
        RECEIVER_ADDRESS_LIST: 'TODO,ASD',
        SMTP_ENDPOINT: 'TODO',
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
