import { z } from 'zod';

// TODO: CDK typescript version 3.9.7 with zod causes TS2589: Type instantiation is excessively deep and possibly infinite.
// Should be resolvable by upgrading typescript version (but trying this broke cdk synth command)
// Note: zod

// @ts-ignore
const RaitaStackConfigSchema = z.object({
  env: z.string(), // z.enum(allEnvironments), // TODO: Third type, extended from permanentEnvironments
  isPermanentEnvironment: z.boolean(),
  region: z.string(),
  parserConfigurationFile: z.string(),
  openSearchMetadataIndex: z.string(),
  // @ts-ignore
  tags: z.object({
    Environment: z.string(), // z.enum(allEnvironments),
    Project: z.string(),
  }),
});

// @ts-ignore
const PipelineStackConfigSchema = z.object({
  env: z.string(), // z.enum(allEnvironments), // TODO: Third type, extended from permanentEnvironments
  isPermanentEnvironment: z.boolean(),
  branch: z.string(),
  region: z.string(),
  authenticationToken: z.string(),
  // @ts-ignore
  tags: z.object({
    Environment: z.string(), // z.enum(allEnvironments),
    Project: z.string(),
  }),
});

const env = process.env['ENVIRONMENT'];
const branch = process.env['BRANCH'];
const applicationPrefix = `raita-${env}-${branch}`;

const permanentEnvironments = ['dev', 'prod'] as const;

const createPrefixedName = (name: string) => `${applicationPrefix}-${name}--`;

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
  config: RaitaStackConfigSchema.parse({
    ...baseCDKStackConfig,
    parserConfigurationFile: 'extractionSpec.json',
    openSearchMetadataIndex: 'metadata-index',
  }),
  createPrefixedName,
});

// TODO: Configuration file now hardcoded
export const getPipelineConfig = () => ({
  config: PipelineStackConfigSchema.parse({
    ...baseCDKStackConfig,
    branch,
    authenticationToken: 'github-token',
  }),
  createPrefixedName,
});
