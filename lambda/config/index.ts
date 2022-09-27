import { config } from 'process';
import { z } from 'zod';

// Inspiration from https://github.com/finnishtransportagency/hassu/blob/main/deployment/lib/config.ts

export function getEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(name + '-environment variable has not been set');
  }
  return value;
}

const permanentEnvironments = ['dev', 'prod'] as const;
const allEnvironments = [...permanentEnvironments, 'feature'] as const;

const env = getEnv('ENVIRONMENT');
const branch = getEnv('BRANCH'); // TODO: Not always from env? Main as default?
// Used any as otherwise includes isn't allowed
const isPermanentEnvironment = (environment: string) =>
  permanentEnvironments.includes(environment as any);
const sharedInfraEnv = isPermanentEnvironment(env) ? env : 'dev';

// TODO: CDK typescript version 3.9.7 with zod causes TS2589: Type instantiation is excessively deep and possibly infinite.
// Should be resolvable by upgrading typescript version (but trying this broke cdk synth command)
// @ts-ignore
const ConfigSchema = z.object({
  // @ts-ignore
  env: z.enum(allEnvironments), // TODO: Third type, extended from permanentEnvironments
  isPermanentEnvironment: z.function(),
  branch: z.string(),
  dataBucketName: z.string(),
  openSearchDomainName: z.string(),
  parserConfigurationBucketName: z.string(),
  parserConfigurationFile: z.string(),
  parserLambdaName: z.string(),
  region: z.string(),
  openSearchMetadataIndex: z.string(),
  authenticationToken: z.string(),
  // @ts-ignore
  tags: z.object({
    Environment: z.enum(allEnvironments),
    Project: z.string(),
  }),
});

// CDK DEFAULTS come from the AWS profile that is used to run the commands
// TODO: This IS not be the brightest implementation at the moment.
// This needs to be fixed (at least) by separating SYNTH time and RUNTIME variables, see
// Runtime variables from SSM/Parameter Store
// TODO: Configuration file now hardcoded
const getConfig = () => {
  const config = {
    env,
    isPermanentEnvironment,
    branch,
    dataBucketName: 'input-data-' + env,
    openSearchDomainName: 'raita-base-' + sharedInfraEnv,
    parserConfigurationBucketName: 'raita-parser-configuration-' + env,
    parserConfigurationFile: 'extractionSpec.json',
    parserLambdaName: 'raita-parser-' + env,
    // account: getEnv('CDK_DEFAULT_ACCOUNT'),
    region: 'eu-west-1', // process.env.CDK_DEFAULT_REGION, // OR 'eu-west-1' OR process.env.AWS_REGION
    openSearchMetadataIndex: 'metadata-index',
    authenticationToken: 'github-token',
    tags: {
      Environment: env,
      Project: 'raita',
    },
  };
  return ConfigSchema.parse(config);
};

export default getConfig;
