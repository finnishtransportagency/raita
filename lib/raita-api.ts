import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Duration, NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { Role } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { LambdaTarget } from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import * as path from 'path';
import { RaitaEnvironment } from './config';
import { createRaitaServiceRole } from './raitaResourceCreators';
import { Domain } from 'aws-cdk-lib/aws-opensearchservice';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

interface RaitaApiStackProps extends NestedStackProps {
  readonly raitaStackIdentifier: string;
  readonly raitaEnv: RaitaEnvironment;
  readonly stackId: string;
  readonly jwtTokenIssuer: string;
  readonly inspectionDataBucket: Bucket;
  readonly openSearchMetadataIndex: string;
  readonly vpc: ec2.IVpc;
  readonly openSearchDomain: Domain;
  readonly cloudfrontDomainName: string;
}

type ListenerTargetLambdas = {
  lambda: NodejsFunction;
  /** Must be a unique integer for each. Lowest number is prioritized */
  priority: number;
  path: [string];
  targetName: string;
};

/**
 * TODO: Assess lambda role requirements and implement least privilege
 */
export class RaitaApiStack extends NestedStack {
  public readonly raitaApiLambdaServiceRole: Role;
  public readonly handleFilesRequestFn: NodejsFunction;
  public readonly handleMetaRequestFn: NodejsFunction;
  public readonly alb: cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: RaitaApiStackProps) {
    super(scope, id, props);
    const {
      raitaStackIdentifier,
      raitaEnv,
      stackId,
      jwtTokenIssuer,
      openSearchMetadataIndex,
      vpc,
      inspectionDataBucket,
      openSearchDomain,
      cloudfrontDomainName,
    } = props;

    this.raitaApiLambdaServiceRole = createRaitaServiceRole({
      scope: this,
      name: 'RaitaApiLambdaServiceRole',
      servicePrincipal: 'lambda.amazonaws.com',
      policyName: 'service-role/AWSLambdaVPCAccessExecutionRole',
      raitaStackIdentifier,
    });
    // Write permission is needed here (the Write part in ReadWrite) as it adds POST permissions to
    // the metadata index. RaitaApiLambdaServiceRole does not need to make any
    // data modifications to metadata index but under the hood the client from
    // @opensearch-project/opensearch utilizes POST to retrieve data from the index.
    openSearchDomain.grantIndexReadWrite(
      openSearchMetadataIndex,
      this.raitaApiLambdaServiceRole,
    );
    inspectionDataBucket.grantRead(this.raitaApiLambdaServiceRole);

    // Create handler lambdas
    const handleFileRequestFn = this.createFileRequestHandler({
      name: 'api-handler-file',
      raitaStackIdentifier,
      raitaEnv,
      stackId,
      jwtTokenIssuer,
      lambdaRole: this.raitaApiLambdaServiceRole,
      dataBucket: inspectionDataBucket,
      vpc,
    });

    const handleImagesRequestFn = this.createImagesRequestHandler({
      name: 'api-handler-images',
      raitaStackIdentifier,
      raitaEnv,
      stackId,
      jwtTokenIssuer,
      lambdaRole: this.raitaApiLambdaServiceRole,
      dataBucket: inspectionDataBucket,
      vpc,
    });

    this.handleFilesRequestFn = this.createFilesRequestHandler({
      name: 'api-handler-files',
      raitaStackIdentifier,
      raitaEnv,
      stackId,
      jwtTokenIssuer,
      lambdaRole: this.raitaApiLambdaServiceRole,
      openSearchDomainEndpoint: openSearchDomain.domainEndpoint,
      openSearchMetadataIndex,
      vpc,
    });

    this.handleMetaRequestFn = this.createMetaRequestHandler({
      name: 'api-handler-meta',
      raitaStackIdentifier,
      raitaEnv,
      stackId,
      jwtTokenIssuer,
      lambdaRole: this.raitaApiLambdaServiceRole,
      openSearchDomainEndpoint: openSearchDomain.domainEndpoint,
      openSearchMetadataIndex,
      vpc,
    });

    const handleReturnLogin = this.createReturnLoginHandler({
      name: 'api-handler-return-login',
      raitaStackIdentifier,
      raitaEnv,
      stackId,
      jwtTokenIssuer,
      cloudfrontDomainName,
      lambdaRole: this.raitaApiLambdaServiceRole,
      vpc,
    });

    /**
     * Add all lambdas to alb targets
     * 200-series if for lambdas accessing S3 information and
     * 300-series is for database access lambdas
     */
    const albLambdaTargets: ListenerTargetLambdas[] = [
      {
        lambda: handleFileRequestFn,
        priority: 200,
        path: ['/api/file'],
        targetName: 'file',
      },
      {
        lambda: handleImagesRequestFn,
        priority: 210,
        path: ['/api/images'],
        targetName: 'images',
      },
      {
        lambda: this.handleFilesRequestFn,
        priority: 300,
        path: ['/api/files'],
        targetName: 'files',
      },
      {
        lambda: this.handleMetaRequestFn,
        priority: 310,
        path: ['/api/meta'],
        targetName: 'meta',
      },
      {
        lambda: handleReturnLogin,
        priority: 400,
        path: ['/api/return-login'],
        targetName: 'return-login',
      },
    ];

    // ALB for API
    this.alb = this.createlAlb({
      raitaStackIdentifier: raitaStackIdentifier,
      name: 'raita-api',
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
    vpc: ec2.IVpc;
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
    const targets = listenerTargets.map(target =>
      listener.addTargets(`target-${target.targetName}`, {
        targets: [new LambdaTarget(target.lambda)],
        priority: target.priority,
        conditions: [elbv2.ListenerCondition.pathPatterns(target.path)],
      }),
    );
    return alb;
  }

  /**
   * Creates and returns handler for generating presigned urls
   */
  private createFileRequestHandler({
    name,
    raitaStackIdentifier,
    raitaEnv,
    stackId,
    jwtTokenIssuer,
    dataBucket,
    lambdaRole,
    vpc,
  }: {
    name: string;
    raitaStackIdentifier: string;
    raitaEnv: string;
    stackId: string;
    jwtTokenIssuer: string;
    dataBucket: Bucket;
    lambdaRole: Role;
    vpc: ec2.IVpc;
  }) {
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 1024,
      timeout: Duration.seconds(5),
      runtime: Runtime.NODEJS_16_X,
      handler: 'handleFileRequest',
      entry: path.join(
        __dirname,
        `../backend/lambdas/raitaApi/handleFileRequest/handleFileRequest.ts`,
      ),
      environment: {
        DATA_BUCKET: dataBucket.bucketName,
        JWT_TOKEN_ISSUER: jwtTokenIssuer,
        STACK_ID: stackId,
        ENVIRONMENT: raitaEnv,
      },
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnets: vpc.privateSubnets,
      },
      logRetention: RetentionDays.SIX_MONTHS,
    });
  }

  /**
   * Creates and returns handler for listing images related to a file
   */
  private createImagesRequestHandler({
    name,
    raitaStackIdentifier,
    raitaEnv,
    stackId,
    jwtTokenIssuer,
    lambdaRole,
    dataBucket,
    vpc,
  }: {
    name: string;
    raitaStackIdentifier: string;
    raitaEnv: string;
    stackId: string;
    jwtTokenIssuer: string;
    lambdaRole: Role;
    dataBucket: Bucket;
    vpc: ec2.IVpc;
  }) {
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 512,
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'handleImagesRequest',
      entry: path.join(
        __dirname,
        `../backend/lambdas/raitaApi/handleImagesRequest/handleImagesRequest.ts`,
      ),
      environment: {
        DATA_BUCKET: dataBucket.bucketName,
        JWT_TOKEN_ISSUER: jwtTokenIssuer,
        STACK_ID: stackId,
        ENVIRONMENT: raitaEnv,
      },
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnets: vpc.privateSubnets,
      },
      logRetention: RetentionDays.SIX_MONTHS,
    });
  }

  /**
   * Creates and returns handler for querying files
   */
  private createFilesRequestHandler({
    name,
    raitaStackIdentifier,
    raitaEnv,
    stackId,
    jwtTokenIssuer,
    lambdaRole,
    openSearchDomainEndpoint,
    openSearchMetadataIndex,
    vpc,
  }: {
    name: string;
    raitaStackIdentifier: string;
    raitaEnv: string;
    stackId: string;
    jwtTokenIssuer: string;
    lambdaRole: Role;
    openSearchDomainEndpoint: string;
    openSearchMetadataIndex: string;
    vpc: ec2.IVpc;
  }) {
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'handleFilesRequest',
      entry: path.join(
        __dirname,
        `../backend/lambdas/raitaApi/handleFilesRequest/handleFilesRequest.ts`,
      ),
      environment: {
        OPENSEARCH_DOMAIN: openSearchDomainEndpoint,
        METADATA_INDEX: openSearchMetadataIndex,
        REGION: this.region,
        JWT_TOKEN_ISSUER: jwtTokenIssuer,
        STACK_ID: stackId,
        ENVIRONMENT: raitaEnv,
      },
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnets: vpc.privateSubnets,
      },
      logRetention: RetentionDays.SIX_MONTHS,
    });
  }

  /**
   * Creates and returns handler for meta information
   */
  private createMetaRequestHandler({
    name,
    raitaStackIdentifier,
    raitaEnv,
    stackId,
    jwtTokenIssuer,
    lambdaRole,
    openSearchDomainEndpoint,
    openSearchMetadataIndex,
    vpc,
  }: {
    name: string;
    raitaStackIdentifier: string;
    raitaEnv: string;
    stackId: string;
    jwtTokenIssuer: string;
    lambdaRole: Role;
    openSearchDomainEndpoint: string;
    openSearchMetadataIndex: string;
    vpc: ec2.IVpc;
  }) {
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 512,
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'handleMetaRequest',
      entry: path.join(
        __dirname,
        `../backend/lambdas/raitaApi/handleMetaRequest/handleMetaRequest.ts`,
      ),
      environment: {
        OPENSEARCH_DOMAIN: openSearchDomainEndpoint,
        METADATA_INDEX: openSearchMetadataIndex,
        REGION: this.region,
        JWT_TOKEN_ISSUER: jwtTokenIssuer,
        STACK_ID: stackId,
        ENVIRONMENT: raitaEnv,
      },
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnets: vpc.privateSubnets,
      },
      logRetention: RetentionDays.SIX_MONTHS,
    });
  }
  private createReturnLoginHandler({
    name,
    raitaStackIdentifier,
    raitaEnv,
    stackId,
    jwtTokenIssuer,
    cloudfrontDomainName,
    lambdaRole,
    vpc,
  }: {
    name: string;
    raitaStackIdentifier: string;
    raitaEnv: string;
    stackId: string;
    jwtTokenIssuer: string;
    cloudfrontDomainName: string;
    lambdaRole: Role;
    vpc: ec2.IVpc;
  }) {
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 256,
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'handleRequest',
      entry: path.join(
        __dirname,
        `../backend/lambdas/raitaApi/handleReturnLogin/handleReturnLogin.ts`,
      ),
      environment: {
        JWT_TOKEN_ISSUER: jwtTokenIssuer,
        STACK_ID: stackId,
        ENVIRONMENT: raitaEnv,
        CLOUDFRONT_DOMAIN_NAME: cloudfrontDomainName,
      },
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnets: vpc.privateSubnets,
      },
      logRetention: RetentionDays.SIX_MONTHS,
    });
  }
}
