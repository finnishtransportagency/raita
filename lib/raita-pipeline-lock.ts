import { Duration, NestedStack, NestedStackProps } from 'aws-cdk-lib';
import {
  CodePipelineActionFactoryResult,
  ICodePipelineActionFactory,
  ProduceActionOptions,
  Step,
} from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { DatabaseEnvironmentVariables, getPipelineConfig } from './config';
import { IStage } from 'aws-cdk-lib/aws-codepipeline';
import { Effect, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';
import { getDatabaseEnvironmentVariables } from './utils';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { LambdaInvokeAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import path from 'path';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { createRaitaServiceRole } from './raitaResourceCreators';

interface PipelineLockStack extends NestedStackProps {
  readonly vpc: ec2.IVpc;
}
/**
 * The stack for funtions that acquire and release data process lock for pipeline
 */
export class RaitaPipelineLockStack extends NestedStack {
  private acquireLockFn: IFunction;
  private releaseLockFn: IFunction;
  public acquireLockStep: Step;
  public releaseLockStep: Step;
  constructor(scope: Construct, id: string, props: PipelineLockStack) {
    const config = getPipelineConfig();
    super(scope, `raita-pipeline-lock-stack-${config.stackId}`, {
      ...props,
    });
    const databaseEnvironmentVariables = getDatabaseEnvironmentVariables(
      config.stackId,
      config.env,
    );
    const raitaStackIdentifier = `raita-${config.env}-${config.stackId}`;

    const lambdaLockServiceRole = createRaitaServiceRole({
      scope: this,
      name: 'RaitaPipelineLockLambdaServiceRole',
      servicePrincipal: 'lambda.amazonaws.com',
      policyName: 'service-role/AWSLambdaVPCAccessExecutionRole',
      raitaStackIdentifier,
    });

    lambdaLockServiceRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: ['*'],
      }),
    );
    lambdaLockServiceRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'codepipeline:PutJobSuccessResult',
          'codepipeline:PutJobFailureResult',
        ],
        resources: ['*'],
      }),
    );
    this.acquireLockFn = this.createAcquireLockFunction({
      name: 'acquire-pipeline-lock',
      vpc: props.vpc,
      raitaStackIdentifier,
      databaseEnvironmentVariables,
      lambdaRole: lambdaLockServiceRole,
    });
    this.acquireLockStep = new RaitaLambdaStep(
      'AcquireLockStep',
      this.acquireLockFn,
    );
    this.releaseLockFn = this.createReleaseLockFunction({
      name: 'release-pipeline-lock',
      vpc: props.vpc,
      raitaStackIdentifier,
      databaseEnvironmentVariables,
      lambdaRole: lambdaLockServiceRole,
    });
    this.releaseLockStep = new RaitaLambdaStep(
      'ReleaseLockStep',
      this.releaseLockFn,
    );
  }

  private createAcquireLockFunction({
    name,
    lambdaRole,
    raitaStackIdentifier,
    vpc,
    databaseEnvironmentVariables,
  }: {
    name: string;
    lambdaRole: Role;
    raitaStackIdentifier: string;
    vpc: ec2.IVpc;
    databaseEnvironmentVariables: DatabaseEnvironmentVariables;
  }) {
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 256,
      timeout: Duration.seconds(15),
      runtime: Runtime.NODEJS_20_X,
      handler: 'handleAcquirePipelineLock',
      entry: path.join(
        __dirname,
        `../backend/lambdas/pipeline/acquirePipelineLock/acquirePipelineLock.ts`,
      ),
      environment: {
        ...databaseEnvironmentVariables,
      },
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnets: vpc.privateSubnets,
      },
    });
  }
  private createReleaseLockFunction({
    name,
    lambdaRole,
    raitaStackIdentifier,
    vpc,
    databaseEnvironmentVariables,
  }: {
    name: string;
    lambdaRole: Role;
    raitaStackIdentifier: string;
    vpc: ec2.IVpc;
    databaseEnvironmentVariables: DatabaseEnvironmentVariables;
  }) {
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 256,
      timeout: Duration.seconds(15),
      runtime: Runtime.NODEJS_20_X,
      handler: 'handleReleasePipelineLock',
      entry: path.join(
        __dirname,
        `../backend/lambdas/pipeline/releasePipelineLock/releasePipelineLock.ts`,
      ),
      environment: {
        ...databaseEnvironmentVariables,
      },
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnets: vpc.privateSubnets,
      },
    });
  }
}

class RaitaLambdaStep extends Step implements ICodePipelineActionFactory {
  constructor(
    id: string,
    private readonly fn: IFunction,
  ) {
    super(id);
  }
  public produceAction(
    stage: IStage,
    options: ProduceActionOptions,
  ): CodePipelineActionFactoryResult {
    stage.addAction(
      new LambdaInvokeAction({
        actionName: options.actionName,
        runOrder: options.runOrder,
        lambda: this.fn,
      }),
    );
    return { runOrdersConsumed: 1 };
  }
}
