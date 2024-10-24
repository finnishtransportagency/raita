import { getGetEnvWithPreassignedContext } from '../../../../utils';

export function getLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext(
    'Geoviite conversion start handler',
  );
  return {
    queueUrl: getEnv('CONVERSION_QUEUE_URL'),
  };
}
