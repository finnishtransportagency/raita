import {
  RemovalPolicy,
  SecretValue,
  Stack,
  StackProps,
  Stage,
  StageProps,
  Tags,
} from 'aws-cdk-lib';
import {
  CodeBuildStep,
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import {
  BuildEnvironmentVariableType,
  Cache,
  LinuxBuildImage,
  LocalCacheMode,
} from 'aws-cdk-lib/aws-codebuild';
import { RaitaStack } from './raita-stack';
import { getPipelineConfig, RaitaEnvironment } from './config';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { isDevelopmentMainStack, isDevelopmentPreMainStack } from './utils';

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

    const confFileDir = isDevelopmentPreMainStack(config.stackId, config.env)
      ? `premain`
      : isDevelopmentMainStack(config.stackId, config.env)
      ? `main`
      : 'prod';

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
        post: [
          new CodeBuildStep('Flyway', {
            input: githubSource,
            buildEnvironment: {
              environmentVariables: {
                DB_PASSWORD: {
                  type: BuildEnvironmentVariableType.SECRETS_MANAGER,
                  value: 'database_password',
                },
                DOCKER_PASSWORD: {
                  type: BuildEnvironmentVariableType.SECRETS_MANAGER,
                  value: 'docker_password',
                },
                CONF_FILE_DIR: {
                  type: BuildEnvironmentVariableType.PLAINTEXT,
                  value: confFileDir,
                },
              },
            },
            commands: [
              'printenv',
              'echo $DB_PASSWORD',
              'echo $DOCKER_PASSWORD',
              'echo $CONF_FILE_DIR',
              'echo Logging in to Docker hub...',
              'docker login -u=raita2dockeruser -p=$DOCKER_PASSWORD',
              'docker run --rm -v $(pwd)/backend/db/migration:/flyway/sql -v $(pwd)/backend/db/conf/$CONF_FILE_DIR:/flyway/conf flyway/flyway migrate -password=$DB_PASSWORD',
            ],
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
