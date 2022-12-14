import { Template } from 'aws-cdk-lib/assertions';
import { RaitaApplicationStackTestProps, testStack } from './testUtils';
import { ApplicationStack } from '../lib/raita-application';

/**
 * A rudimentary test to serve as an example for adding tests
 */
test('Raita application stack has an OpenSearch domain', () => {
  const stack = new ApplicationStack(
    testStack,
    'raita-application-stack',
    RaitaApplicationStackTestProps,
  );
  const template = Template.fromStack(stack);
  template.resourceCountIs('AWS::OpenSearchService::Domain', 1);
});
