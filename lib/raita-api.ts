import { Duration, NestedStack, StackProps } from 'aws-cdk-lib';
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

interface RaitaApiStackProps extends StackProps {
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

    // const authorizer = new CognitoUserPoolsAuthorizer(this, 'api-authorizer', {
    //   authorizerName: `alpha-userpool-authorizer-${raitaStackIdentifier}-raita`,
    //   cognitoUserPools: [props.userPool],
    // });

    // TODO: Assess lambdaRole requirements and implement least privilege
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
    const lambdas: ListenerTargetLambdas[] = [
      { lambda: urlGeneratorFn, priority: 90, path: ['/test'] },
      { lambda: osQueryHandlerFn, priority: 100, path: ['/'] },
    ];
    // ALB for API
    const alb = this.createlAlb({
      raitaStackIdentifier: raitaStackIdentifier,
      name: 'api',
      vpc,
      listenerTargets: lambdas,
    });
  }

  /**
   * Returns lambda function that generates presigned urls
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

  private createlAlb({
    raitaStackIdentifier,
    name,
    vpc,
    internetFacing = false,
    listenerTargets,
  }: {
    raitaStackIdentifier: string;
    name: string;
    vpc: ec2.Vpc;
    listenerTargets: ListenerTargetLambdas[];
    internetFacing?: boolean;
  }) {
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      `alb-${raitaStackIdentifier}-${name}`,
      {
        vpc,
        internetFacing,
        loadBalancerName: `alb-${raitaStackIdentifier}-${name}`,
      },
    );
    const listener = alb.addListener('Listener', {
      port: 80,
      defaultAction: elbv2.ListenerAction.fixedResponse(404),
    });

    // TODO: Add each Lambda individually with unique paths
    const targets = listenerTargets.map((target, index) =>
      listener.addTargets(`Target-${index}`, {
        targets: [new LambdaTarget(target.lambda)],
        priority: target.priority,
        conditions: [elbv2.ListenerCondition.pathPatterns(target.path)],
      }),
    );
  }
}
