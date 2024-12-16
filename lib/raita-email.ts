import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Duration, NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
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

interface EmailStackProps extends NestedStackProps {
  readonly raitaStackIdentifier: string;
  readonly raitaEnv: RaitaEnvironment;
  readonly stackId: string;
  readonly vpc: IVpc;
  readonly prismaLambdaLayer: lambda.LayerVersion;
  readonly inspectionDataBucket: Bucket;
}

export class EmailProcessStack extends NestedStack {
  public readonly dataProcessorLambdaServiceRole: iam.Role;
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

    // Create lambda for emailing errors
    const handleErrorEmailEventFn = this.createErrorEmailHandler({
      name: 'dp-handler-error-email-transportation',
      lambdaRole: this.dataProcessorLambdaServiceRole,
      raitaStackIdentifier,
      vpc,
      databaseEnvironmentVariables,
      prismaLambdaLayer,
    });

    // Create Lambda for emailing reports
    const handleReportEmailEventFn = this.createReportEmailHandler({
      name: 'dp-handler-report-email-transportation',
      lambdaRole: this.dataProcessorLambdaServiceRole,
      raitaStackIdentifier,
      vpc,
      databaseEnvironmentVariables,
      prismaLambdaLayer,
    });
  }
  private createErrorEmailHandler({
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
    const emailTransportHandler = new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 1500,
      timeout: Duration.seconds(180),
      runtime: Runtime.NODEJS_20_X,
      handler: 'handleErrorEmailEvent',
      entry: path.join(
        __dirname,
        `../backend/lambdas/email/handleErrorEmailEvent/handleErrorEmailEvent.ts`,
      ),
      environment: {
        REGION: this.region,
        RAITA_STACK_ID: raitaStackIdentifier,
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
    // Create an EventBridge rule to trigger the Lambda weekly
    const weeklyRule = new events.Rule(this, `${name}WeeklyScheduleRule`, {
      schedule: events.Schedule.cron({
        minute: '0', // At the 0th minute
        hour: '8', // At 8:00 AM
        weekDay: '1', // On Monday (1 represents Monday)
      }),
    });

    // Add the Lambda as the target of the rule
    weeklyRule.addTarget(new targets.LambdaFunction(emailTransportHandler));
    return emailTransportHandler;
  }
  private createReportEmailHandler({
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
    const emailTransportHandler = new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 1500,
      timeout: Duration.seconds(180),
      runtime: Runtime.NODEJS_20_X,
      handler: 'handleReportEmailEvent',
      entry: path.join(
        __dirname,
        `../backend/lambdas/email/handleReportEmailEvent/handleReportEmailEvent.ts`,
      ),
      environment: {
        REGION: this.region,
        RAITA_STACK_ID: raitaStackIdentifier,
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
    // Create an EventBridge rule to trigger the Lambda weekly
    const weeklyRule = new events.Rule(this, `${name}WeeklyScheduleRule`, {
      schedule: events.Schedule.cron({
        minute: '0', // At the 0th minute
        hour: '8', // At 8:00 AM
        weekDay: '1', // On Monday (1 represents Monday)
      }),
    });

    // Add the Lambda as the target of the rule
    weeklyRule.addTarget(new targets.LambdaFunction(emailTransportHandler));
    return emailTransportHandler;
  }
}
