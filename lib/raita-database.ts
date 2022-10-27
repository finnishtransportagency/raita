import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RaitaEnvironment } from './config';
import { getRemovalPolicy } from './utils';
import { AnyPrincipal, Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';

interface DatabaseStackProps extends NestedStackProps {
  readonly raitaStackIdentifier: string;
  readonly raitaEnv: RaitaEnvironment;
  readonly vpc: ec2.Vpc;
}

export class RaitaDatabaseStack extends NestedStack {
  public readonly openSearchDomain: opensearch.Domain;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);
    const { raitaStackIdentifier, raitaEnv, vpc } = props;

    // Create and configure OpenSearch domain
    this.openSearchDomain = this.createOpenSearchDomain({
      name: 'raitadb',
      raitaEnv: raitaEnv,
      vpc,
      raitaStackIdentifier,
    });
  }

  /**
   * Creates OpenSearch domain
   */
  private createOpenSearchDomain({
    name,
    raitaEnv,
    vpc,
    raitaStackIdentifier,
  }: {
    name: string;
    raitaEnv: RaitaEnvironment;
    vpc: ec2.Vpc;
    raitaStackIdentifier: string;
  }) {
    const domainName = `${name}-${raitaStackIdentifier}`;
    const domainArn =
      'arn:aws:es:' +
      this.region +
      ':' +
      this.account +
      ':domain/' +
      domainName +
      '/*';
    // TODO: Identify parameters to move to environment (and move)
    return new opensearch.Domain(this, domainName, {
      domainName,
      version: opensearch.EngineVersion.OPENSEARCH_1_0,
      removalPolicy: getRemovalPolicy(raitaEnv),
      ebs: {
        volumeSize: 10,
        volumeType: ec2.EbsDeviceVolumeType.GENERAL_PURPOSE_SSD,
      },
      capacity: {
        dataNodes: 1,
        dataNodeInstanceType: 't3.small.search',
      },
      nodeToNodeEncryption: true,
      encryptionAtRest: {
        enabled: true,
      },
      enforceHttps: true,
      // must be enabled if VPC contains multiple private subnets.
      // zoneAwareness: {
      //   enabled: true,
      // },
      vpc,
      vpcSubnets: [
        {
          subnets: vpc.isolatedSubnets.slice(0, 1),
        },
      ],
      accessPolicies: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['es:ESHttp*'],
          principals: [new AnyPrincipal()],
          resources: [domainArn],
        }),
      ],
    });
  }
}
