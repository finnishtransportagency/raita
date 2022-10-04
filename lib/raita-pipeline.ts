import { SecretValue, Stack, Stage, StageProps } from 'aws-cdk-lib';
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { Cache, LocalCacheMode } from 'aws-cdk-lib/aws-codebuild';
import getconfig from '../lambda/config';
import { RaitaStack } from './raita-stack';

/**
 * The stack that defines the application pipeline
 */
export class RaitaPipelineStack extends Stack {
  constructor(scope: Construct) {
    const config = getconfig();
    super(scope, 'raita-pipeline-' + config.env, {
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
        commands: [
          'npm ci',
          `npm run pipeline:synth --environment=${config.env} --branch=${config.branch}`,
        ],
      }),
      dockerEnabledForSynth: true,
      codeBuildDefaults: {
        // TODO: Cacheing not working currently
        cache: Cache.local(
          LocalCacheMode.CUSTOM,
          LocalCacheMode.SOURCE,
          LocalCacheMode.DOCKER_LAYER,
        ),
      },
    });
    pipeline.addStage(new RaitaApplication(this, config.env));
  }
}
class RaitaApplication extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);
    const raitaStack = new RaitaStack(this, 'Raita');
  }
}
