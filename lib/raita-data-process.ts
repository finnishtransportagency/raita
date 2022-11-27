import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Duration, NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { S3EventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import { Domain } from 'aws-cdk-lib/aws-opensearchservice';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import * as path from 'path';
import { Construct } from 'constructs';
import { RaitaEnvironment } from './config';
import {
  fileSuffixesToIncudeInMetadataParsing,
  raitaSourceSystems,
  ZIP_SUFFIX,
} from '../constants';
import {
  createRaitaBucket,
  createRaitaServiceRole,
} from './raitaResourceCreators';

interface DataProcessStackProps extends NestedStackProps {
  readonly raitaStackIdentifier: string;
  readonly raitaEnv: RaitaEnvironment;
  readonly vpc: IVpc;
  readonly openSearchDomain: Domain;
  readonly openSearchMetadataIndex: string;
  readonly parserConfigurationFile: string;
  readonly sftpPolicyAccountId: string;
  readonly sftpPolicyUserId: string;
}

export class DataProcessStack extends NestedStack {
  public readonly dataProcessorLambdaServiceRole: iam.Role;
  public readonly inspectionDataBucket: Bucket;
  public readonly handleInspectionFileEventFn: NodejsFunction;

  constructor(scope: Construct, id: string, props: DataProcessStackProps) {
    super(scope, id, props);
    const {
      raitaStackIdentifier,
      raitaEnv,
      vpc,
      openSearchDomain,
      openSearchMetadataIndex,
      parserConfigurationFile,
      sftpPolicyAccountId,
      sftpPolicyUserId,
    } = props;

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
      raitaStackIdentifier: raitaStackIdentifier,
    });
    const configurationBucket = createRaitaBucket({
      scope: this,
      name: 'parser-configuration',
      raitaEnv,
      raitaStackIdentifier: raitaStackIdentifier,
    });
    const dataReceptionBucket = createRaitaBucket({
      scope: this,
      name: 'data-reception',
      raitaEnv,
      raitaStackIdentifier,
      eventBridgeEnabled: true,
    });

    // Grant sftpUser access to data reception bucket
    const sftpReceivePolicy = this.createSftpReceivePolicy({
      sftpPolicyAccountId,
      sftpPolicyUserId,
      dataReceptionBucket,
    });
    dataReceptionBucket.addToResourcePolicy(sftpReceivePolicy);

    // Create ECS cluster resources for zip extraction task
    const { ecsCluster, handleZipTask, handleZipContainer } =
      this.createZipHandlerECSResources({
        raitaStackIdentifier,
        vpc,
      });

    // TODO: Remove line commented out line in cleanup
    // ecr.AuthorizationToken.grantRead(handleZipTask.taskRole);

    dataReceptionBucket.grantRead(handleZipTask.taskRole);
    this.inspectionDataBucket.grantWrite(handleZipTask.taskRole);

    // Create zip handler lambda and grant permissions
    const handleZipFileEventFn = this.createZipFileEventHandler({
      name: 'dp-handler-zip-file',
      targetBucket: this.inspectionDataBucket,
      lambdaRole: this.dataProcessorLambdaServiceRole,
      raitaStackIdentifier,
      vpc,
      cluster: ecsCluster,
      task: handleZipTask,
      container: handleZipContainer,
    });
    this.inspectionDataBucket.grantWrite(handleZipFileEventFn);
    dataReceptionBucket.grantRead(handleZipFileEventFn);

    this.dataProcessorLambdaServiceRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: [handleZipTask.taskDefinitionArn],
        actions: ['ecs:RunTask'],
      }),
    );
    // TODO: Validate if this permission is necessary
    this.dataProcessorLambdaServiceRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ['*'],
        actions: ['iam:PassRole'],
      }),
    );
    // TODO: Validate if this permission is necessary
    this.dataProcessorLambdaServiceRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: [ecsCluster.clusterArn],
        actions: ['ecs:DescribeTasks'],
      }),
    );

    const zipFileHandlerSourceSuffixes = [ZIP_SUFFIX];
    zipFileHandlerSourceSuffixes.forEach(suffix => {
      handleZipFileEventFn.addEventSource(
        new S3EventSource(dataReceptionBucket, {
          events: [s3.EventType.OBJECT_CREATED],
          filters: [
            {
              suffix,
            },
          ],
        }),
      );
    });

    // Create meta data parser lambda, grant permissions and create event sources
    this.handleInspectionFileEventFn = this.createInspectionFileEventHandler({
      name: 'dp-handler-inspection-file',
      openSearchDomainEndpoint: openSearchDomain.domainEndpoint,
      configurationBucketName: configurationBucket.bucketName,
      openSearchMetadataIndex: openSearchMetadataIndex,
      configurationFile: parserConfigurationFile,
      lambdaRole: this.dataProcessorLambdaServiceRole,
      raitaStackIdentifier,
      vpc,
    });
    // Grant lambda permissions to buckets
    configurationBucket.grantRead(this.handleInspectionFileEventFn);
    this.inspectionDataBucket.grantRead(this.handleInspectionFileEventFn);
    // Grant lamba permissions to OpenSearch index
    openSearchDomain.grantIndexReadWrite(
      openSearchMetadataIndex,
      this.handleInspectionFileEventFn,
    );

    // Add s3 event source with filter for each targeted file suffix
    const metaDataFileSuffixes = Object.values(
      fileSuffixesToIncudeInMetadataParsing,
    );
    metaDataFileSuffixes.forEach(suffix => {
      this.handleInspectionFileEventFn.addEventSource(
        new S3EventSource(this.inspectionDataBucket, {
          events: [s3.EventType.OBJECT_CREATED],
          filters: [
            {
              suffix,
            },
          ],
        }),
      );
    });
  }

  /**
   * Creates the parser lambda and add S3 buckets as event sources,
   * granting lambda read access to these buckets
   */
  private createZipFileEventHandler({
    name,
    targetBucket,
    lambdaRole,
    raitaStackIdentifier,
    vpc,
    cluster,
    task,
    container,
  }: {
    name: string;
    targetBucket: s3.Bucket;
    lambdaRole: iam.Role;
    raitaStackIdentifier: string;
    vpc: IVpc;
    cluster: cdk.aws_ecs.Cluster;
    task: cdk.aws_ecs.FargateTaskDefinition;
    container: cdk.aws_ecs.ContainerDefinition;
  }) {
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 8192,
      timeout: Duration.seconds(900),
      runtime: Runtime.NODEJS_16_X,
      handler: 'handleZipFileEvent',
      entry: path.join(
        __dirname,
        `../backend/lambdas/dataProcess/handleZipFileEvent/handleZipFileEvent.ts`,
      ),
      environment: {
        ECS_CLUSTER_ARN: cluster.clusterArn,
        ECS_TASK_ARN: task.taskDefinitionArn,
        CONTAINER_NAME: container.containerName,
        TARGET_BUCKET_NAME: targetBucket.bucketName,
        SUBNET_IDS: vpc.privateSubnets.map(sn => sn.subnetId).join(','),
      },
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnets: vpc.privateSubnets,
      },
    });
  }

  /**
   * Creates the parser lambda and add S3 buckets as event sources,
   * granting lambda read access to these buckets
   */
  private createInspectionFileEventHandler({
    name,
    openSearchDomainEndpoint,
    configurationBucketName,
    configurationFile,
    openSearchMetadataIndex,
    lambdaRole,
    raitaStackIdentifier,
    vpc,
  }: {
    name: string;
    openSearchDomainEndpoint: string;
    configurationBucketName: string;
    configurationFile: string;
    lambdaRole: iam.Role;
    openSearchMetadataIndex: string;
    raitaStackIdentifier: string;
    vpc: IVpc;
  }) {
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'handleInspectionFileEvent',
      entry: path.join(
        __dirname,
        `../backend/lambdas/dataProcess/handleInspectionFileEvent/handleInspectionFileEvent.ts`,
      ),
      environment: {
        OPENSEARCH_DOMAIN: openSearchDomainEndpoint,
        CONFIGURATION_BUCKET: configurationBucketName,
        CONFIGURATION_FILE: configurationFile,
        METADATA_INDEX: openSearchMetadataIndex,
        REGION: this.region,
      },
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnets: vpc.privateSubnets,
      },
    });
  }

  /**
   * Creates a policy permitting sftpUser access to data reception bucket
   */
  private createSftpReceivePolicy({
    sftpPolicyAccountId,
    dataReceptionBucket,
    sftpPolicyUserId,
  }: {
    sftpPolicyAccountId: string;
    sftpPolicyUserId: string;
    dataReceptionBucket: Bucket;
  }) {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.AccountPrincipal(sftpPolicyAccountId)],
      actions: [
        's3:GetObject',
        's3:GetObjectVersion',
        's3:GetObjectAcl',
        's3:PutObject',
        's3:PutObjectAcl',
        's3:ListBucket',
        's3:GetBucketLocation',
      ],
      resources: [
        dataReceptionBucket.bucketArn,
        `${dataReceptionBucket.bucketArn}/${raitaSourceSystems.Meeri}/*`,
      ],
      conditions: {
        StringLike: {
          'aws:userId': `${sftpPolicyUserId}:*`,
        },
      },
    });
  }

  private createZipHandlerECSResources({
    raitaStackIdentifier,
    vpc,
  }: {
    raitaStackIdentifier: string;
    vpc: IVpc;
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
    // const zipTaskExecutionRole = createRaitaServiceRole({
    //   scope: this,
    //   name: 'RaitaZipTaskExecutionRole',
    //   servicePrincipal: 'ecs.amazonaws.com',
    //   policyName: 'AmazonEC2ContainerRegistryReadOnly',
    //   raitaStackIdentifier,
    // });
    // ecr.AuthorizationToken.grantRead(zipTaskExecutionRole);

    const handleZipTask = new ecs.FargateTaskDefinition(
      this,
      `task-${raitaStackIdentifier}-handle-zip`,
      {
        memoryLimitMiB: 61440,
        cpu: 8192,
        ephemeralStorageGiB: 100,
        // executionRole: zipTaskExecutionRole,
        runtimePlatform: {
          cpuArchitecture: ecs.CpuArchitecture.X86_64,
          operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
        },
      },
    );
    // Repository for storing docker images
    const ecsRepo = new ecr.Repository(this, 'repository-raita', {
      repositoryName: `repository-${raitaStackIdentifier}-zip-handler`,
      lifecycleRules: [{ maxImageCount: 3 }],
    });
    const handleZipContainer = handleZipTask.addContainer(
      `container-${raitaStackIdentifier}-zip-handler`,
      {
        image: ecs.ContainerImage.fromEcrRepository(ecsRepo, 'latest'),
        logging: new ecs.AwsLogDriver({
          streamPrefix: 'FargateHandleZip',
          logRetention: RetentionDays.ONE_WEEK,
        }),
        environment: {
          AWS_REGION: this.region,
        },
      },
    );
    return { ecsCluster, handleZipTask, handleZipContainer };
  }
}
