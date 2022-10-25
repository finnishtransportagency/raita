import { Duration, NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { Role } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as path from 'path';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { RaitaEnvironment } from './config';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { LambdaTarget } from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';

interface RaitaApiStackProps extends NestedStackProps {
  readonly raitaStackIdentifier: string;
  readonly raitaEnv: RaitaEnvironment;
  readonly dataBucket: Bucket;
  readonly lambdaServiceRole: Role;
  readonly userPool: UserPool;
  readonly openSearchDomainEndpoint: string;
  readonly openSearchMetadataIndex: string;
  readonly vpc: ec2.Vpc;
}

type ListenerTargetLambdas = {
  lambda: NodejsFunction;
  /** Must be a unique integer for each. Lowest number is prioritized */
  priority: number;
  path: [string];
};

/**
 * TODO: Assess lambda role requirements and implement least privilege
 */
export class RaitaApiStack extends NestedStack {
  constructor(scope: Construct, id: string, props: RaitaApiStackProps) {
    super(scope, id, props);
    const {
      raitaStackIdentifier,
      lambdaServiceRole,
      openSearchDomainEndpoint,
      openSearchMetadataIndex,
      vpc,
    } = props;

    // Create handler lambdas
    const urlGeneratorFn = this.createS3urlGenerator({
      name: 'file-access-handler',
      raitaStackIdentifier,
      lambdaRole: lambdaServiceRole,
      dataBucket: props.dataBucket,
      vpc,
    });
    const osQueryHandlerFn = this.createOpenSearchQueryHandler({
      name: 'os-query-handler',
      raitaStackIdentifier,
      lambdaRole: lambdaServiceRole,
      openSearchDomainEndpoint,
      openSearchMetadataIndex,
      vpc,
    });

    // Add all lambdas here to add as alb targets
    const albLambdaTargets: ListenerTargetLambdas[] = [
      { lambda: urlGeneratorFn, priority: 90, path: ['/file'] },
      { lambda: osQueryHandlerFn, priority: 100, path: ['/files'] },
    ];

    // ALB for API
    const alb = this.createlAlb({
      raitaStackIdentifier: raitaStackIdentifier,
      name: 'api',
      vpc,
      listenerTargets: albLambdaTargets,
    });
  }

  /**
   * Creates application load balancer
   */
  private createlAlb({
    raitaStackIdentifier,
    name,
    vpc,
    listenerTargets,
  }: {
    raitaStackIdentifier: string;
    name: string;
    vpc: ec2.Vpc;
    listenerTargets: ListenerTargetLambdas[];
  }) {
    const alb = new elbv2.ApplicationLoadBalancer(this, name, {
      loadBalancerName: `alb-${raitaStackIdentifier}-${name}`,
      internetFacing: false,
      vpc,
    });
    const listener = alb.addListener('raita-listener', {
      port: 80,
      defaultAction: elbv2.ListenerAction.fixedResponse(404),
    });
    const targets = listenerTargets.map((target, index) =>
      listener.addTargets(`target-${index}`, {
        targets: [new LambdaTarget(target.lambda)],
        priority: target.priority,
        conditions: [elbv2.ListenerCondition.pathPatterns(target.path)],
      }),
    );
  }

  /**
   * Creates and returns lambda function for generating presigned urls
   */
  private createS3urlGenerator({
    name,
    raitaStackIdentifier,
    dataBucket,
    lambdaRole,
    vpc,
  }: {
    name: string;
    raitaStackIdentifier: string;
    dataBucket: Bucket;
    lambdaRole: Role;
    vpc: ec2.Vpc;
  }) {
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 1024,
      timeout: Duration.seconds(5),
      runtime: Runtime.NODEJS_16_X,
      handler: 'handleFileRequest',
      entry: path.join(
        __dirname,
        `../backend/lambdas/handleFileRequest/handleFileRequest.ts`,
      ),
      environment: {
        DATA_BUCKET: dataBucket.bucketName,
      },
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });
  }

  /**
   * Creates and returns OpenSearchQuery handler
   */
  private createOpenSearchQueryHandler({
    name,
    raitaStackIdentifier,
    lambdaRole,
    openSearchDomainEndpoint,
    openSearchMetadataIndex,
    vpc,
  }: {
    name: string;
    raitaStackIdentifier: string;
    lambdaRole: Role;
    openSearchDomainEndpoint: string;
    openSearchMetadataIndex: string;
    vpc: ec2.Vpc;
  }) {
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'handleOpenSearchQuery',
      entry: path.join(
        __dirname,
        `../backend/lambdas/handleOpenSearchQuery/handleOpenSearchQuery.ts`,
      ),
      environment: {
        OPENSEARCH_DOMAIN: openSearchDomainEndpoint,
        METADATA_INDEX: openSearchMetadataIndex,
        REGION: this.region,
      },
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });
  }
}
