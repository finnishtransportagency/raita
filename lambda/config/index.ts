import { z } from 'zod';

// TODO: CDK typescript version 3.9.7 with zod causes TS2589: Type instantiation is excessively deep and possibly infinite.
// Should be resolvable by upgrading typescript version (but trying this broke cdk synth command)
// @ts-ignore
const ConfigSchema = z.object({
  openSearchDomain: z.string(),
  configurationBucket: z.string(),
  configurationFile: z.string(),
  region: z.string(),
  openSearchMetadataIndex: z.string(),
});

// CDK DEFAULTS come from the AWS profile that is used to run the commands
// TODO: This IS not be the brightest implementation at the moment.
// This needs to be fixed (at least) by separating SYNTH time and RUNTIME variables, see
// TODO: Configuration file now hardcoded
const getConfig = () => {
  const config = {
    openSearchDomain: process.env.OPENSEARCH_DOMAIN || 'UNDEFINED',
    configurationBucket: process.env.CONFIGURATION_BUCKET || 'UNDEFINED',
    configurationFile: 'extractionSpec.json',
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'eu-west-1', // process.env.CDK_DEFAULT_REGION, // OR 'eu-west-1' OR process.env.AWS_REGION
    openSearchMetadataIndex: 'metadata-index',
  };
  return ConfigSchema.parse(config);
};

export default getConfig;
