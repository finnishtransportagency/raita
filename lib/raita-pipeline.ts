import {
  aws_codebuild,
  RemovalPolicy,
  SecretValue,
  Stack,
  StackProps,
  Stage,
  StageProps,
  Tags,
} from 'aws-cdk-lib';
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
    Step,
  ICodePipelineActionFactory,
  ProduceActionOptions,
  CodePipelineActionFactoryResult,
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
import { Pipeline, IStage, Artifact } from 'aws-cdk-lib/aws-codepipeline';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { isDevelopmentPreMainStack } from './utils';
import { PipelineProject } from 'aws-cdk-lib/aws-codebuild';
import {CodeBuildAction} from "aws-cdk-lib/aws-codepipeline-actions";



class MyStep extends Step implements ICodePipelineActionFactory {
  constructor(

  ) {
    super('MyStep');

    // This is necessary if your step accepts parameters, like environment variables,
    // that may contain outputs from other steps. It doesn't matter what the
    // structure is, as long as it contains the values that may contain outputs.
    this.discoverReferencedOutputs({
      env: { /* ... */ }
    });
  }

  public produceAction(stage: IStage, options: ProduceActionOptions): CodePipelineActionFactoryResult {

    // This is where you control what type of Action gets added to the
    // CodePipeline
    stage.addAction(new cpactions.JenkinsAction({
      // Copy 'actionName' and 'runOrder' from the options
      actionName: options.actionName,
      runOrder: options.runOrder,

      // Jenkins-specific configuration
      type: cpactions.JenkinsActionType.TEST,
      jenkinsProvider: this.provider,
      projectName: 'MyJenkinsProject',

      // Translate the FileSet into a codepipeline.Artifact
      inputs: [options.artifacts.toCodePipeline(this.input)],
    }));

    return { runOrdersConsumed: 1 };
  }
}

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
      restartExecutionOnUpdate: true,
    });
    // Can't start build process otherwise
    pipeline.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['codebuild:StartBuild'],
        resources: ['*'],
      }),
    );

    const githubSource = CodePipelineSource.gitHub(
      'finnishtransportagency/raita',
      config.branch,
      {
        authentication: SecretValue.secretsManager(config.authenticationToken),
      },
    );

    const overwriteBaseUrl = isDevelopmentPreMainStack(
      config.stackId,
      config.env,
    )
      ? `/${config.stackId}`
      : '';

    const codeBuildProject = new PipelineProject(this, 'MyProject', {
      buildSpec: aws_codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          build: {
            commands: ['echo "Hello, CodeBuild!"'],
          },
        },
      }),
    });

    const deployInput = new Artifact();

    new Pipeline(this, 'Pipeline', {
      stages: [
        // ...
        {
          stageName: 'Deploy',
          actions: [
            new CodeBuildAction({
              actionName: 'InvalidateCache',
              project: invalidateBuildProject,
              input: deployInput,
              runOrder: 2,
            }),
          ],
        },
      ],
    });

    const codePipeline = new CodePipeline(
      this,
      `pipeline-raita-${config.stackId}`,
      {
        codePipeline: pipeline,
        synth: new ShellStep('Synth', {
          input: githubSource,
          installCommands: ['npm ci', 'npm --prefix frontend ci'],
          env: {
            NEXT_PUBLIC_RAITA_BASEURL: overwriteBaseUrl,
          },
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
        tags: config.tags,
      }),
      {
        pre: [
          new ShellStep('UnitTest', {
            input: githubSource,
            installCommands: ['npm ci', 'npm --prefix frontend ci'],
            commands: ['npm run test', 'npm run --prefix frontend test'],
          }),
        ],
      },
    );
  }
}

interface RaitaStageProps extends StageProps {
  readonly stackId: string;
  readonly raitaEnv: RaitaEnvironment;
  readonly tags: { [key: string]: string };
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
        tags: props.tags,
      },
    );
    Object.entries(props.tags).forEach(([key, value]) =>
      Tags.of(raitaStack).add(key, value),
    );
  }
}
