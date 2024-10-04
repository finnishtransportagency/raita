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

interface ConversionProcessStackProps extends NestedStackProps {
  readonly raitaStackIdentifier: string;
  readonly raitaEnv: RaitaEnvironment;
  readonly stackId: string;
  readonly vpc: IVpc;
  readonly prismaLambdaLayer: lambda.LayerVersion;
}

export class ConversionProcessStack extends NestedStack {
  public readonly conversionProcessLambdaRole: iam.Role;

  constructor(
    scope: Construct,
    id: string,
    props: ConversionProcessStackProps,
  ) {
    super(scope, id, props);
    const { raitaStackIdentifier, raitaEnv, stackId, vpc, prismaLambdaLayer } =
      props;

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
    const conversionQueue = new Queue(this, 'geoviite-conversion-queue');

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

    conversionQueue.grantSendMessages(startConversionProcessHandler);
    // TODO: how to trigger lambda?
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
      timeout: cdk.Duration.seconds(300), // TODO: what is a maximum realistic running time?
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handleStartConversionProcess',
      entry: path.join(
        __dirname,
        `../backend/lambdas/conversionProcess/handleStartConversionProcess/handleStartConversionProcess.ts`,
      ),
      reservedConcurrentExecutions: 1, // only one process can be running at once to avoid processing files multiple times
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
}
