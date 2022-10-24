import {
  Duration,
  NestedStack,
  NestedStackProps,
  Stack,
  StackProps,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Role } from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { S3EventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { RaitaEnvironment } from './config';
import { createRaitaBucket } from './utils';

interface DataIngestionStackProps extends NestedStackProps {
  readonly raitaStackIdentifier: string;
  readonly raitaEnv: RaitaEnvironment;
  readonly targetBucket: s3.Bucket;
  readonly lambdaServiceRole: Role;
}

export class RaitaDataIngestionStack extends NestedStack {
  constructor(scope: Construct, id: string, props: DataIngestionStackProps) {
    super(scope, id, props);
    const { raitaStackIdentifier, raitaEnv, targetBucket, lambdaServiceRole } =
      props;

    const dataReceptionBucket = createRaitaBucket({
      scope: this,
      name: 'data-reception',
      raitaEnv,
      raitaStackIdentifier,
    });

    const metadataParserFn = this.createZipHandler({
      name: 'zip-handler',
      sourceBuckets: [targetBucket],
      targetBucket,
      lambdaRole: lambdaServiceRole,
      raitaStackIdentifier,
    });
  }

  /**
   * Creates the parser lambda and add S3 buckets as event sources,
   * granting lambda read access to these buckets
   */
  private createZipHandler({
    name,
    sourceBuckets,
    targetBucket,
    lambdaRole,
    raitaStackIdentifier,
  }: {
    name: string;
    sourceBuckets: Array<s3.Bucket>;
    targetBucket: s3.Bucket;
    lambdaRole: Role;
    raitaStackIdentifier: string;
  }) {
    const zipHandlerFn = new NodejsFunction(this, name, {
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
    });

    targetBucket.grantWrite(zipHandlerFn);

    sourceBuckets.forEach(bucket => {
      // Hard coded in initial setup
      const fileSuffixes = ['zip'];
      fileSuffixes.forEach(suffix => {
        zipHandlerFn.addEventSource(
          new S3EventSource(bucket, {
            events: [s3.EventType.OBJECT_CREATED],
            filters: [
              {
                suffix,
              },
            ],
          }),
        );
      });
      bucket.grantRead(zipHandlerFn);
    });
    return zipHandlerFn;
  }
}
