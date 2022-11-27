import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface RaitaBastionStackProps extends cdk.NestedStackProps {
  readonly raitaStackIdentifier: string;
  readonly vpc: ec2.IVpc;
  readonly securityGroup: ec2.ISecurityGroup;
  readonly albDns: string;
  readonly databaseDomainName: string;
}

export class BastionStack extends cdk.NestedStack {
  constructor(scope: Construct, id: string, props: RaitaBastionStackProps) {
    super(scope, id, props);
    const {
      raitaStackIdentifier,
      vpc,
      securityGroup,
      albDns,
      databaseDomainName,
    } = props;
    const bastionRole = new Role(this, 'RaitaEc2BastionRole', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });
    const userData = this.createBastionUserData({ albDns, databaseDomainName });
    this.createBastionHost({
      name: 'bastion',
      userData,
      role: bastionRole,
      vpc,
      securityGroup,
      raitaStackIdentifier,
    });
  }

  private createBastionUserData({
    albDns,
    databaseDomainName,
  }: {
    albDns: string;
    databaseDomainName: string;
  }) {
    const userData = ec2.UserData.forLinux();
    const userDataCommands = [
      'sudo yum update -y',
      'sudo yum install socat -y',
      `nohup socat TCP4-LISTEN:3001,reuseaddr,fork TCP:${albDns}:80 &`,
      `nohup socat TCP4-LISTEN:3002,reuseaddr,fork TCP:${cdk.Fn.sub(
        '${databaseDomainName}',
        {
          databaseDomainName,
        },
      )}:80 &`,
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
