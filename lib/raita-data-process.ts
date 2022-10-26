import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Duration, NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { Role } from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { S3EventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Domain } from 'aws-cdk-lib/aws-opensearchservice';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as path from 'path';
import { RaitaEnvironment } from './config';
import { createRaitaBucket } from './utils';
import { fileSuffixesToIncudeInMetadataParsing } from '../constants';
import { createRaitaServiceRole } from './raitaResourceCreators';

interface DataProcessStackProps extends NestedStackProps {
  readonly raitaStackIdentifier: string;
  readonly raitaEnv: RaitaEnvironment;
  readonly vpc: Vpc;
  readonly openSearchDomain: Domain;
  readonly openSearchMetadataIndex: string;
  readonly parserConfigurationFile: string;
}

export class RaitaDataProcessStack extends NestedStack {
  public readonly dataProcessorlambdaServiceRole: Role;
  public readonly inspectionDataBucket: Bucket;

  constructor(scope: Construct, id: string, props: DataProcessStackProps) {
    super(scope, id, props);
    const {
      raitaStackIdentifier,
      raitaEnv,
      vpc,
      openSearchDomain,
      openSearchMetadataIndex,
      parserConfigurationFile,
    } = props;

    this.dataProcessorlambdaServiceRole = createRaitaServiceRole({
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
      name: 'parser-configuration-data',
      raitaEnv,
      raitaStackIdentifier: raitaStackIdentifier,
    });
    const dataReceptionBucket = createRaitaBucket({
      scope: this,
      name: 'data-reception',
      raitaEnv,
      raitaStackIdentifier,
    });

    // Create zip handler lambda, grant permissions and create event sources
    const zipHandlerFn = this.createZipHandler({
      name: 'zip-handler',
      targetBucket: this.inspectionDataBucket,
      lambdaRole: this.dataProcessorlambdaServiceRole,
      raitaStackIdentifier,
      vpc,
    });
    this.inspectionDataBucket.grantWrite(zipHandlerFn);
    dataReceptionBucket.grantRead(zipHandlerFn);
    const fileSuffixes = ['zip']; // Hard coded in initial setup
    fileSuffixes.forEach(suffix => {
      zipHandlerFn.addEventSource(
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
    const metadataParserFn = this.createMetadataParser({
      name: 'metadata-parser',
      openSearchDomainEndpoint: openSearchDomain.domainEndpoint,
      configurationBucketName: configurationBucket.bucketName,
      openSearchMetadataIndex: openSearchMetadataIndex,
      configurationFile: parserConfigurationFile,
      lambdaRole: this.dataProcessorlambdaServiceRole,
      raitaStackIdentifier,
      vpc,
    });
    // Grant lambda permissions to buckets
    configurationBucket.grantRead(metadataParserFn);
    this.inspectionDataBucket.grantRead(metadataParserFn);
    // Grant lamba permissions to OpenSearch index
    openSearchDomain.grantIndexReadWrite(
      openSearchMetadataIndex,
      metadataParserFn,
    );
    const metaDataFileSuffixes = Object.values(
      fileSuffixesToIncudeInMetadataParsing,
    );
    // TODO: Currently reacts only to CREATE events
    // OPEN: Currently separate event source for each suffix type. Replace with better alternative is exists?
    metaDataFileSuffixes.forEach(suffix => {
      metadataParserFn.addEventSource(
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
  private createZipHandler({
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
    vpc: Vpc;
  }) {
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 1024,
      timeout: Duration.seconds(5),
      runtime: Runtime.NODEJS_16_X,
      handler: 'handleZipCreated',
      entry: path.join(
        __dirname,
        `../backend/lambdas/handleZipCreated/handleZipCreated.ts`,
      ),
      environment: {
        TARGET_BUCKET_NAME: targetBucket.bucketName,
      },
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED,
      },
    });
  }

  /**
   * Creates the parser lambda and add S3 buckets as event sources,
   * granting lambda read access to these buckets
   */
  private createMetadataParser({
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
    vpc: Vpc;
  }) {
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'metadataParser',
      entry: path.join(
        __dirname,
        `../backend/lambdas/metadataParser/metadataParser.ts`,
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
        subnetType: SubnetType.PRIVATE_ISOLATED,
      },
    });
  }
}
