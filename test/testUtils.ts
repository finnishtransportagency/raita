import { Stack } from 'aws-cdk-lib';
import { SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { RaitaEnvironment } from '../lib/config';

export const testStack = new Stack();
const vpc = new Vpc(testStack, 'test-vpc');

export const RaitaStackTestProps = {
  raitaEnv: 'dev' as RaitaEnvironment,
  stackId: 'string',
  tags: { App: 'Raita' },
};

export const RaitaApplicationStackTestProps = {
  raitaStackIdentifier: 'test',
  stackId: 'test',
  raitaEnv: 'dev' as RaitaEnvironment,
  jwtTokenIssuer: 'test',
  vpc,
  raitaSecurityGroup: new SecurityGroup(testStack, 'test-stack', { vpc }),
  openSearchMetadataIndex: 'test',
  parserConfigurationFile: 'test',
  sftpPolicyAccountId: 'test',
  sftpPolicyUserId: 'test',
  cloudfrontDomainName: 'test',
};
