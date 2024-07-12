const getEnvOrFail = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable has not been set`);
  }
  return value;
};

export const getConfig = () => ({
  bucket: getEnvOrFail('S3_SOURCE_BUCKET'),
  targetBucket: getEnvOrFail('S3_TARGET_BUCKET'),
  queueUrl: getEnvOrFail('QUEUE_URL'),
});
