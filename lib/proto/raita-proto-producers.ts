import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import * as path from 'path';
import { DatabaseEnvironmentVariables, RaitaEnvironment } from '../config';
import { prismaBundlingOptions } from '../utils';
import { createRaitaServiceRole } from '../raitaResourceCreators';

interface ProtoProducerStackProps extends cdk.NestedStackProps {
  readonly raitaStackIdentifier: string;
  readonly vpc: ec2.IVpc;
  readonly albDns: string;
  readonly raitaEnv: RaitaEnvironment;
}

export class ProtoProducerStack extends cdk.NestedStack {
  readonly bastionRole: Role;

  constructor(scope: Construct, id: string, props: ProtoProducerStackProps) {
    super(scope, id, props);
    const { raitaStackIdentifier, vpc, albDns, raitaEnv } = props;

    const producerRole: Role = createRaitaServiceRole({
      scope: this,
      name: 'RaitaProtoProducerServiceRole',
      servicePrincipal: 'lambda.amazonaws.com',
      policyName: 'service-role/AWSLambdaVPCAccessExecutionRole',
      raitaStackIdentifier,
    });

    const producer1 = this.createProducerDataFunction({
      name: 'proto-producer-1',
      lambdaRole: producerRole,
      raitaStackIdentifier,
      vpc,
      raitaEnv,
      apiDns: albDns,
    });
    // const producer2 = this.createProducerDataFunction({
    //   name: 'proto-producer-2',
    //   lambdaRole: producerRole,
    //   raitaStackIdentifier,
    //   vpc,
    //   raitaEnv,
    // });

    // TODO producer time to send message
  }

  private createProducerDataFunction({
    name,
    lambdaRole,
    raitaStackIdentifier,
    vpc,
    raitaEnv,
    apiDns,
    // databaseEnvironmentVariables,
    // prismaLambdaLayer,
    // conversionQueue,
  }: {
    name: string;
    lambdaRole: iam.Role;
    raitaStackIdentifier: string;
    vpc: IVpc;
    raitaEnv: string;
    apiDns: string;
    // databaseEnvironmentVariables: DatabaseEnvironmentVariables;
    // prismaLambdaLayer: lambda.LayerVersion;
    // conversionQueue: Queue;
  }) {
    //   const endpointUrl = `${apiDns}/api/input`; // TODO
    //   return new NodejsFunction(this, name, {
    //     functionName: `lambda-${raitaStackIdentifier}-${name}`,
    //     memorySize: 1024,
    //     timeout: cdk.Duration.seconds(300), // TODO: what is a maximum realistic running time?
    //     runtime: lambda.Runtime.NODEJS_20_X,
    //     handler: 'handleCreateProducerData',
    //     entry: path.join(
    //       __dirname,
    //       `../../backend/lambdas/proto/dataProducer/handleCreateProducerData.ts`,
    //     ),
    //     // reservedConcurrentExecutions: 2, // TODO: this needs to be minimum 2 when processing queue. Need to ensure files are not handled twice if triggered manually?
    //     environment: {
    //       REGION: this.region,
    //       ENVIRONMENT: raitaEnv,
    //       // ...databaseEnvironmentVariables,
    //       ENDPOINT_URL: endpointUrl,
    //     },
    //     bundling: prismaBundlingOptions,
    //     // layers: [prismaLambdaLayer],
    //     role: lambdaRole,
    //     vpc,
    //     vpcSubnets: {
    //       subnets: vpc.privateSubnets,
    //     },
    // });
  }
}
