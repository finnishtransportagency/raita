import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { DatabaseEnvironmentVariables, RaitaEnvironment } from '../config';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { FilterOrPolicy, SubscriptionFilter, Topic } from 'aws-cdk-lib/aws-sns';
import { SnsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

import { createRaitaServiceRole } from '../raitaResourceCreators';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { SqsSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';

interface ExternalNotificationProps extends cdk.NestedStackProps {
  readonly raitaStackIdentifier: string;
  readonly vpc: ec2.IVpc;
  readonly raitaEnv: RaitaEnvironment;
  readonly dataReceptionBucket: Bucket;
  readonly inspectionDataBucket: Bucket;
  readonly externalDataBucket: Bucket;
}

/**
 * Proto stuff in this stack
 */
export class ExternalNotificationStack extends cdk.NestedStack {
  readonly bastionRole: Role;
  readonly externalErrorTopic: Topic;
  readonly externalNewDataTopic: Topic;

  constructor(scope: Construct, id: string, props: ExternalNotificationProps) {
    super(scope, id, props);
    const {
      raitaStackIdentifier,
      vpc,
      raitaEnv,
      dataReceptionBucket,
      inspectionDataBucket,
      externalDataBucket,
    } = props;

    const role: Role = createRaitaServiceRole({
      scope: this,
      name: 'RaitaProtoExternalDataStackRole',
      servicePrincipal: 'lambda.amazonaws.com',
      policyName: 'service-role/AWSLambdaVPCAccessExecutionRole',
      raitaStackIdentifier,
    });

    // forward message here when new data is available in the system
    // different types of data are ready at different points in the data process
    // image: when received in inspection
    // document (txt, pdf) when handled by metadata parser
    // csv/numerical: when csv file is parsed and VKM conversion is done
    // status:
    // const messageFormat = {
    //   status: 'FULL_PARSED | RECEIVED',
    //   metadata: {...}
    // }
    this.externalNewDataTopic = new Topic(this, 'proto-new-data-topic');

    // forward some errors here
    // use case is to forward known error cases that indicate data errors to data producers
    // TODO: forward specific error messages to here?

    // const format = {
    //   message: ''
    // }
    // send messages here by filtering error alarms?
    this.externalErrorTopic = new Topic(this, 'proto-external-error-topic');

    // Add SQS queues for easily testing ans viewing the topic messages
    const testErrorQueue = new Queue(this, 'proto-error-test-queue');
    this.externalErrorTopic.addSubscription(
      new SqsSubscription(testErrorQueue),
    );

    const testIncomingDataQueue = new Queue(this, 'proto-incoming-data-queue');
    this.externalNewDataTopic.addSubscription(
      new SqsSubscription(testIncomingDataQueue, {
        filterPolicyWithMessageBody: {
          metadata: FilterOrPolicy.policy({
            report_type: FilterOrPolicy.filter(
              SubscriptionFilter.stringFilter({
                allowlist: ['Virhelistaus'],
              }),
            ),
            file_type: FilterOrPolicy.filter(
              SubscriptionFilter.stringFilter({
                allowlist: ['txt'],
              }),
            ),
          }),
          status: FilterOrPolicy.filter(
            SubscriptionFilter.stringFilter({
              allowlist: ['FULLY_PARSED'],
            }),
          ),
        },
      }),
    );

    // this will read file from S3 and input to external system
    const externalDataHandler = this.createExternalDataUploader({
      name: 'ext-data-uploader',
      lambdaRole: role,
      raitaStackIdentifier,
      vpc,
      raitaEnv,
      externalBucket: externalDataBucket.bucketName,
      inspectionBucket: inspectionDataBucket.bucketName,
    });

    inspectionDataBucket.grantRead(externalDataHandler);
    externalDataBucket.grantReadWrite(externalDataHandler);

    // listen to new data topic with some filters
    externalDataHandler.addEventSource(
      new SnsEventSource(this.externalNewDataTopic, {
        filterPolicyWithMessageBody: {
          metadata: FilterOrPolicy.policy({
            file_type: FilterOrPolicy.filter(
              SubscriptionFilter.stringFilter({
                allowlist: ['png'],
              }),
            ),
            data_location: FilterOrPolicy.filter(
              SubscriptionFilter.stringFilter({
                allowlist: ['PROTO_EXT'],
              }),
            ),
          }),
          status: FilterOrPolicy.filter(
            SubscriptionFilter.stringFilter({
              allowlist: ['FULLY_PARSED'],
            }),
          ),
        },
      }),
    );
  }

  private createExternalDataUploader({
    name,
    lambdaRole,
    raitaStackIdentifier,
    vpc,
    raitaEnv,
    externalBucket,
    inspectionBucket,
  }: {
    name: string;
    lambdaRole: Role;
    raitaStackIdentifier: string;
    vpc: ec2.IVpc;
    raitaEnv: string;
    externalBucket: string;
    inspectionBucket: string;
  }) {
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackIdentifier}-${name}`,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(300),
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handleExternalDataUpload',
      entry: path.join(
        __dirname,
        `../../backend/lambdas/proto/externalData/externalUploader.ts`,
      ),
      environment: {
        REGION: this.region,
        ENVIRONMENT: raitaEnv,
        TARGET_BUCKET: externalBucket,
        SOURCE_BUCKET: inspectionBucket,
      },
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnets: vpc.privateSubnets,
      },
    });
  }
}
