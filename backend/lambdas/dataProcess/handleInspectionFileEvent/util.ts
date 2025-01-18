import { getGetEnvWithPreassignedContext } from '../../../../utils';

export function getLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext('Metadata parser lambda');
  return {
    configurationFile: getEnv('CONFIGURATION_FILE'),
    configurationBucket: getEnv('CONFIGURATION_BUCKET'),
    inspectionBucket: getEnv('INSPECTION_BUCKET'),
    csvBucket: getEnv('CSV_BUCKET'),
    region: getEnv('REGION'),
    environment: getEnv('ENVIRONMENT'),
    externalDataTopicArn: getEnv('EXTERNAL_DATA_TOPIC_ARN'),
  };
}
export type IMetadataParserConfig = ReturnType<typeof getLambdaConfigOrFail>;
