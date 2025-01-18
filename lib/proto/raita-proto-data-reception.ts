import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import * as path from 'path';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { LambdaTarget } from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import { DatabaseEnvironmentVariables, RaitaEnvironment } from '../config';
import { prismaBundlingOptions } from '../utils';
import { createRaitaServiceRole } from '../raitaResourceCreators';

interface DataHubStackProps extends cdk.NestedStackProps {
  readonly raitaStackIdentifier: string;
  readonly vpc: ec2.IVpc;
  readonly securityGroup: ec2.ISecurityGroup;
  readonly raitaEnv: RaitaEnvironment;
  readonly dataReceptionBucket: Bucket;
}

type ListenerTargetLambdas = {
  lambda: NodejsFunction;
  /** Must be a unique integer for each. Lowest number is prioritized */
  priority: number;
  path: [string];
  targetName: string;
};

export class DataReceptionStack extends cdk.NestedStack {
  readonly bastionRole: Role;
  public readonly alb: cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: DataHubStackProps) {
    super(scope, id, props);
    const {
      raitaStackIdentifier,
      vpc,
      securityGroup,
      raitaEnv,
      dataReceptionBucket,
    } = props;

    const dataReceptionRole: Role = createRaitaServiceRole({
      scope: this,
      name: 'RaitaProtoDataHubServiceRole',
      servicePrincipal: 'lambda.amazonaws.com',
      policyName: 'service-role/AWSLambdaVPCAccessExecutionRole',
      raitaStackIdentifier,
    });

    dataReceptionBucket.grantReadWrite(dataReceptionRole);

    const handleIncomingData = this.createHandleIncomingDataFunction({
      name: 'proto-data-input-handler',
      lambdaRole: dataReceptionRole,
      raitaStackIdentifier,
      vpc,
      raitaEnv,
      dataReceptionBucket,
    });

    const apiBaseUrl = '/api';
    const albLambdaTargets: ListenerTargetLambdas[] = [
      {
        lambda: handleIncomingData,
        priority: 100,
        path: [`${apiBaseUrl}/input`],
        targetName: 'user',
      },
    ];

    this.alb = this.createAlb({
      raitaStackIdentifier: raitaStackIdentifier,
      name: 'raita-proto-data-hub-api',
      vpc,
      listenerTargets: albLambdaTargets,
    });
  }

  private createHandleIncomingDataFunction({
    name,
    lambdaRole,
    raitaStackIdentifier,
    vpc,
    raitaEnv,
    dataReceptionBucket,
  }: {
    name: string;
    lambdaRole: iam.Role;
    raitaStackIdentifier: string;
    vpc: IVpc;
    raitaEnv: string;
    dataReceptionBucket: Bucket;
  }) {
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(300), // TODO: what is a maximum realistic running time?
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handleDataReceptionInput',
      entry: path.join(
        __dirname,
        `../../backend/lambdas/proto/dataReceptionAPI/handleDataReceptionInput.ts`,
      ),
      environment: {
        REGION: this.region,
        ENVIRONMENT: raitaEnv,
        DATA_BUCKET: dataReceptionBucket.bucketName,
        // ...databaseEnvironmentVariables,
      },
      bundling: prismaBundlingOptions,
      // layers: [prismaLambdaLayer],
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnets: vpc.privateSubnets,
      },
    });
  }
  private createAlb({
    raitaStackIdentifier,
    name,
    vpc,
    listenerTargets,
  }: {
    raitaStackIdentifier: string;
    name: string;
    vpc: ec2.IVpc;
    listenerTargets: ListenerTargetLambdas[];
  }) {
    const alb = new elbv2.ApplicationLoadBalancer(this, name, {
      loadBalancerName: `alb-${raitaStackIdentifier}-${name}`,
      internetFacing: false,
      vpc,
    });
    const listener = alb.addListener('raita-proto-reception-api-listener', {
      port: 80,
      defaultAction: elbv2.ListenerAction.fixedResponse(404),
    });
    const targets = listenerTargets.map(target =>
      listener.addTargets(`target-${target.targetName}`, {
        targets: [new LambdaTarget(target.lambda)],
        priority: target.priority,
        conditions: [elbv2.ListenerCondition.pathPatterns(target.path)],
      }),
    );
    return alb;
  }
}
