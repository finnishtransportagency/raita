import { getGetEnvWithPreassignedContext } from '../../../../utils';

export function getLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext('CSV mass import lambda');
  return {
    configurationFile: getEnv('CONFIGURATION_FILE'),
    configurationBucket: getEnv('CONFIGURATION_BUCKET'),
    cSVMassImportBucket: getEnv('CSV_MASS_IMPORT_BUCKET'),
    csvBucket: getEnv('CSV_BUCKET'),
    region: getEnv('REGION'),
    environment: getEnv('ENVIRONMENT'),
    allowCSVInProd: getEnv('ALLOW_CSV_MASS_IMPORT_PARSING_IN_PROD'),
  };
}

export type IMetadataParserConfig = ReturnType<typeof getLambdaConfigOrFail>;
