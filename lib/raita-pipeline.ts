import { SecretValue, Stack, Stage, StageProps } from 'aws-cdk-lib';
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { Cache, LocalCacheMode } from 'aws-cdk-lib/aws-codebuild';
import { RaitaStack } from './raita-stack';
import { getEnv } from '../utils';

const getPipelineConfig = () => {
  const env = getEnv('ENVIRONMENT');
  const stackId = getEnv('STACK_ID');
  const branch = getEnv('BRANCH');
  const allowedEnvironments = ['dev', 'prod'];

  if (!allowedEnvironments.includes(env)) {
    throw new Error(
      `Only ${allowedEnvironments.join(
        ' ,',
      )} are allowed environment values, received ${env}`,
    );
  }

  // TODO: Add validations that tie AWS Account to allowed environment variable values.
  // Possibly using parameter store?
  if (env === 'prod' && stackId !== 'prod') {
    throw new Error('In production only allowed stackId is "prod".');
  }

  return {
    tags: {
      Environment: env,
      Project: 'raita',
    },
    env,
    stackId,
    region: 'eu-west-1',
    branch,
    authenticationToken: 'github-token',
  };
};

/**
 * The stack that defines the application pipeline
 */
export class RaitaPipelineStack extends Stack {
  constructor(scope: Construct) {
    const config = getPipelineConfig();
    super(scope, 'stack-pipeline-raita' + config.stackId, {
      env: {
        region: config.region,
      },
      tags: config.tags,
    });

    const pipeline = new CodePipeline(
      this,
      `pipeline-raita-${config.stackId}`,
      {
        // pipelineName: 'pipeline-raita-' + config.stackId,
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
          commands: ['npm ci', 'npm run synth:pipeline:' + config.env],
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
      new RaitaApplication(this, config.env, {
        stackId: config.env,
        tags: config.tags,
      }),
    );
  }
}

interface RaitaStageProps extends StageProps {
  readonly stackId: string;
  readonly tags: Record<string, string>;
}

class RaitaApplication extends Stage {
  constructor(scope: Construct, id: string, props: RaitaStageProps) {
    super(scope, id, props);
    const raitaStack = new RaitaStack(this, 'Raita', {
      stackId: props.stackId,
      tags: props.tags,
    });
  }
}
