import { SecretValue, Stack } from 'aws-cdk-lib';
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { Cache, LocalCacheMode } from 'aws-cdk-lib/aws-codebuild';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import getconfig from '../lambda/config';

/**
 * The stack that defines the application pipeline
 */
export class RaitaPipelineStack extends Stack {
  constructor(scope: Construct) {
    const config = getconfig();
    super(scope, 'raita-pipeline', {
      stackName: 'raita-pipeline-' + config.env,
      env: {
        region: 'eu-west-1',
      },

      tags: config.tags,
    });

    const pipeline = new CodePipeline(this, 'Raita-Pipeline', {
      pipelineName: 'Raita-' + config.env,
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub(
          'finnishtransportagency/raita',
          config.branch,
          {
            authentication: SecretValue.secretsManager(
              config.authenticationToken,
            ),
          },
        ),
        commands: ['npm ci', 'npm run deploy:raita:dev'],
      }),
      dockerEnabledForSynth: true,
      codeBuildDefaults: {
        // TODO: Cacheing not working currently
        cache: Cache.local(
          LocalCacheMode.CUSTOM,
          LocalCacheMode.SOURCE,
          LocalCacheMode.DOCKER_LAYER,
        ),
        rolePolicy: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['cloudformation:DescribeStacks'],
            // principals: [new AnyPrincipal()],
            // TODO: FIX THIS! No '*'!
            resources: [
              '*',
              'arn:aws:cloudformation:' +
                this.region +
                ':' +
                this.account +
                ':stack/CDKToolkit/*',
            ],
          }),
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['ssm:GetParameter'],
            // TODO: FIX THIS! No '*'!
            resources: [
              '*',
              'arn:aws:ssm:' +
                this.region +
                ':' +
                this.account +
                ':parameter/cdk-bootstrap/*',
            ],
          }),
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['sts:AssumeRole'],
            // TODO: FIX THIS! No '*'!
            resources: [
              '*',
              'arn:aws:ssm:' +
                this.region +
                ':' +
                this.account +
                ':role/cdk-*-file-publishing-role-' +
                this.account +
                '-' +
                this.region,
            ],
          }),
        ],
      },
    });
  }
}
