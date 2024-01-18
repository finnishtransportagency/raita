import { SecretsManager } from 'aws-sdk';

export async function getSecretsManagerSecret(secretId: string) {
  const manager = new SecretsManager();
  const response = await manager
    .getSecretValue({ SecretId: secretId })
    .promise();
  return response.SecretString;
}
