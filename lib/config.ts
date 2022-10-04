// `Possibly relocate to general helper location to be used elsewhere
export function getEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(name + '-environment variable has not been set');
  }
  return value;
}

const env = getEnv('ENVIRONMENT');
const branch = getEnv('BRANCH');
const applicationPrefix = `raita-${env}-${branch}`;

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

// TODO: Configuration file now hardcoded
export const getPipelineConfig = () => ({
  config: {
    ...baseCDKStackConfig,
    branch,
    authenticationToken: 'github-token',
  },
  createPrefixedName,
});
