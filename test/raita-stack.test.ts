import { Template } from 'aws-cdk-lib/assertions';
import { RaitaStack } from '../lib/raita-stack';
import { RaitaStackTestProps, testStack } from './testUtils';

/**
 * A rudimentary test to serve as an example for adding tests
 */
test('Raita stack has a child stack', () => {
  const stack = new RaitaStack(testStack, 'raita-stack', RaitaStackTestProps);
  const template = Template.fromStack(stack);
  template.resourceCountIs('AWS::CloudFormation::Stack', 1);
});
