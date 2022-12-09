import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface BastionStackProps extends cdk.NestedStackProps {
  readonly raitaStackIdentifier: string;
  readonly vpc: ec2.IVpc;
  readonly securityGroup: ec2.ISecurityGroup;
  readonly albDns: string;
  readonly databaseDomainEndpoint: string;
}

export class BastionStack extends cdk.NestedStack {
  readonly bastionRole: Role;

  constructor(scope: Construct, id: string, props: BastionStackProps) {
    super(scope, id, props);
    const {
      raitaStackIdentifier,
      vpc,
      securityGroup,
      albDns,
      databaseDomainEndpoint,
    } = props;

    this.bastionRole = new Role(this, 'RaitaEc2BastionRole', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });
    const userData = this.createBastionUserData({
      albDns,
      databaseDomainEndpoint,
    });
    this.createBastionHost({
      name: 'bastion',
      userData,
      role: this.bastionRole,
      vpc,
      securityGroup,
      raitaStackIdentifier,
    });
  }

  /**
   * Creates user data for bastion host.
   * Requires databaseDomainEndpoint parameter, which is currently unused, in preparation
   * for setting a pipe directly to the database (to be added later).
   */
  private createBastionUserData({
    albDns,
  }: {
    albDns: string;
    databaseDomainEndpoint: string;
  }) {
    const userData = ec2.UserData.forLinux();
    const userDataCommands = [
      'sudo yum update -y',
      'sudo yum install socat -y',
      `nohup socat TCP4-LISTEN:3001,reuseaddr,fork TCP:${albDns}:80 &`,
    ];
    userData.addCommands(...userDataCommands);
    return userData;
  }

  private createBastionHost({
    raitaStackIdentifier,
    vpc,
    securityGroup,
    name,
    userData,
    role,
  }: {
    raitaStackIdentifier: string;
    vpc: ec2.IVpc;
    securityGroup: ec2.ISecurityGroup;
    name: string;
    userData: cdk.aws_ec2.UserData;
    role: Role;
  }) {
    new ec2.Instance(this, name, {
      instanceName: `ec2-${raitaStackIdentifier}-${name}`,
      vpc,
      securityGroup,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.SMALL,
      ),
      machineImage: ec2.MachineImage.genericLinux({
        'eu-west-1': 'ami-0b9b4e1a3d497aefa',
      }),
      role,
      userData,
    });
  }
}
