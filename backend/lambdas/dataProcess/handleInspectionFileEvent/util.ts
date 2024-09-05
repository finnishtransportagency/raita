import { getGetEnvWithPreassignedContext } from '../../../../utils';

export function getLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext('Metadata parser lambda');
  return {
    configurationFile: getEnv('CONFIGURATION_FILE'),
    configurationBucket: getEnv('CONFIGURATION_BUCKET'),
    inspectionBucket: getEnv('INSPECTION_BUCKET'),
    csvBucket: getEnv('CSV_BUCKET'),
    openSearchDomain: getEnv('OPENSEARCH_DOMAIN'),
    region: getEnv('REGION'),
    metadataIndex: getEnv('METADATA_INDEX'),
    environment: getEnv('ENVIRONMENT'),
    allowCSVInProd: getEnv('ALLOW_CSV_INSPECTION_EVENT_PARSING_IN_PROD'),
  };
}
export type IMetadataParserConfig = ReturnType<typeof getLambdaConfigOrFail>;
