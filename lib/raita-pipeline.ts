import {
  BundlingOutput,
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
  DockerCredential,
  ShellStep,
  Step,
} from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import {
  BuildEnvironmentVariableType,
  BuildSpec,
  Cache,
  LinuxBuildImage,
  LocalCacheMode,
} from 'aws-cdk-lib/aws-codebuild';
import { RaitaStack } from './raita-stack';
import {
  getAccountVpcResourceConfig,
  getPipelineConfig,
  RaitaEnvironment,
} from './config';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Pipeline, PipelineType } from 'aws-cdk-lib/aws-codepipeline';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import {
  isDevelopmentMainStack,
  isDevelopmentPreMainStack,
  isPermanentStack,
  isProductionStack,
} from './utils';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { RaitaPipelineLockStack } from './raita-pipeline-lock';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Code, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import path from 'path';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';

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

    const prismaLambdaLayer = new LayerVersion(this, 'prisma-layer-version', {
      code: Code.fromAsset(path.join(__dirname, '../'), {
        bundling: {
          image: Runtime.NODEJS_20_X.bundlingImage,
          command: ['bash', './create-prisma-lambda-layer.sh'],
          outputType: BundlingOutput.NOT_ARCHIVED,
          workingDirectory: '/asset-input',
        },
      }),
    });

    // Get config based on Raita environment
    const vpcConfig = getAccountVpcResourceConfig(config.env);

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
      pipelineType: PipelineType.V2,
    });
    // Can't start build process otherwise
    pipeline.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['codebuild:StartBuild'],
        resources: ['*'],
      }),
    );

    // Get existing VPC based on predetermined attributes
    const raitaVPC = ec2.Vpc.fromVpcAttributes(this, 'raita-vpc', {
      ...vpcConfig.vpc,
    });

    // Get existing security group based on predetermined attributes
    const raitaSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      'raita-security-group',
      vpcConfig.securityGroupId,
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

    let confFileDir;
    let dbConfEditCommand = '';
    if (isDevelopmentPreMainStack(config.stackId, config.env)) {
      confFileDir = 'premain';
    } else if (isDevelopmentMainStack(config.stackId, config.env)) {
      confFileDir = 'main';
    } else if (isProductionStack(config.stackId, config.env)) {
      confFileDir = 'prod';
    } else {
      // on other branches: use _template_ config and rename schema name to stackId in flyway step
      confFileDir = '_template_';
      dbConfEditCommand = `sed -i 's/_schema_/${config.stackId}/g' $(pwd)/backend/db/conf/_template_/env.json $(pwd)/backend/db/conf/_template_/flyway.conf`;
    }
    const doPermanentSteps =
      isPermanentStack(config.stackId, config.env) ||
      isDevelopmentPreMainStack(config.stackId, config.env);

    const pipelineLockStack: RaitaPipelineLockStack | null = doPermanentSteps
      ? new RaitaPipelineLockStack(this, 'PipelineLockStack', {
          vpc: raitaVPC,
          prismaLambdaLayer,
        })
      : null;

    // secret contains credentials as json
    // { "username": "x", "secret": "x"}
    const dockerCredentialsSecret = Secret.fromSecretNameV2(
      this,
      'docker-credentials',
      'docker-hub-credentials',
    );
    const dockerCredentials = DockerCredential.dockerHub(
      dockerCredentialsSecret,
      {
        secretPasswordField: 'secret',
        secretUsernameField: 'username',
      },
    );
    const codePipeline = new CodePipeline(
      this,
      `pipeline-raita-${config.stackId}`,
      {
        codePipeline: pipeline,
        dockerCredentials: [dockerCredentials],
        synth: new ShellStep('Synth', {
          input: githubSource,
          installCommands: [
            'npm ci',
            'npm run graphql:codegen',
            'npm run prisma:generate',
            'npm --prefix frontend ci',
            'npm run --prefix frontend graphql:codegen',
          ],
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
            buildImage: LinuxBuildImage.STANDARD_7_0,
          },
          partialBuildSpec: BuildSpec.fromObject({
            phases: {
              install: {
                'runtime-versions': {
                  nodejs: '20',
                },
              },
            },
          }),
          // TODO: Cacheing not working currently
          cache: Cache.local(
            LocalCacheMode.CUSTOM,
            LocalCacheMode.SOURCE,
            LocalCacheMode.DOCKER_LAYER,
          ),
        },
      },
    );

    const preSteps: Step[] = [
      new ShellStep('UnitTest', {
        input: githubSource,
        installCommands: [
          'npm ci',
          'npm --prefix frontend ci',
          'npm run prisma:generate',
          'npm run graphql:codegen',
          'npm run --prefix frontend graphql:codegen',
        ],
        commands: ['npm run test', 'npm run --prefix frontend test'],
      }),
    ];
    const postSteps: Step[] = [];
    if (doPermanentSteps && pipelineLockStack) {
      preSteps.push(pipelineLockStack.acquireLockStep);
    }

    postSteps.push(
      new CodeBuildStep('Flyway', {
        input: githubSource,
        vpc: raitaVPC,
        securityGroups: [raitaSecurityGroup],
        buildEnvironment: {
          privileged: true,
          environmentVariables: {
            DB_PASSWORD: {
              type: BuildEnvironmentVariableType.SECRETS_MANAGER,
              value: 'database_password',
            },
            DOCKER_PASSWORD: {
              type: BuildEnvironmentVariableType.SECRETS_MANAGER,
              value: 'docker-hub-credentials:secret',
            },
            DOCKER_USERNAME: {
              type: BuildEnvironmentVariableType.SECRETS_MANAGER,
              value: 'docker-hub-credentials:username',
            },
            CONF_FILE_DIR: {
              type: BuildEnvironmentVariableType.PLAINTEXT,
              value: confFileDir,
            },
          },
        },
        commands: [
          'echo $CONF_FILE_DIR',
          'echo Logging in to Docker hub...',
          dbConfEditCommand,
          'docker login -u=$DOCKER_USERNAME -p=$DOCKER_PASSWORD',
          'docker run --rm -v $(pwd)/backend/db/migration:/flyway/sql -v $(pwd)/backend/db/conf/$CONF_FILE_DIR:/flyway/conf flyway/flyway migrate -password=$DB_PASSWORD',
        ],
      }),
    );
    if (doPermanentSteps && pipelineLockStack) {
      postSteps.push(pipelineLockStack.releaseLockStep);
    }

    codePipeline.addStage(
      new RaitaApplicationStage(this, `Raita`, {
        stackId: config.stackId,
        raitaEnv: config.env,
        tags: config.tags,
      }),
      {
        // ensure steps are ran in correct order
        pre: Step.sequence(preSteps),
        post: Step.sequence(postSteps),
      },
    );
    // These rows are needed to read ssm params at synth time. TODO: remove when the feature flags are not needed
    codePipeline.buildPipeline();
    codePipeline.synthProject.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['ssm:GetParameter'],
        resources: ['*'],
      }),
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
