import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Duration, NestedStack, NestedStackProps } from 'aws-cdk-lib';
import {
  AccountPrincipal,
  Effect,
  PolicyStatement,
  Role,
} from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { S3EventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import { Domain } from 'aws-cdk-lib/aws-opensearchservice';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as path from 'path';
import { RaitaEnvironment } from './config';
import { fileSuffixesToIncudeInMetadataParsing } from '../constants';
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
  public readonly dataProcessorLambdaServiceRole: Role;
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
    });

    const sftpReceivePolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      principals: [new AccountPrincipal(sftpPolicyAccountId)],
      actions: [
        's3:GetObject',
        's3:GetObjectVersion',
        's3:GetObjectAcl',
        's3:PutObject',
        's3:PutObjectAcl',
        's3:DeleteObject',
        's3:DeleteObjectVersion',
        's3:ListBucket',
        's3:GetBucketLocation',
      ],
      resources: [
        dataReceptionBucket.bucketArn,
        `${dataReceptionBucket.bucketArn}/meeri/*`,
      ],
      conditions: {
        StringLike: {
          'aws:userId': `${sftpPolicyUserId}:*`,
        },
      },
    });

    // Create zip handler lambda, grant permissions and create event sources
    const handleZipFileEventFn = this.createZipFileEventHandler({
      name: 'dp-handler-zip-file',
      targetBucket: this.inspectionDataBucket,
      lambdaRole: this.dataProcessorLambdaServiceRole,
      raitaStackIdentifier,
      vpc,
    });
    this.inspectionDataBucket.grantWrite(handleZipFileEventFn);
    dataReceptionBucket.grantRead(handleZipFileEventFn);
    const fileSuffixes = ['zip']; // Hard coded in initial setup
    fileSuffixes.forEach(suffix => {
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
  }: {
    name: string;
    targetBucket: s3.Bucket;
    lambdaRole: Role;
    raitaStackIdentifier: string;
    vpc: IVpc;
  }) {
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 1024,
      timeout: Duration.seconds(5),
      runtime: Runtime.NODEJS_16_X,
      handler: 'handleZipFileEvent',
      entry: path.join(
        __dirname,
        `../backend/lambdas/dataProcess/handleZipFileEvent/handleZipFileEvent.ts`,
      ),
      environment: {
        TARGET_BUCKET_NAME: targetBucket.bucketName,
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
    lambdaRole: Role;
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
}
