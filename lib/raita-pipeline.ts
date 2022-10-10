import { SecretValue, Stack, StackProps, Stage, StageProps } from 'aws-cdk-lib';
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { Cache, LocalCacheMode } from 'aws-cdk-lib/aws-codebuild';
import { RaitaStack } from './raita-stack';
import { getPipelineConfig, RaitaEnvironment } from './config';

/**
 * The stack that defines the application pipeline
 */
export class RaitaPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    const config = getPipelineConfig();
    super(scope, `stack-pipeline-raita-${config.stackId}`, {
      ...props,
      tags: config.tags,
    });

    const pipeline = new CodePipeline(
      this,
      `pipeline-raita-${config.stackId}`,
      {
        pipelineName: `pl-raita-${config.stackId}`,
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
            `npm run pipeline:synth --environment=${config.env} --branch=${config.branch} --stackid=${config.stackId}`,
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
      },
    );
    pipeline.addStage(
      new RaitaApplicationStage(this, `Raita`, {
        stackId: config.stackId,
        raitaEnv: config.env,
      }),
    );
  }
}

interface RaitaStageProps extends StageProps {
  readonly stackId: string;
  readonly raitaEnv: RaitaEnvironment;
}

class RaitaApplicationStage extends Stage {
  constructor(scope: Construct, id: string, props: RaitaStageProps) {
    super(scope, id, props);
    const raitaStack = new RaitaStack(
      this,
      `raita-${props.raitaEnv}-${props.stackId}`,
      {
        raitaEnv: props.raitaEnv,
      },
    );
  }
}
