import { getEnv } from '../utils';

const env = getEnv('ENVIRONMENT');
const branch = getEnv('BRANCH');
const applicationPrefix = `raita-${env.toLowerCase()}-${branch.toLowerCase()}`;
const permanentEnvironments = ['dev', 'prod'] as const;

const createPrefixedName = (name: string) => `${applicationPrefix}-${name}-`;

const baseCDKStackConfig = {
  env,
  region: 'eu-west-1',
  isPermanentEnvironment: env && permanentEnvironments.includes(env as any),
  tags: {
    Environment: env,
    Project: 'raita',
  },
};

export const getRaitaStackConfig = () => ({
  config: {
    ...baseCDKStackConfig,
    applicationPrefix,
    parserConfigurationFile: 'extractionSpec.json',
    openSearchMetadataIndex: 'metadata-index',
  },
  createPrefixedName,
});

export const getPipelineConfig = () => ({
  config: {
    ...baseCDKStackConfig,
    branch,
    authenticationToken: 'github-token',
  },
  createPrefixedName,
});
