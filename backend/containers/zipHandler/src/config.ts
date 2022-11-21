const getEnvOrFail = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable has not been set`);
  }
  return value;
};

export const getConfig = () => ({
  bucket: getEnvOrFail('S3_SOURCE_BUCKET'),
  key: getEnvOrFail('S3_SOURCE_KEY'),
  targetBucket: getEnvOrFail('S3_TARGET_BUCKET'),
});
