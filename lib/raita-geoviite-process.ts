import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import * as path from 'path';
import { Construct } from 'constructs';
import { DatabaseEnvironmentVariables, RaitaEnvironment } from './config';
import { createRaitaServiceRole } from './raitaResourceCreators';
import {
  getDatabaseEnvironmentVariables,
  prismaBundlingOptions,
} from './utils';

import { Queue } from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { FilterPattern, ILogGroup } from 'aws-cdk-lib/aws-logs';
import {
  Alarm,
  ComparisonOperator,
  Stats,
  TreatMissingData,
} from 'aws-cdk-lib/aws-cloudwatch';

interface ConversionProcessStackProps extends NestedStackProps {
  readonly raitaStackIdentifier: string;
  readonly raitaEnv: RaitaEnvironment;
  readonly stackId: string;
  readonly vpc: IVpc;
  readonly prismaLambdaLayer: lambda.LayerVersion;
  readonly geoviiteHostname: string;
  readonly readyForGeoviiteConversionQueue: Queue;
}

export class ConversionProcessStack extends NestedStack {
  public readonly conversionProcessLambdaRole: iam.Role;

  constructor(
    scope: Construct,
    id: string,
    props: ConversionProcessStackProps,
  ) {
    super(scope, id, props);
    const {
      raitaStackIdentifier,
      raitaEnv,
      stackId,
      vpc,
      prismaLambdaLayer,
      geoviiteHostname,
      readyForGeoviiteConversionQueue,
    } = props;

    const databaseEnvironmentVariables = getDatabaseEnvironmentVariables(
      stackId,
      raitaEnv,
    );

    this.conversionProcessLambdaRole = createRaitaServiceRole({
      scope: this,
      name: 'ConversionProcessLambdaServiceRole',
      servicePrincipal: 'lambda.amazonaws.com',
      policyName: 'service-role/AWSLambdaVPCAccessExecutionRole',
      raitaStackIdentifier,
    });

    this.conversionProcessLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: ['*'], // TODO: specify keys?
      }),
    );

    // TODO is duplicate protection needed?
    const conversionQueue = new Queue(this, 'geoviite-conversion-queue', {
      visibilityTimeout: cdk.Duration.minutes(15),
      retentionPeriod: cdk.Duration.days(7),
      fifo: true,
    });

    const startConversionProcessHandler =
      this.createStartConversionProcessFunction({
        name: 'start-conversion-process-handler',
        lambdaRole: this.conversionProcessLambdaRole,
        raitaStackIdentifier,
        vpc,
        raitaEnv,
        databaseEnvironmentVariables,
        prismaLambdaLayer,
        conversionQueue,
      });

    startConversionProcessHandler.addEventSource(
      new SqsEventSource(readyForGeoviiteConversionQueue, {
        batchSize: 1,
        maxConcurrency: 2,
      }),
    );

    const doConversionProcessHandler = this.createDoGeoviiteConversionFunction({
      name: 'geoviite-conversion-process-handler',
      lambdaRole: this.conversionProcessLambdaRole,
      raitaStackIdentifier,
      vpc,
      raitaEnv,
      databaseEnvironmentVariables,
      prismaLambdaLayer,
      conversionQueue,
      geoviiteHostname,
    });

    const coversionQueueSource = new SqsEventSource(conversionQueue, {
      batchSize: 1,
      maxConcurrency: 2, // TODO: is there a way to avoid having multiple invocations at the same time? minimum value here is 1
    });

    conversionQueue.grantSendMessages(startConversionProcessHandler);
    doConversionProcessHandler.addEventSource(coversionQueueSource);

    this.createStartConversionProcessAlarms(
      startConversionProcessHandler.logGroup,
      raitaStackIdentifier,
    );
    this.createDoConversionProcessAlarms(
      doConversionProcessHandler.logGroup,
      raitaStackIdentifier,
    );
  }

  /**
   * Create lambda handler for starting the conversion process.
   * This will read files from database and put them to conversionQuueue to wait for processings
   */
  private createStartConversionProcessFunction({
    name,
    lambdaRole,
    raitaStackIdentifier,
    vpc,
    raitaEnv,
    databaseEnvironmentVariables,
    prismaLambdaLayer,
    conversionQueue,
  }: {
    name: string;
    lambdaRole: iam.Role;
    raitaStackIdentifier: string;
    vpc: IVpc;
    raitaEnv: string;
    databaseEnvironmentVariables: DatabaseEnvironmentVariables;
    prismaLambdaLayer: lambda.LayerVersion;
    conversionQueue: Queue;
  }) {
    const deadLetterQueue = new Queue(
      this,
      'conversion-process-start-deadletter',
    );
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(900), // TODO: what is a maximum realistic running time?
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handleStartConversionProcess',
      entry: path.join(
        __dirname,
        `../backend/lambdas/conversionProcess/handleStartConversionProcess/handleStartConversionProcess.ts`,
      ),
      reservedConcurrentExecutions: 2, // TODO: this needs to be minimum 2 when processing queue. Need to ensure files are not handled twice if triggered manually?
      environment: {
        CONVERSION_QUEUE_URL: conversionQueue.queueUrl,
        REGION: this.region,
        ENVIRONMENT: raitaEnv,

        ...databaseEnvironmentVariables,
      },
      bundling: prismaBundlingOptions,
      layers: [prismaLambdaLayer],
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnets: vpc.privateSubnets,
      },
      deadLetterQueue,
    });
  }

  private createDoGeoviiteConversionFunction({
    name,
    lambdaRole,
    raitaStackIdentifier,
    vpc,
    raitaEnv,
    databaseEnvironmentVariables,
    prismaLambdaLayer,
    conversionQueue,
    geoviiteHostname,
  }: {
    name: string;
    lambdaRole: iam.Role;
    raitaStackIdentifier: string;
    vpc: IVpc;
    raitaEnv: string;
    databaseEnvironmentVariables: DatabaseEnvironmentVariables;
    prismaLambdaLayer: lambda.LayerVersion;
    conversionQueue: Queue;
    geoviiteHostname: string;
  }) {
    const deadLetterQueue = new Queue(this, 'do-conversion-process-deadletter');
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(900), // TODO: what is a maximum realistic running time?
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handleGeoviiteConversionProcess',
      entry: path.join(
        __dirname,
        `../backend/lambdas/conversionProcess/handleGeoviiteConversionProcess/handleGeoviiteConversionProcess.ts`,
      ),
      reservedConcurrentExecutions: 2, // TODO: how many parallel invocations to use?
      environment: {
        GEOVIITE_HOSTNAME: geoviiteHostname,
        CONVERSION_QUEUE_URL: conversionQueue.queueUrl,
        REGION: this.region,
        ENVIRONMENT: raitaEnv,
        ...databaseEnvironmentVariables,
      },
      bundling: prismaBundlingOptions,
      layers: [prismaLambdaLayer],
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnets: vpc.privateSubnets,
      },
      deadLetterQueue,
    });
  }

  private createStartConversionProcessAlarms(
    logGroup: ILogGroup,
    raitaStackIdentifier: string,
  ) {
    const errorMetricFilter = logGroup.addMetricFilter(
      'start-conversion-process-error-filter',
      {
        filterPattern: FilterPattern.stringValue('$.level', '=', 'error'),
        metricName: `start-conversion-process-error-${raitaStackIdentifier}`,
        metricNamespace: 'raita-conversion-process',
        metricValue: '1',
      },
    );
    const errorAlarm = new Alarm(
      this,
      'start-conversion-process-errors-alarm',
      {
        comparisonOperator:
          ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: TreatMissingData.NOT_BREACHING,
        alarmName: `start-conversion-process-errors-alarm-${raitaStackIdentifier}`,
        metric: errorMetricFilter.metric({
          label: `Conversion process start errors ${raitaStackIdentifier}`,
          period: cdk.Duration.days(1),
          statistic: Stats.SUM,
        }),
      },
    );
    return [errorAlarm];
  }
  private createDoConversionProcessAlarms(
    logGroup: ILogGroup,
    raitaStackIdentifier: string,
  ) {
    const errorMetricFilter = logGroup.addMetricFilter(
      'do-conversion-process-error-filter',
      {
        filterPattern: FilterPattern.stringValue('$.level', '=', 'error'),
        metricName: `do-conversion-process-error-${raitaStackIdentifier}`,
        metricNamespace: 'raita-conversion-process',
        metricValue: '1',
      },
    );
    const errorAlarm = new Alarm(this, 'do-conversion-process-errors-alarm', {
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      alarmName: `do-conversion-process-errors-alarm-${raitaStackIdentifier}`,
      metric: errorMetricFilter.metric({
        label: `Conversion process function errors ${raitaStackIdentifier}`,
        period: cdk.Duration.days(1),
        statistic: Stats.SUM,
      }),
    });
    return [errorAlarm];
  }
}
