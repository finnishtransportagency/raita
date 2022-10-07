import { Template, Capture } from 'aws-cdk-lib/assertions';
import * as cdk from 'aws-cdk-lib';
import { RaitaStack } from '../lib/raita-stack';

test('Raita stack has identity pool', () => {
  const stack = new cdk.Stack();
  // WHEN
  new RaitaStack(stack, 'MyTestConstruct');
  // THEN

  const template = Template.fromStack(stack);
  template.resourceCountIs('AWS::Cognito::IdentityPool', 1);
});
