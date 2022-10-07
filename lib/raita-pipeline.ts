import { SecretValue, Stack, StackProps, Stage, StageProps } from 'aws-cdk-lib';
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { Cache, LocalCacheMode } from 'aws-cdk-lib/aws-codebuild';
import { RaitaStack } from './raita-stack';
import { getEnvOrFail } from '../utils';

export type RaitaEnvironment = typeof environments[keyof typeof environments];

function isRaitaEnvironment(arg: string | undefined): arg is RaitaEnvironment {
  return !!arg && Object.values(environments).includes(arg as any);
}

const environments = {
  dev: 'dev',
  prod: 'prod',
} as const;
// NOTE: TO BE DECIDED AND POSSIBLY MOVED AROUND
const productionBranch = 'prod';
const developmentMainBranch = 'main';
const productionStackId = 'prod';

const getStackIdForNonProdEnvironment = (branch: string): string => {
  // For development main branch the stackId is always fixed
  if (branch == developmentMainBranch) {
    return 'main';
  }
  // For production branch the stackId is always fixed (even when env is not prod)
  if (branch == productionBranch) {
    return 'prod';
  }
  // StackId can optionally explicitly given in environment variable
  if (process.env['STACK_ID']) {
    return process.env['STACK_ID'];
  }
  // Extract the ticket number as stackId
  const ticketIdRegex = /(raita-\d+)/i;
  const res = ticketIdRegex.exec(branch);
  const val = res?.[1];
  if (val) {
    return val.toLowerCase();
  }
  // One of the above conditions must be met, othewise fail
  throw new Error(`Failed to get stackId for branch ${branch}`);
};

const getPipelineConfig = () => {
  const envFromEnvironment = getEnvOrFail('ENVIRONMENT');
  if (isRaitaEnvironment(envFromEnvironment)) {
    // Determine which Gitbub branch to use: Branch for production env is fixed, for other environments it is read from environment
    const branch =
      envFromEnvironment === environments.prod
        ? productionBranch
        : getEnvOrFail('BRANCH');
    // Determine stackId: StackId in production is fixed, for other environemnts it is selected based on branch value (and optional environment variable)
    const stackId =
      envFromEnvironment === environments.prod
        ? productionStackId
        : getStackIdForNonProdEnvironment(branch);
    return {
      env: envFromEnvironment,
      branch,
      stackId,
      authenticationToken: 'github-token',
      tags: {
        Environment: envFromEnvironment,
        Project: 'raita',
      },
    };
  }
  throw new Error(
    `Environment value ${envFromEnvironment} for ENVIRONMENT is not valid Raita environment.`,
  );
};

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
      new RaitaApplicationStage(this, `raita`, {
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
    const raitaStack = new RaitaStack(this, props.stackId, {
      raitaEnv: props.raitaEnv,
    });
  }
}
