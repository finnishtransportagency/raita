import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface PsqlClientStackProps extends cdk.NestedStackProps {
  readonly raitaStackIdentifier: string;
  readonly vpc: ec2.IVpc;
  readonly securityGroup: ec2.ISecurityGroup;
}

export class PsqlClientStack extends cdk.NestedStack {
  readonly psqlClientRole: Role;

  constructor(scope: Construct, id: string, props: PsqlClientStackProps) {
    super(scope, id, props);
    const {
      raitaStackIdentifier,
      vpc,
      securityGroup,
    } = props;

    this.psqlClientRole = new Role(this, 'RaitaEc2PsqlClientRole', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });
    const userData = this.createPsqlClientUserData();
    this.createPsqlClientHost({
      name: 'psqlClient',
      userData,
      role: this.psqlClientRole,
      vpc,
      securityGroup,
      raitaStackIdentifier,
    });
  }

  /**
   * Creates user data for psqlClient host.
   */
  private createPsqlClientUserData() {
    const userData = ec2.UserData.forLinux();
    const userDataCommands = [
      'sudo yum update -y',
      'sudo yum install postgresql15 -y',
    ];
    userData.addCommands(...userDataCommands);
    return userData;
  }

  private createPsqlClientHost({
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
        ec2.InstanceSize.MICRO,
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      role,
      userData,
    });
  }
}
