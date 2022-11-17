import {
  RemovalPolicy,
  SecretValue,
  Stack,
  StackProps,
  Stage,
  StageProps,
} from 'aws-cdk-lib';
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import {
  Cache,
  LinuxBuildImage,
  LocalCacheMode,
} from 'aws-cdk-lib/aws-codebuild';
import { RaitaStack } from './raita-stack';
import { getPipelineConfig, RaitaEnvironment } from './config';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';

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

    const artifactBucket = new Bucket(
      this,
      `s3-pipeline-raita-${config.stackId}`,
      {
        autoDeleteObjects: true,
        removalPolicy: RemovalPolicy.DESTROY,
      },
    );

    const pipeline = new Pipeline(this, 'pipeline', {
      artifactBucket: artifactBucket,
      pipelineName: `cpl-raita-${config.stackId}`,
    });
    pipeline.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['codebuild:StartBuild'],
        resources: ['*'],
      }),
    );

    const codePipeline = new CodePipeline(
      this,
      `pipeline-raita-${config.stackId}`,
      {
        codePipeline: pipeline,
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
          installCommands: ['npm ci', 'npm --prefix frontend ci'],
          commands: [
            'npm run --prefix frontend build',
            `npm run pipeline:synth --environment=${config.env} --branch=${config.branch} --stackid=${config.stackId}`,
          ],
        }),
        dockerEnabledForSynth: true,
        codeBuildDefaults: {
          buildEnvironment: {
            buildImage: LinuxBuildImage.STANDARD_6_0,
          },
          // TODO: Cacheing not working currently
          cache: Cache.local(
            LocalCacheMode.CUSTOM,
            LocalCacheMode.SOURCE,
            LocalCacheMode.DOCKER_LAYER,
          ),
        },
      },
    );
    codePipeline.addStage(
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
        stackId: props.stackId,
      },
    );
  }
}
