import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Duration, NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import {
  S3EventSource,
  SqsEventSource,
} from 'aws-cdk-lib/aws-lambda-event-sources';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import { Domain } from 'aws-cdk-lib/aws-opensearchservice';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { FilterPattern, ILogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import * as path from 'path';
import { Construct } from 'constructs';
import { DatabaseEnvironmentVariables, RaitaEnvironment } from './config';
import { EXTRACTION_SPEC_PATH, raitaSourceSystems } from '../constants';
import {
  createRaitaBucket,
  createRaitaServiceRole,
} from './raitaResourceCreators';
import { getDatabaseEnvironmentVariables, getRemovalPolicy } from './utils';
import {
  Alarm,
  AlarmRule,
  ComparisonOperator,
  CompositeAlarm,
  Stats,
  TreatMissingData,
} from 'aws-cdk-lib/aws-cloudwatch';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { SqsDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { handleCSVFileEvent } from '../backend/lambdas/dataProcess/handleCSVFileEvent/handleCSVFileEvent';

interface DataProcessStackProps extends NestedStackProps {
  readonly raitaStackIdentifier: string;
  readonly raitaEnv: RaitaEnvironment;
  readonly stackId: string;
  readonly vpc: IVpc;
  readonly openSearchDomain: Domain;
  readonly openSearchMetadataIndex: string;
  readonly parserConfigurationFile: string;
  readonly sftpPolicyAccountId: string;
  readonly sftpPolicyUserId: string;
  readonly sftpRaitaDeveloperPolicyUserId: string;
  readonly soaPolicyAccountId: string;
  readonly vaylaPolicyUserId: string;
  readonly loramPolicyUserId: string;
}

export class DataProcessStack extends NestedStack {
  public readonly dataProcessorLambdaServiceRole: iam.Role;
  public readonly inspectionDataBucket: Bucket;
  public readonly dataReceptionBucket: Bucket;
  public readonly handleInspectionFileEventFn: NodejsFunction;
  public readonly handleCSVFileEventFn: NodejsFunction;
  public readonly handleCSVFileMassImportEventFn: NodejsFunction;
  public readonly csvMassImportDataBucket: Bucket;
  public readonly csvDataBucket: Bucket;

  constructor(scope: Construct, id: string, props: DataProcessStackProps) {
    super(scope, id, props);
    const {
      raitaStackIdentifier,
      raitaEnv,
      stackId,
      vpc,
      openSearchDomain,
      openSearchMetadataIndex,
      parserConfigurationFile,
      sftpPolicyAccountId,
      sftpPolicyUserId,
      sftpRaitaDeveloperPolicyUserId,
      soaPolicyAccountId,
      vaylaPolicyUserId,
      loramPolicyUserId,
    } = props;

    const databaseEnvironmentVariables = getDatabaseEnvironmentVariables(
      stackId,
      raitaEnv,
    );

    this.dataProcessorLambdaServiceRole = createRaitaServiceRole({
      scope: this,
      name: 'DataProcessorLambdaServiceRole',
      servicePrincipal: 'lambda.amazonaws.com',
      policyName: 'service-role/AWSLambdaVPCAccessExecutionRole',
      raitaStackIdentifier,
    });

    // Create buckets
    this.inspectionDataBucket = createRaitaBucket({
      scope: this,
      name: 'inspection-data',
      raitaEnv,
      raitaStackIdentifier,
    });
    const configurationBucket = createRaitaBucket({
      scope: this,
      name: 'parser-configuration',
      raitaEnv,
      raitaStackIdentifier,
    });
    this.dataReceptionBucket = createRaitaBucket({
      scope: this,
      name: 'data-reception',
      raitaEnv,
      raitaStackIdentifier,
      versioned: true,
    });
    this.csvDataBucket = createRaitaBucket({
      scope: this,
      name: 'csv-data',
      raitaEnv,
      raitaStackIdentifier,
    });
    this.csvMassImportDataBucket = createRaitaBucket({
      scope: this,
      name: 'csv-data-mass-import',
      raitaEnv,
      raitaStackIdentifier,
    });

    new BucketDeployment(this, 'ExtractionSpecDeployment', {
      sources: [Source.asset(EXTRACTION_SPEC_PATH)],
      destinationBucket: configurationBucket,
    });

    const receptionBucketResources = [
      this.dataReceptionBucket.bucketArn,
      `${this.dataReceptionBucket.bucketArn}/${raitaSourceSystems.Meeri}/*`,
      `${this.dataReceptionBucket.bucketArn}/${raitaSourceSystems.MeeriHotfix2023}/*`, // TODO: remove when not needed
    ];
    const fullAccessBucketActions = [
      's3:GetObject',
      's3:GetObjectVersion',
      's3:GetObjectAcl',
      's3:PutObject',
      's3:PutObjectAcl',
      's3:ListBucket',
      's3:GetBucketLocation',
      's3:DeleteObject',
    ];
    const readAccessBucketActions = [
      's3:ListBucket',
      's3:GetBucketLocation',
      's3:GetObject',
      's3:GetObjectVersion',
      's3:GetObjectAcl',
    ];
    // Grant sftpUser full access to data reception bucket
    const sftpReceivePolicy = this.createBucketPolicy({
      policyAccountId: sftpPolicyAccountId,
      policyUserId: sftpPolicyUserId,
      resources: receptionBucketResources,
      actions: fullAccessBucketActions,
    });
    this.dataReceptionBucket.addToResourcePolicy(sftpReceivePolicy);

    // Grant RAITA developer SFTP user full access to the bucket
    const sftpRaitaDeveloperUserBucketPolicy = this.createBucketPolicy({
      policyAccountId: sftpPolicyAccountId,
      policyUserId: sftpRaitaDeveloperPolicyUserId,
      resources: receptionBucketResources,
      actions: fullAccessBucketActions,
    });
    this.dataReceptionBucket.addToResourcePolicy(
      sftpRaitaDeveloperUserBucketPolicy,
    );

    // Grant SOA-offices väylä role full access to data reception bucket
    const soaOfficeVaylaBucketPolicy = this.createBucketPolicy({
      policyAccountId: soaPolicyAccountId,
      policyUserId: vaylaPolicyUserId,
      resources: receptionBucketResources,
      actions: fullAccessBucketActions,
    });
    this.dataReceptionBucket.addToResourcePolicy(soaOfficeVaylaBucketPolicy);

    // Grant SOA-offices loram role read access to data reception bucket
    const soaOfficeLoramBucketPolicy = this.createBucketPolicy({
      policyAccountId: soaPolicyAccountId,
      policyUserId: loramPolicyUserId,
      resources: receptionBucketResources,
      actions: readAccessBucketActions,
    });
    this.dataReceptionBucket.addToResourcePolicy(soaOfficeLoramBucketPolicy);

    // Create ECS cluster resources for zip extraction task
    const {
      ecsCluster,
      handleZipTask,
      handleZipContainer,
      zipTaskLogGroup,
      zipTaskTaskRole,
    } = this.createZipHandlerECSResources({
      raitaStackIdentifier,
      vpc,
      raitaEnv,
      databaseEnvironmentVariables,
    });

    this.dataReceptionBucket.grantRead(zipTaskTaskRole);
    this.inspectionDataBucket.grantWrite(zipTaskTaskRole);

    zipTaskTaskRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: ['*'], // TODO: specify keys?
      }),
    );

    // Create zip handler lambda and grant permissions
    const handleReceptionFileEventFn = this.createReceptionFileEventHandler({
      name: 'dp-handler-reception-file',
      targetBucket: this.inspectionDataBucket,
      lambdaRole: this.dataProcessorLambdaServiceRole,
      raitaStackIdentifier,
      vpc,
      cluster: ecsCluster,
      task: handleZipTask,
      container: handleZipContainer,
      databaseEnvironmentVariables,
    });
    this.inspectionDataBucket.grantWrite(handleReceptionFileEventFn);
    this.dataReceptionBucket.grantRead(handleReceptionFileEventFn);

    const zipHandlerAlarms = this.createReceptionZipHandlerAlarms(
      zipTaskLogGroup!,
      raitaStackIdentifier,
    );
    const receptionAlarms = this.createReceptionHandlerAlarms(
      handleReceptionFileEventFn.logGroup,
      raitaStackIdentifier,
    );

    this.dataProcessorLambdaServiceRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: [handleZipTask.taskDefinitionArn],
        actions: ['ecs:RunTask'],
      }),
    );
    this.dataProcessorLambdaServiceRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: ['*'], // TODO: specify keys?
      }),
    );
    // Dataprocessor lambda role needs PassRole permissions to both a) zip task
    // execution role and b) zip task role to pass them on to ECS in lambda execution.
    // The execution role is created in conjuction with other ECS resources
    if (!handleZipTask.executionRole) {
      throw new Error('Task handleZipTask does not have execution role.');
    }
    this.dataProcessorLambdaServiceRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: [
          handleZipTask.executionRole.roleArn,
          handleZipTask.taskRole.roleArn,
        ],
        actions: ['iam:PassRole'],
      }),
    );

    // route reception s3 events through a queue
    const receptionQueue = new Queue(this, 'reception-queue', {
      visibilityTimeout: Duration.seconds(915), // matching lambda timeout
    });
    const receptionQueueSource = new SqsEventSource(receptionQueue, {
      batchSize: 1,
      maxConcurrency: 2,
    });
    this.dataReceptionBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new SqsDestination(receptionQueue),
      { prefix: `${raitaSourceSystems.Meeri}/` },
    );

    handleReceptionFileEventFn.addEventSource(receptionQueueSource);

    // Create meta data parser lambda, grant permissions and create event sources
    this.handleInspectionFileEventFn = this.createInspectionFileEventHandler({
      name: 'dp-handler-inspection-file',
      openSearchDomainEndpoint: openSearchDomain.domainEndpoint,
      configurationBucketName: configurationBucket.bucketName,
      inspectionBucketName: this.inspectionDataBucket.bucketName,
      csvBucketName: this.csvDataBucket.bucketName,
      openSearchMetadataIndex: openSearchMetadataIndex,
      configurationFile: parserConfigurationFile,
      lambdaRole: this.dataProcessorLambdaServiceRole,
      raitaStackIdentifier,
      vpc,
      databaseEnvironmentVariables,
    });
    const inspectionAlarms = this.createInspectionHandlerAlarms(
      this.handleInspectionFileEventFn.logGroup,
      raitaStackIdentifier,
    );
    // Grant lambda permissions to buckets
    configurationBucket.grantRead(this.handleInspectionFileEventFn);
    this.inspectionDataBucket.grantReadWrite(this.handleInspectionFileEventFn);
    this.csvDataBucket.grantReadWrite(this.handleInspectionFileEventFn);
    // Grant lamba permissions to OpenSearch index
    openSearchDomain.grantIndexReadWrite(
      openSearchMetadataIndex,
      this.handleInspectionFileEventFn,
    );

    // route inspection s3 events through a queue
    const inspectionQueue = new Queue(this, 'inspection-queue', {
      visibilityTimeout: Duration.seconds(240),
    });
    this.inspectionDataBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new SqsDestination(inspectionQueue),
    );
    const inspectionQueueSource = new SqsEventSource(inspectionQueue, {
      batchSize: 1, // need better error handling of batches in inspection handler if this is inreased
      maxConcurrency: 100,
    });
    this.handleInspectionFileEventFn.addEventSource(inspectionQueueSource);
    const allAlarms = [
      ...receptionAlarms,
      ...inspectionAlarms,
      ...zipHandlerAlarms,
    ];

    // Create csv data parser lambda, grant permissions and create event sources
    this.handleCSVFileEventFn = this.createCsvFileEventHandler({
      name: 'dp-handler-csv-file',
      csvBucketName: this.csvDataBucket.bucketName,
      configurationFile: parserConfigurationFile,
      lambdaRole: this.dataProcessorLambdaServiceRole,
      raitaStackIdentifier,
      vpc,
      databaseEnvironmentVariables,
    });
    // Grant lambda permissions to bucket
    this.csvDataBucket.grantReadWrite(this.handleCSVFileEventFn);

    // Add s3 event source for any added file
    this.handleCSVFileEventFn.addEventSource(
      new S3EventSource(this.csvDataBucket, {
        events: [s3.EventType.OBJECT_CREATED],
      }),
    );

    // Create csv data parser lambda for mass import that is triggered from csv-massimport bucket so existing csv files can be imported separately from normal data process, grant permissions and create event sources
    this.handleCSVFileMassImportEventFn =
      this.createCsvFileMassImportEventHandler({
        name: 'dp-handler-csv-file-mass-import',
        csvMassImportBucketName: this.csvMassImportDataBucket.bucketName,
        csvBucketName: this.csvDataBucket.bucketName,
        configurationFile: parserConfigurationFile,
        configurationBucketName: configurationBucket.bucketName,
        lambdaRole: this.dataProcessorLambdaServiceRole,
        raitaStackIdentifier,
        vpc,
        databaseEnvironmentVariables,
      });
    // Grant lambda permissions to bucket
    this.csvDataBucket.grantReadWrite(this.handleCSVFileMassImportEventFn);
    configurationBucket.grantRead(this.handleCSVFileMassImportEventFn);
    this.csvMassImportDataBucket.grantReadWrite(
      this.handleCSVFileMassImportEventFn,
    );

    // route inspection s3 events through a queue
    const csvMassImportQueue = new Queue(this, 'csv-mass-import-queue', {
      visibilityTimeout: Duration.seconds(240),
    });
    this.csvMassImportDataBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new SqsDestination(csvMassImportQueue),
    );
    const csvMassImportQueueSource = new SqsEventSource(csvMassImportQueue, {
      batchSize: 1, // need better error handling of batches in inspection handler if this is inreased
      maxConcurrency: 10,
    });
    this.handleCSVFileMassImportEventFn.addEventSource(csvMassImportQueueSource);

    // create composite alarm that triggers when any alarm for different error types trigger
    const compositeAlarm = new CompositeAlarm(
      this,
      'data-process-error-composite-alarm',
      {
        alarmRule: AlarmRule.anyOf(...allAlarms),
        compositeAlarmName: `metadata-parsing-errors-composite-alarm-${raitaStackIdentifier}`,
        alarmDescription:
          'Alarm that goes off when parsing errors are encountered in metadata parsing',
      },
    );

    const topic = new Topic(this, 'data-process-topic', {
      displayName: `Raita data process ${raitaStackIdentifier}`,
    });

    compositeAlarm.addAlarmAction(new SnsAction(topic));
  }

  /**
   * Creates the parser lambda and add S3 buckets as event sources,
   * granting lambda read access to these buckets
   */
  private createReceptionFileEventHandler({
    name,
    targetBucket,
    lambdaRole,
    raitaStackIdentifier,
    vpc,
    cluster,
    task,
    container,
    databaseEnvironmentVariables,
  }: {
    name: string;
    targetBucket: s3.Bucket;
    lambdaRole: iam.Role;
    raitaStackIdentifier: string;
    vpc: IVpc;
    cluster: cdk.aws_ecs.Cluster;
    task: cdk.aws_ecs.FargateTaskDefinition;
    container: cdk.aws_ecs.ContainerDefinition;
    databaseEnvironmentVariables: DatabaseEnvironmentVariables;
  }) {
    const receptionHandler = new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 8192,
      timeout: Duration.seconds(900),
      runtime: Runtime.NODEJS_20_X,
      handler: 'handleReceptionFileEvent',
      entry: path.join(
        __dirname,
        `../backend/lambdas/dataProcess/handleReceptionFileEvent/handleReceptionFileEvent.ts`,
      ),
      environment: {
        ECS_CLUSTER_ARN: cluster.clusterArn,
        ECS_TASK_ARN: task.taskDefinitionArn,
        CONTAINER_NAME: container.containerName,
        TARGET_BUCKET_NAME: targetBucket.bucketName,
        SUBNET_IDS: vpc.privateSubnets.map(sn => sn.subnetId).join(','),
        ...databaseEnvironmentVariables,
      },
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnets: vpc.privateSubnets,
      },
    });

    return receptionHandler;
  }

  /**
   * Creates the parser lambda and add S3 buckets as event sources,
   * granting lambda read access to these buckets
   */
  private createInspectionFileEventHandler({
    name,
    openSearchDomainEndpoint,
    configurationBucketName,
    inspectionBucketName,
    csvBucketName,
    configurationFile,
    openSearchMetadataIndex,
    lambdaRole,
    raitaStackIdentifier,
    vpc,
    databaseEnvironmentVariables,
  }: {
    name: string;
    openSearchDomainEndpoint: string;
    configurationBucketName: string;
    inspectionBucketName: string;
    csvBucketName: string;
    configurationFile: string;
    lambdaRole: iam.Role;
    openSearchMetadataIndex: string;
    raitaStackIdentifier: string;
    vpc: IVpc;
    databaseEnvironmentVariables: DatabaseEnvironmentVariables;
  }) {
    // any events that fail cause lambda to fail twice will be written here
    // currently nothing is done to this queue
    const inspectionDeadLetterQueue = new Queue(
      this,
      'inspection-handler-deadletter',
    );
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 10240,
      timeout: cdk.Duration.seconds(15 * 60),
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handleInspectionFileEvent',
      entry: path.join(
        __dirname,
        `../backend/lambdas/dataProcess/handleInspectionFileEvent/handleInspectionFileEvent.ts`,
      ),
      reservedConcurrentExecutions: 100,
      environment: {
        OPENSEARCH_DOMAIN: openSearchDomainEndpoint,
        CONFIGURATION_BUCKET: configurationBucketName,
        INSPECTION_BUCKET: inspectionBucketName,
        CSV_BUCKET: csvBucketName,
        CONFIGURATION_FILE: configurationFile,
        METADATA_INDEX: openSearchMetadataIndex,
        REGION: this.region,
        ...databaseEnvironmentVariables,
      },
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnets: vpc.privateSubnets,
      },
      deadLetterQueue: inspectionDeadLetterQueue,
    });
  }

  private createReceptionZipHandlerAlarms(
    logGroup: ILogGroup,
    raitaStackIdentifier: string,
  ) {
    const errorMetricFilter = logGroup.addMetricFilter(
      'zip-handler-error-filter',
      {
        filterPattern: FilterPattern.stringValue('$.level', '=', 'error'),
        metricName: `zip-handler-error-${raitaStackIdentifier}`,
        metricNamespace: 'raita-data-process',
        metricValue: '1',
      },
    );
    const errorAlarm = new Alarm(this, 'zip-handler-errors-alarm', {
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      alarmName: `zip-handler-errors-alarm-${raitaStackIdentifier}`,
      metric: errorMetricFilter.metric({
        label: `Reception zip handler errors ${raitaStackIdentifier}`,
        period: Duration.days(1),
        statistic: Stats.SUM,
      }),
    });
    return [errorAlarm];
  }

  /**
   * Creates the csv parser lambda and add csv S3 bucket as event sources,
   * granting lambda read access to the bucket
   */
  private createCsvFileEventHandler({
    name,
    csvBucketName,
    configurationFile,
    lambdaRole,
    raitaStackIdentifier,
    vpc,
    databaseEnvironmentVariables,
  }: {
    name: string;
    csvBucketName: string;
    configurationFile: string;
    lambdaRole: iam.Role;
    raitaStackIdentifier: string;
    vpc: IVpc;
    databaseEnvironmentVariables: DatabaseEnvironmentVariables;
  }) {
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 10240,
      timeout: cdk.Duration.seconds(15 * 60),
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handleCSVFileEvent',
      entry: path.join(
        __dirname,
        `../backend/lambdas/dataProcess/handleCSVFileEvent/handleCSVFileEvent.ts`,
      ),
      environment: {
        CSV_BUCKET: csvBucketName,
        CONFIGURATION_FILE: configurationFile,
        REGION: this.region,
        ...databaseEnvironmentVariables,
      },
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnets: vpc.privateSubnets,
      },
    });
  }

  /**
   * Creates the csv parser lambda and add csv S3 bucket as event sources,
   * granting lambda read access to the bucket
   */
  private createCsvFileMassImportEventHandler({
    name,
    csvMassImportBucketName,
    csvBucketName,
    configurationFile,
    configurationBucketName,
    lambdaRole,
    raitaStackIdentifier,
    vpc,
    databaseEnvironmentVariables,
  }: {
    name: string;
    csvMassImportBucketName: string;
    csvBucketName: string;
    configurationFile: string;
    configurationBucketName: string;
    lambdaRole: iam.Role;
    raitaStackIdentifier: string;
    vpc: IVpc;
    databaseEnvironmentVariables: DatabaseEnvironmentVariables;
  }) {
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 10240,
      timeout: cdk.Duration.seconds(15 * 60),
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handleCSVMassImportFileEvent',
      entry: path.join(
        __dirname,
        `../backend/lambdas/dataProcess/handleCSVFileEvent/handleCSVMassImportFileEvent.ts`,
      ),
      environment: {
        CSV_BUCKET: csvBucketName,
        CSV_MASS_IMPORT_BUCKET: csvMassImportBucketName,
        CONFIGURATION_FILE: configurationFile,
        CONFIGURATION_BUCKET: configurationBucketName,
        REGION: this.region,
        ...databaseEnvironmentVariables,
      },
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnets: vpc.privateSubnets,
      },
    });
  }

  /**
   * Add alarms for monitoring errors from logs
   */
  private createReceptionHandlerAlarms(
    logGroup: ILogGroup,
    raitaStackIdentifier: string,
  ) {
    const errorMetricFilter = logGroup.addMetricFilter(
      'reception-error-filter',
      {
        filterPattern: FilterPattern.all(
          FilterPattern.stringValue('$.tag', '=', 'RAITA_BACKEND'),
          FilterPattern.stringValue('$.level', '=', 'error'),
        ),
        metricName: `parsing-error-${raitaStackIdentifier}`,
        metricNamespace: 'raita-data-process',
        metricValue: '1',
      },
    );
    const errorAlarm = new Alarm(this, 'reception-errors-alarm', {
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      alarmName: `reception-errors-alarm-${raitaStackIdentifier}`,
      metric: errorMetricFilter.metric({
        label: `Reception other errors ${raitaStackIdentifier}`,
        period: Duration.days(1),
        statistic: Stats.SUM,
      }),
    });
    return [errorAlarm];
  }

  /**
   * Add alarms for monitoring errors from logs
   *
   * Multiple alarms for different types if errors
   */
  private createInspectionHandlerAlarms(
    logGroup: ILogGroup,
    raitaStackIdentifier: string,
  ) {
    const timeoutMetricFilter = logGroup.addMetricFilter(
      'inspection-timeout-filter',
      {
        filterPattern: FilterPattern.literal('%Task timed out%'),
        metricName: `inspection-timeout-${raitaStackIdentifier}`,
        metricNamespace: 'raita-data-process',
        metricValue: '1',
      },
    );
    const parsingErrorMetricFilter = logGroup.addMetricFilter(
      'inspection-parsing-error-filter',
      {
        filterPattern: FilterPattern.all(
          FilterPattern.stringValue('$.tag', '=', 'RAITA_PARSING_EXCEPTION'),
          FilterPattern.stringValue('$.level', '=', 'error'),
        ),
        metricName: `inspection-parsing-error-${raitaStackIdentifier}`,
        metricNamespace: 'raita-data-process',
        metricValue: '1',
      },
    );
    const otherErrorMetricFilter = logGroup.addMetricFilter(
      'inspection-other-error-filter',
      {
        filterPattern: FilterPattern.all(
          FilterPattern.stringValue('$.tag', '=', 'RAITA_BACKEND'),
          FilterPattern.stringValue('$.level', '=', 'error'),
        ),
        metricName: `inspection-other-error-${raitaStackIdentifier}`,
        metricNamespace: 'raita-data-process',
        metricValue: '1',
      },
    );
    // create separate warn metric with no alarm associated
    const warningMetricFilter = logGroup.addMetricFilter(
      'inspection-warn-filter',
      {
        filterPattern: FilterPattern.all(
          FilterPattern.any(
            FilterPattern.stringValue('$.tag', '=', 'RAITA_BACKEND'),
            FilterPattern.stringValue('$.tag', '=', 'RAITA_PARSING_EXCEPTION'),
          ),
          FilterPattern.stringValue('$.level', '=', 'warn'),
        ),
        metricName: `inspection-warn-${raitaStackIdentifier}`,
        metricNamespace: 'raita-data-process',
        metricValue: '1',
      },
    );
    const crashErrorMetricFilter = logGroup.addMetricFilter(
      'inspection-crash-error-filter',
      {
        filterPattern: FilterPattern.literal('%Runtime exited%'),
        metricName: `inspection-crash-error-${raitaStackIdentifier}`,
        metricNamespace: 'raita-data-process',
        metricValue: '1',
      },
    );
    const anyErrorMetricFilter = logGroup.addMetricFilter(
      'inspection-all-error-filter',
      {
        filterPattern: FilterPattern.anyTerm('error', 'Error'),
        metricName: `inspection-any-error-${raitaStackIdentifier}`,
        metricNamespace: 'raita-data-process',
        metricValue: '1',
      },
    );
    const timeoutAlarm = new Alarm(this, 'inspection-timeout-alarm', {
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      alarmName: `inspection-timeout-alarm-${raitaStackIdentifier}`,
      alarmDescription: 'Alarm for catching timeout errors in metadata parser',
      metric: timeoutMetricFilter.metric({
        label: `Inspection timeout ${raitaStackIdentifier}`,
        period: Duration.days(1),
        statistic: Stats.SUM,
      }),
    });
    const parsingErrorAlarm = new Alarm(
      this,
      'inspection-parsing-errors-alarm',
      {
        comparisonOperator:
          ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: TreatMissingData.NOT_BREACHING,
        alarmName: `inspection-parsing-errors-alarm-${raitaStackIdentifier}`,
        alarmDescription:
          'Alarm for catching parsing errors in metadata parser',
        metric: parsingErrorMetricFilter.metric({
          label: `Inspection parsing errors ${raitaStackIdentifier}`,
          period: Duration.days(1),
          statistic: Stats.SUM,
        }),
      },
    );
    const otherErrorAlarm = new Alarm(this, 'inspection-other-errors-alarm', {
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      alarmName: `inspection-other-errors-alarm-${raitaStackIdentifier}`,
      alarmDescription:
        'Alarm for catching code errors other than known parsing errors in metadata parser',
      metric: otherErrorMetricFilter.metric({
        label: `Inspection other errors ${raitaStackIdentifier}`,
        period: Duration.days(1),
        statistic: Stats.SUM,
      }),
    });
    const crashErrorAlarm = new Alarm(this, 'inspection-crash-errors-alarm', {
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      alarmName: `inspection-crash-errors-alarm-${raitaStackIdentifier}`,
      alarmDescription: 'Alarm for catching crashes of metadata parser',
      metric: crashErrorMetricFilter.metric({
        label: `Inspection crash errors ${raitaStackIdentifier}`,
        period: Duration.days(1),
        statistic: Stats.SUM,
      }),
    });
    const anyErrorAlarm = new Alarm(this, 'inspection-any-errors-alarm', {
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      alarmName: `inspection-any-errors-alarm-${raitaStackIdentifier}`,
      alarmDescription:
        'Failsafe alarm for catching all errors in metadata parser, including those missed by other alarms',
      metric: anyErrorMetricFilter.metric({
        label: `Inspection any errors ${raitaStackIdentifier}`,
        period: Duration.days(1),
        statistic: Stats.SUM,
      }),
    });
    return [
      timeoutAlarm,
      parsingErrorAlarm,
      otherErrorAlarm,
      crashErrorAlarm,
      anyErrorAlarm,
    ];
  }

  /**
   * Helper to create bucket policies
   */

  private createBucketPolicy({
    policyAccountId,
    policyUserId,
    resources,
    actions,
  }: {
    policyAccountId: string;
    policyUserId: string;
    resources: Array<string>;
    actions: Array<string>;
  }) {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.AccountPrincipal(policyAccountId)],
      actions,
      resources,
      conditions: {
        StringLike: {
          'aws:userId': `${policyUserId}:*`,
        },
      },
    });
  }

  private createZipHandlerECSResources({
    raitaStackIdentifier,
    vpc,
    raitaEnv,
    databaseEnvironmentVariables,
  }: {
    raitaStackIdentifier: string;
    vpc: IVpc;
    raitaEnv: RaitaEnvironment;
    databaseEnvironmentVariables: DatabaseEnvironmentVariables;
  }) {
    const ecsCluster = new ecs.Cluster(
      this,
      `cluster-${raitaStackIdentifier}`,
      {
        vpc,
      },
    );

    // Explicitly create the zipHandler execution role and grant permissions
    // to ECR, otherwise role does not receive the necessary rights
    const zipTaskExecutionRole = createRaitaServiceRole({
      scope: this,
      name: 'RaitaZipTaskExecutionRole',
      servicePrincipal: 'ecs-tasks.amazonaws.com',
      policyName: 'AmazonEC2ContainerRegistryReadOnly',
      raitaStackIdentifier,
    });

    const zipTaskTaskRole = createRaitaServiceRole({
      scope: this,
      name: 'RaitaZipTaskTaskRole',
      servicePrincipal: 'ecs-tasks.amazonaws.com',
      raitaStackIdentifier,
    });

    const handleZipTask = new ecs.FargateTaskDefinition(
      this,
      `task-${raitaStackIdentifier}-handle-zip`,
      {
        memoryLimitMiB: 30720,
        cpu: 4096,
        ephemeralStorageGiB: 100,
        executionRole: zipTaskExecutionRole,
        taskRole: zipTaskTaskRole,
        runtimePlatform: {
          cpuArchitecture: ecs.CpuArchitecture.X86_64,
          operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
        },
      },
    );
    const image = new DockerImageAsset(this, 'zip-handler-image', {
      directory: path.join(__dirname, '../backend/containers/zipHandler'),
    });
    const logDriver = new ecs.AwsLogDriver({
      streamPrefix: 'FargateHandleZip',
      logRetention: RetentionDays.SIX_MONTHS,
    });
    const handleZipContainer = handleZipTask.addContainer(
      `container-${raitaStackIdentifier}-zip-handler`,
      {
        image: ecs.ContainerImage.fromDockerImageAsset(image),
        logging: logDriver,
        environment: {
          AWS_REGION: this.region,
          ...databaseEnvironmentVariables,
        },
      },
    );
    return {
      ecsCluster,
      handleZipTask,
      handleZipContainer,
      zipTaskLogGroup: logDriver.logGroup,
      zipTaskTaskRole,
    };
  }
}
