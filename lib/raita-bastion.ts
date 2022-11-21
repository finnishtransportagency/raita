import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { RaitaEnvironment } from './config';

interface RaitaBastionStackProps extends cdk.NestedStackProps {
  readonly raitaEnv: RaitaEnvironment;
  readonly vpc: ec2.IVpc;
  readonly albDns: string;
  readonly databaseDomainName: string;
}

export class BastionStack extends cdk.NestedStack {
  constructor(scope: Construct, id: string, props: RaitaBastionStackProps) {
    super(scope, id, props);
    const { raitaEnv, albDns, databaseDomainName, vpc } = props;

    // const securityGroup = SecurityGroup.fromSecurityGroupId(
    //   this,
    //   'rataextra-security-group',
    //   getSecurityGroupId(rataExtraEnv),
    // );

    const bastionRole = new Role(this, 'RaitaEc2BastionRole', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    const userData = ec2.UserData.forLinux();
    const userDataCommands = [
      'sudo yum update -y',
      'sudo yum install socat -y',
      `nohup socat TCP4-LISTEN:80,reuseaddr,fork TCP:${albDns}:80 &`,
      `nohup socat TCP4-LISTEN:9000,reuseaddr,fork TCP:${cdk.Fn.sub(
        '${databaseDomainName}',
        {
          databaseDomainName,
        },
      )}:80 &`,
    ];

    userData.addCommands(...userDataCommands);

    const bastion = new ec2.Instance(this, 'ec2-bastion-instance', {
      vpc,
      // securityGroup,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.SMALL,
      ),
      machineImage: ec2.MachineImage.genericLinux({
        'eu-west-1': 'ami-0b9b4e1a3d497aefa',
      }),
      role: bastionRole,
      userData,
    });
  }
}
