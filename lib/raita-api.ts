import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Duration, NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { Role } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { LambdaTarget } from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import * as path from 'path';
import { DatabaseEnvironmentVariables, RaitaEnvironment } from './config';
import {
  createRaitaBucket,
  createRaitaServiceRole,
} from './raitaResourceCreators';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import {
  getDatabaseEnvironmentVariables,
  graphqlBundlingOptions,
  isDevelopmentMainStack,
  isDevelopmentPreMainStack,
  isPermanentStack,
  prismaBundlingOptions,
} from './utils';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

interface RaitaApiStackProps extends NestedStackProps {
  readonly raitaStackIdentifier: string;
  readonly raitaEnv: RaitaEnvironment;
  readonly stackId: string;
  readonly jwtTokenIssuer: string;
  readonly inspectionDataBucket: Bucket;
  readonly dataReceptionBucket: Bucket;
  readonly csvDataBucket: Bucket;
  readonly vpc: ec2.IVpc;
  readonly cloudfrontDomainName: string;
  readonly raitaSecurityGroup: ec2.ISecurityGroup;
  prismaLambdaLayer: lambda.LayerVersion;
  readonly externalDataBucket: Bucket;
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
  public readonly raitaApiGraphqlLambdaServiceRole: Role;
  public readonly raitaApiCsvGenerationLambdaServiceRole: Role;
  public readonly raitaApiZipProcessLambdaServiceRole: Role;
  public readonly raitaApiZipRequestLambdaServiceRole: Role;
  public readonly raitaApiDeleteRequestLambdaServiceRole: Role;
  public readonly raitaApiManualDataProcessLambdaServiceRole: Role;
  public readonly handleZipProcessFn: NodejsFunction;
  public readonly handleDeleteRequestFn: NodejsFunction;
  public readonly handleManualDataProcessFn: NodejsFunction;
  public readonly handleAdminLogsRequestFn: NodejsFunction;
  public readonly handleV2GraphqlRequest: NodejsFunction;
  public readonly handleCsvGenerationFn: NodejsFunction;
  public readonly handleAdminLogsSummaryRequestFn: NodejsFunction;
  public readonly alb:
    | cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer
    | elbv2.IApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: RaitaApiStackProps) {
    super(scope, id, props);
    const {
      raitaStackIdentifier,
      raitaEnv,
      stackId,
      jwtTokenIssuer,
      vpc,
      inspectionDataBucket,
      dataReceptionBucket,
      csvDataBucket,
      cloudfrontDomainName,
      raitaSecurityGroup,
      prismaLambdaLayer,
      externalDataBucket,
    } = props;

    const databaseEnvironmentVariables = getDatabaseEnvironmentVariables(
      stackId,
      raitaEnv,
    );
    // Create a bucket to hold the data of user made
    // collections as a zip. Set lifecycle policy to delete
    // the objects in 7 days
    const dataCollectionBucket = createRaitaBucket({
      scope: this,
      name: 'data-collection',
      raitaEnv,
      raitaStackIdentifier,
    });
    dataCollectionBucket.addLifecycleRule({
      expiration: cdk.Duration.days(7),
    });

    // ZipProcesser needs rights to two buckets so it gets its
    // own role with proper permissions.
    this.raitaApiZipProcessLambdaServiceRole = createRaitaServiceRole({
      scope: this,
      name: 'RaitaApiZipProcessLambdaServiceRole',
      servicePrincipal: 'lambda.amazonaws.com',
      policyName: 'service-role/AWSLambdaVPCAccessExecutionRole',
      raitaStackIdentifier,
    });
    inspectionDataBucket.grantRead(this.raitaApiZipProcessLambdaServiceRole);
    dataCollectionBucket.grantReadWrite(
      this.raitaApiZipProcessLambdaServiceRole,
    );

    // Zip request function needs permission to invoke another lambda,
    // and access to datacollection bucket
    this.raitaApiZipRequestLambdaServiceRole = createRaitaServiceRole({
      scope: this,
      name: 'RaitaApiZipRequestLambdaServiceRole',
      servicePrincipal: 'lambda.amazonaws.com',
      policyName: 'service-role/AWSLambdaVPCAccessExecutionRole',
      raitaStackIdentifier,
    });
    dataCollectionBucket.grantReadWrite(
      this.raitaApiZipRequestLambdaServiceRole,
    );

    this.raitaApiLambdaServiceRole = createRaitaServiceRole({
      scope: this,
      name: 'RaitaApiLambdaServiceRole',
      servicePrincipal: 'lambda.amazonaws.com',
      policyName: 'service-role/AWSLambdaVPCAccessExecutionRole',
      raitaStackIdentifier,
    });

    this.raitaApiGraphqlLambdaServiceRole = createRaitaServiceRole({
      scope: this,
      name: 'RaitaApiGraphqlLambdaServiceRole',
      servicePrincipal: 'lambda.amazonaws.com',
      policyName: 'service-role/AWSLambdaVPCAccessExecutionRole',
      raitaStackIdentifier,
    });

    this.raitaApiCsvGenerationLambdaServiceRole = createRaitaServiceRole({
      scope: this,
      name: 'RaitaApiCsvGenerationLambdaServiceRole',
      servicePrincipal: 'lambda.amazonaws.com',
      policyName: 'service-role/AWSLambdaVPCAccessExecutionRole',
      raitaStackIdentifier,
    });
    dataCollectionBucket.grantReadWrite(
      this.raitaApiCsvGenerationLambdaServiceRole,
    );
    this.raitaApiCsvGenerationLambdaServiceRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: ['*'], // TODO. specify keys?
      }),
    );

    inspectionDataBucket.grantRead(this.raitaApiLambdaServiceRole);
    dataCollectionBucket.grantRead(this.raitaApiLambdaServiceRole);
    csvDataBucket.grantRead(this.raitaApiLambdaServiceRole);

    // TODO: this is not needed on all resources
    this.raitaApiLambdaServiceRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: ['*'], // TODO. specify keys?
      }),
    );

    this.raitaApiGraphqlLambdaServiceRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: ['*'], // TODO. specify keys?
      }),
    );

    this.raitaApiDeleteRequestLambdaServiceRole = createRaitaServiceRole({
      scope: this,
      name: 'RaitaApiDeleteRequestLambdaServiceRole',
      servicePrincipal: 'lambda.amazonaws.com',
      policyName: 'service-role/AWSLambdaVPCAccessExecutionRole',
      raitaStackIdentifier,
    });
    inspectionDataBucket.grantRead(this.raitaApiDeleteRequestLambdaServiceRole);
    inspectionDataBucket.grantDelete(
      this.raitaApiDeleteRequestLambdaServiceRole,
    );
    dataReceptionBucket.grantRead(this.raitaApiDeleteRequestLambdaServiceRole);
    dataReceptionBucket.grantDelete(
      this.raitaApiDeleteRequestLambdaServiceRole,
    );
    this.raitaApiDeleteRequestLambdaServiceRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: ['*'], // TODO. specify keys?
      }),
    );

    this.raitaApiManualDataProcessLambdaServiceRole = createRaitaServiceRole({
      scope: this,
      name: 'RaitaApiManualDataProcessLambdaServiceRole',
      servicePrincipal: 'lambda.amazonaws.com',
      policyName: 'service-role/AWSLambdaVPCAccessExecutionRole',
      raitaStackIdentifier,
    });
    inspectionDataBucket.grantReadWrite(
      this.raitaApiManualDataProcessLambdaServiceRole,
    );
    dataReceptionBucket.grantReadWrite(
      this.raitaApiManualDataProcessLambdaServiceRole,
    );
    this.raitaApiManualDataProcessLambdaServiceRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: ['*'], // TODO. specify keys?
      }),
    );

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
    const handleProtoExternalFileRequestFn =
      this.createProtoExternalFileRequestHandler({
        name: 'api-handler-proto-ext-file',
        raitaStackIdentifier,
        raitaEnv,
        stackId,
        jwtTokenIssuer,
        lambdaRole: this.raitaApiLambdaServiceRole,
        dataBucket: externalDataBucket,
        vpc,
      });
    externalDataBucket.grantRead(handleProtoExternalFileRequestFn);

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

    this.handleZipProcessFn = this.createZipProcessHandler({
      name: 'api-handler-zip-process',
      raitaStackIdentifier,
      raitaEnv,
      stackId,
      jwtTokenIssuer,
      lambdaRole: this.raitaApiZipProcessLambdaServiceRole,
      sourceBucket: inspectionDataBucket,
      targetBucket: dataCollectionBucket,
      vpc,
    });

    const handleZipRequestFn = this.createZipRequestHandler({
      name: 'api-handler-zip-request',
      raitaStackIdentifier,
      raitaEnv,
      stackId,
      jwtTokenIssuer,
      lambdaRole: this.raitaApiZipRequestLambdaServiceRole,
      zipProcessingFn: this.handleZipProcessFn.functionName,
      targetBucket: dataCollectionBucket,
      vpc,
    });

    const handlePollingRequestFn = this.createPollingRequestHandler({
      name: 'api-handler-polling',
      raitaStackIdentifier,
      raitaEnv,
      stackId,
      jwtTokenIssuer,
      lambdaRole: this.raitaApiLambdaServiceRole,
      dataBucket: dataCollectionBucket,
      vpc,
    });
    const handleUserRequestFn = this.createUserRequestHandler({
      name: 'api-handler-user',
      raitaStackIdentifier,
      raitaEnv,
      stackId,
      jwtTokenIssuer,
      lambdaRole: this.raitaApiLambdaServiceRole,
      vpc,
    });

    this.handleDeleteRequestFn = this.createDeleteRequestHandler({
      name: 'api-handler-delete',
      raitaStackIdentifier,
      raitaEnv,
      stackId,
      jwtTokenIssuer,
      lambdaRole: this.raitaApiDeleteRequestLambdaServiceRole,
      vpc,
      receptionBucket: dataReceptionBucket,
      inspectionBucket: inspectionDataBucket,
      databaseEnvironmentVariables,
      prismaLambdaLayer,
    });
    this.handleManualDataProcessFn = this.createManualDataProcessRequestHandler(
      {
        name: 'api-handler-manual-data-process',
        raitaStackIdentifier,
        raitaEnv,
        stackId,
        jwtTokenIssuer,
        lambdaRole: this.raitaApiManualDataProcessLambdaServiceRole,
        vpc,
        receptionBucket: dataReceptionBucket,
        inspectionBucket: inspectionDataBucket,
        databaseEnvironmentVariables,
        prismaLambdaLayer,
      },
    );

    this.handleAdminLogsRequestFn = this.createAdminLogsRequestHandler({
      name: 'api-handler-admin-logs',
      raitaStackIdentifier,
      raitaEnv,
      stackId,
      jwtTokenIssuer,
      lambdaRole: this.raitaApiLambdaServiceRole,
      vpc,
      databaseEnvironmentVariables,
      prismaLambdaLayer,
    });
    this.handleAdminLogsSummaryRequestFn =
      this.createAdminLogsRequestSummaryHandler({
        name: 'api-handler-admin-logs-summary',
        raitaStackIdentifier,
        raitaEnv,
        stackId,
        jwtTokenIssuer,
        lambdaRole: this.raitaApiLambdaServiceRole,
        vpc,
        databaseEnvironmentVariables,
        prismaLambdaLayer,
      });

    this.handleCsvGenerationFn = this.createCsvGenerationLambda({
      name: 'handler-csv-generation',
      raitaStackIdentifier,
      raitaEnv,
      stackId,
      jwtTokenIssuer,
      lambdaRole: this.raitaApiCsvGenerationLambdaServiceRole,
      vpc,
      databaseEnvironmentVariables,
      targetBucket: dataCollectionBucket,
      prismaLambdaLayer,
    });

    this.handleV2GraphqlRequest = this.createV2GraphqlHandler({
      name: 'api-handler-v2-graphql',
      raitaStackIdentifier,
      raitaEnv,
      stackId,
      jwtTokenIssuer,
      lambdaRole: this.raitaApiGraphqlLambdaServiceRole,
      vpc,
      databaseEnvironmentVariables,
      csvGenerationFunction: this.handleCsvGenerationFn.functionName,
      prismaLambdaLayer,
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

    let apiBaseUrl = isDevelopmentPreMainStack(stackId, raitaEnv)
      ? `/${stackId}/api`
      : '/api';
    /**
     * Add all lambdas to alb targets
     * 200-series if for lambdas accessing S3 information and
     * 300-series is for database access lambdas
     * Keep list in order by priority. Don’t reuse priority numbers
     */
    const albLambdaTargets: ListenerTargetLambdas[] = [
      {
        lambda: handleUserRequestFn,
        priority: 100,
        path: [`${apiBaseUrl}/user`],
        targetName: 'user',
      },
      {
        lambda: handleFileRequestFn,
        priority: 200,
        path: [`${apiBaseUrl}/file`],
        targetName: 'file',
      },
      {
        lambda: handleProtoExternalFileRequestFn,
        priority: 205,
        path: [`${apiBaseUrl}/proto-ext-file`],
        targetName: 'proto-ext-file',
      },
      {
        lambda: handleImagesRequestFn,
        priority: 210,
        path: [`${apiBaseUrl}/images`],
        targetName: 'images',
      },
      {
        lambda: handleZipRequestFn,
        priority: 221,
        path: [`${apiBaseUrl}/zip`],
        targetName: 'zip',
      },
      {
        lambda: handlePollingRequestFn,
        priority: 230,
        path: [`${apiBaseUrl}/polling`],
        targetName: 'polling',
      },
      {
        lambda: this.handleDeleteRequestFn,
        priority: 320,
        path: [`${apiBaseUrl}/delete`],
        targetName: 'delete',
      },
      {
        lambda: this.handleManualDataProcessFn,
        priority: 325,
        path: [`${apiBaseUrl}/admin/process`],
        targetName: 'manual-data-process',
      },
      {
        lambda: this.handleAdminLogsSummaryRequestFn,
        priority: 340,
        path: [`${apiBaseUrl}/admin/logs/summary`],
        targetName: 'admin-logs-summary',
      },
      {
        lambda: this.handleAdminLogsRequestFn,
        priority: 350,
        path: [`${apiBaseUrl}/admin/logs`],
        targetName: 'admin-logs',
      },
      {
        lambda: this.handleV2GraphqlRequest,
        priority: 360,
        path: [`${apiBaseUrl}/v2/graphql`],
        targetName: 'v2-graphql',
      },
      {
        lambda: handleReturnLogin,
        priority: 400,
        path: [`${apiBaseUrl}/return-login`],
        targetName: 'return-login',
      },
      // Endpoints for external API
      {
        lambda: handleUserRequestFn,
        priority: 500,
        path: [`${apiBaseUrl}/ext/user`],
        targetName: 'ext-user',
      },
      {
        lambda: handleFileRequestFn,
        priority: 501,
        path: [`${apiBaseUrl}/ext/file`],
        targetName: 'ext-file',
      },
      {
        lambda: handleImagesRequestFn,
        priority: 502,
        path: [`${apiBaseUrl}/ext/images`],
        targetName: 'ext-images',
      },
      {
        lambda: handleZipRequestFn,
        priority: 503,
        path: [`${apiBaseUrl}/ext/zip`],
        targetName: 'ext-zip',
      },
      {
        lambda: handlePollingRequestFn,
        priority: 504,
        path: [`${apiBaseUrl}/ext/polling`],
        targetName: 'ext-polling',
      },
      {
        lambda: this.handleV2GraphqlRequest,
        priority: 520,
        path: [`${apiBaseUrl}/ext/v2/graphql`],
        targetName: 'ext-v2-graphql',
      },
      // Note: delete request is missing from ext on purpose
    ];

    let importedListener: elbv2.IApplicationListener | null = null;

    if (isDevelopmentPreMainStack(stackId, raitaEnv)) {
      const listenerArnParameter = StringParameter.fromStringParameterName(
        this,
        'main-listener-arn',
        'raita-dev-main-application-listener-arn',
      );
      if (listenerArnParameter && listenerArnParameter.stringValue) {
        importedListener =
          elbv2.ApplicationListener.fromApplicationListenerAttributes(
            this,
            'raita-listener',
            {
              listenerArn: listenerArnParameter.stringValue,
              securityGroup: raitaSecurityGroup,
            },
          );
      }
    }
    if (
      importedListener !== null &&
      isDevelopmentPreMainStack(stackId, raitaEnv)
    ) {
      albLambdaTargets.forEach(target => {
        if (importedListener !== null) {
          const premainPriorityPrefix = 1000; // TODO
          const group = new elbv2.ApplicationTargetGroup(
            this,
            `premain-target-${target.targetName}`,
            {
              targets: [new LambdaTarget(target.lambda)],
            },
          );
          importedListener.addTargetGroups(
            `premain-target-group-${target.targetName}`,
            {
              targetGroups: [group],
              priority: premainPriorityPrefix + target.priority,
              conditions: [elbv2.ListenerCondition.pathPatterns(target.path)],
            },
          );
        }
      });
    } else {
      // ALB for API
      this.alb = this.createlAlb({
        raitaStackIdentifier: raitaStackIdentifier,
        name: 'raita-api',
        vpc,
        listenerTargets: albLambdaTargets,
      });
      if (isDevelopmentMainStack(stackId, raitaEnv)) {
        new StringParameter(this, `bucket-arn-param`, {
          parameterName: `raita-${raitaEnv}-${stackId}-application-listener-arn`,
          stringValue: this.alb.listeners[0].listenerArn,
        });
      }
    }
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
    // TODO: save to parameter store
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
      runtime: Runtime.NODEJS_20_X,
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
   *
   */
  private createProtoExternalFileRequestHandler({
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
    // use same handle as /file but with different bucket
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 1024,
      timeout: Duration.seconds(5),
      runtime: Runtime.NODEJS_20_X,
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
      runtime: lambda.Runtime.NODEJS_20_X,
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
   * Creates and returns handler for the zip requesting
   */
  private createZipRequestHandler({
    name,
    raitaStackIdentifier,
    raitaEnv,
    stackId,
    jwtTokenIssuer,
    lambdaRole,
    zipProcessingFn,
    targetBucket,
    vpc,
  }: {
    name: string;
    raitaStackIdentifier: string;
    raitaEnv: string;
    stackId: string;
    jwtTokenIssuer: string;
    lambdaRole: Role;
    zipProcessingFn: string;
    targetBucket: Bucket;
    vpc: ec2.IVpc;
  }) {
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 512,
      timeout: cdk.Duration.seconds(15),
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handleZipRequest',
      entry: path.join(
        __dirname,
        `../backend/lambdas/raitaApi/handleZipRequest/handleZipRequest.ts`,
      ),
      environment: {
        TARGET_BUCKET: targetBucket.bucketName,
        ZIP_PROCESSING_FN: zipProcessingFn,
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
   * Creates and returns handler for the zip Processing
   */
  private createZipProcessHandler({
    name,
    raitaStackIdentifier,
    raitaEnv,
    stackId,
    jwtTokenIssuer,
    lambdaRole,
    sourceBucket,
    targetBucket,
    vpc,
  }: {
    name: string;
    raitaStackIdentifier: string;
    raitaEnv: string;
    stackId: string;
    jwtTokenIssuer: string;
    lambdaRole: Role;
    sourceBucket: Bucket;
    targetBucket: Bucket;
    vpc: ec2.IVpc;
  }) {
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 3008,
      timeout: cdk.Duration.minutes(15),
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handleZipProcessing',
      entry: path.join(
        __dirname,
        `../backend/lambdas/raitaApi/handleZipRequest/handleZipProcessing.ts`,
      ),
      environment: {
        SOURCE_BUCKET: sourceBucket.bucketName,
        TARGET_BUCKET: targetBucket.bucketName,
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
   * Creates and returns a handler for polling.
   */
  private createPollingRequestHandler({
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
      memorySize: 1024,
      timeout: cdk.Duration.seconds(10),
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlePollingRequest',
      entry: path.join(
        __dirname,
        `../backend/lambdas/raitaApi/handlePollingRequest/handlePollingRequest.ts`,
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
   * Creates and returns a handler for user request
   */
  private createUserRequestHandler({
    name,
    raitaStackIdentifier,
    raitaEnv,
    stackId,
    jwtTokenIssuer,
    lambdaRole,
    vpc,
  }: {
    name: string;
    raitaStackIdentifier: string;
    raitaEnv: string;
    stackId: string;
    jwtTokenIssuer: string;
    lambdaRole: Role;
    vpc: ec2.IVpc;
  }) {
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 512,
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handleUserRequest',
      entry: path.join(
        __dirname,
        `../backend/lambdas/raitaApi/handleUserRequest/handleUserRequest.ts`,
      ),
      environment: {
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
   * Creates and returns handler for admin log request
   */
  private createAdminLogsRequestHandler({
    name,
    raitaStackIdentifier,
    raitaEnv,
    stackId,
    jwtTokenIssuer,
    lambdaRole,
    vpc,
    databaseEnvironmentVariables,
    prismaLambdaLayer,
  }: {
    name: string;
    raitaStackIdentifier: string;
    raitaEnv: string;
    stackId: string;
    jwtTokenIssuer: string;
    lambdaRole: Role;
    vpc: ec2.IVpc;
    databaseEnvironmentVariables: DatabaseEnvironmentVariables;
    prismaLambdaLayer: lambda.LayerVersion;
  }) {
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 512,
      timeout: cdk.Duration.seconds(60), // TODO
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handleAdminLogsRequest',
      entry: path.join(
        __dirname,
        `../backend/lambdas/raitaApi/handleAdminLogRequest/handleAdminLogRequest.ts`,
      ),
      environment: {
        JWT_TOKEN_ISSUER: jwtTokenIssuer,
        STACK_ID: stackId,
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
      logRetention: RetentionDays.SIX_MONTHS,
    });
  }

  /**
   * Creates and returns handler for admin log summary request
   */
  private createAdminLogsRequestSummaryHandler({
    name,
    raitaStackIdentifier,
    raitaEnv,
    stackId,
    jwtTokenIssuer,
    lambdaRole,
    vpc,
    databaseEnvironmentVariables,
    prismaLambdaLayer,
  }: {
    name: string;
    raitaStackIdentifier: string;
    raitaEnv: string;
    stackId: string;
    jwtTokenIssuer: string;
    lambdaRole: Role;
    vpc: ec2.IVpc;
    databaseEnvironmentVariables: DatabaseEnvironmentVariables;
    prismaLambdaLayer: lambda.LayerVersion;
  }) {
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 512,
      timeout: cdk.Duration.seconds(15),
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handleAdminLogsSummaryRequest',
      entry: path.join(
        __dirname,
        `../backend/lambdas/raitaApi/handleAdminLogsSummaryRequest/handleAdminLogsSummaryRequest.ts`,
      ),
      environment: {
        JWT_TOKEN_ISSUER: jwtTokenIssuer,
        STACK_ID: stackId,
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
      logRetention: RetentionDays.SIX_MONTHS,
    });
  }

  private createCsvGenerationLambda({
    name,
    raitaStackIdentifier,
    raitaEnv,
    stackId,
    jwtTokenIssuer,
    lambdaRole,
    vpc,
    databaseEnvironmentVariables,
    targetBucket,
    prismaLambdaLayer,
  }: {
    name: string;
    raitaStackIdentifier: string;
    raitaEnv: string;
    stackId: string;
    jwtTokenIssuer: string;
    lambdaRole: Role;
    vpc: ec2.IVpc;
    databaseEnvironmentVariables: DatabaseEnvironmentVariables;
    targetBucket: Bucket;
    prismaLambdaLayer: lambda.LayerVersion;
  }) {
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 4096,
      timeout: cdk.Duration.seconds(60 * 15), // max timeout, TODO test how long can this take
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handleCsvGeneration',
      entry: path.join(
        __dirname,
        `../backend/lambdas/raitaApi/csvGeneration/handleCsvGeneration.ts`,
      ),
      environment: {
        JWT_TOKEN_ISSUER: jwtTokenIssuer,
        STACK_ID: stackId,
        ENVIRONMENT: raitaEnv,
        TARGET_BUCKET: targetBucket.bucketName,
        ...databaseEnvironmentVariables,
      },
      bundling: prismaBundlingOptions,
      layers: [prismaLambdaLayer],
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnets: vpc.privateSubnets,
      },
      logRetention: RetentionDays.SIX_MONTHS,
    });
  }

  /**
   * Creates and returns handler for admin log request
   */
  private createV2GraphqlHandler({
    name,
    raitaStackIdentifier,
    raitaEnv,
    stackId,
    jwtTokenIssuer,
    lambdaRole,
    vpc,
    databaseEnvironmentVariables,
    csvGenerationFunction,
    prismaLambdaLayer,
  }: {
    name: string;
    raitaStackIdentifier: string;
    raitaEnv: RaitaEnvironment;
    stackId: string;
    jwtTokenIssuer: string;
    lambdaRole: Role;
    vpc: ec2.IVpc;
    databaseEnvironmentVariables: DatabaseEnvironmentVariables;
    csvGenerationFunction: string;
    prismaLambdaLayer: lambda.LayerVersion;
  }) {
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 512,
      timeout: cdk.Duration.seconds(60), // TODO
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handleV2GraphqlRequest',
      entry: path.join(
        __dirname,
        `../backend/lambdas/raitaApi/v2/handleV2GraphqlRequest/handleV2GraphqlRequest.ts`,
      ),
      environment: {
        JWT_TOKEN_ISSUER: jwtTokenIssuer,
        STACK_ID: stackId,
        ENVIRONMENT: raitaEnv,
        REGION: this.region,
        CSV_GENERATION_LAMBDA: csvGenerationFunction,
        ...databaseEnvironmentVariables,
        NODE_ENV: isPermanentStack(stackId, raitaEnv)
          ? 'production'
          : 'development',
      },
      layers: [prismaLambdaLayer],
      bundling: { ...graphqlBundlingOptions, ...prismaBundlingOptions },
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
      runtime: lambda.Runtime.NODEJS_20_X,
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

  private createDeleteRequestHandler({
    name,
    raitaStackIdentifier,
    raitaEnv,
    stackId,
    jwtTokenIssuer,
    lambdaRole,
    vpc,
    receptionBucket,
    inspectionBucket,
    databaseEnvironmentVariables,
    prismaLambdaLayer,
  }: {
    name: string;
    raitaStackIdentifier: string;
    raitaEnv: string;
    stackId: string;
    jwtTokenIssuer: string;
    lambdaRole: Role;
    vpc: ec2.IVpc;
    receptionBucket: Bucket;
    inspectionBucket: Bucket;
    databaseEnvironmentVariables: DatabaseEnvironmentVariables;
    prismaLambdaLayer: lambda.LayerVersion;
  }) {
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(300), // TODO: how long is needed for *big* delete operations?
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handleDeleteRequest',
      entry: path.join(
        __dirname,
        `../backend/lambdas/raitaApi/handleDeleteRequest/handleDeleteRequest.ts`,
      ),
      environment: {
        JWT_TOKEN_ISSUER: jwtTokenIssuer,
        STACK_ID: stackId,
        ENVIRONMENT: raitaEnv,
        REGION: this.region,
        RECEPTION_BUCKET: receptionBucket.bucketName,
        INSPECTION_BUCKET: inspectionBucket.bucketName,
        ...databaseEnvironmentVariables,
      },
      bundling: prismaBundlingOptions,
      layers: [prismaLambdaLayer],
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnets: vpc.privateSubnets,
      },
    });
  }
  private createManualDataProcessRequestHandler({
    name,
    raitaStackIdentifier,
    raitaEnv,
    stackId,
    jwtTokenIssuer,
    lambdaRole,
    vpc,
    receptionBucket,
    inspectionBucket,
    databaseEnvironmentVariables,
    prismaLambdaLayer,
  }: {
    name: string;
    raitaStackIdentifier: string;
    raitaEnv: string;
    stackId: string;
    jwtTokenIssuer: string;
    lambdaRole: Role;
    vpc: ec2.IVpc;
    receptionBucket: Bucket;
    inspectionBucket: Bucket;
    databaseEnvironmentVariables: DatabaseEnvironmentVariables;
    prismaLambdaLayer: lambda.LayerVersion;
  }) {
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(300), // TODO: how long is needed for copy?
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handleManualDataProcessRequest',
      entry: path.join(
        __dirname,
        `../backend/lambdas/raitaApi/handleManualDataProcessRequest/handleManualDataProcessRequest.ts`,
      ),
      environment: {
        JWT_TOKEN_ISSUER: jwtTokenIssuer,
        STACK_ID: stackId,
        ENVIRONMENT: raitaEnv,
        RECEPTION_BUCKET: receptionBucket.bucketName,
        INSPECTION_BUCKET: inspectionBucket.bucketName,
        ...databaseEnvironmentVariables,
      },
      bundling: prismaBundlingOptions,
      layers: [prismaLambdaLayer],
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnets: vpc.privateSubnets,
      },
    });
  }
}
