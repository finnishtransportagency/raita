import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';

export async function getSecretsManagerSecret(secretId: string) {
  const manager = new SecretsManagerClient();
  const response = await manager.send(
    new GetSecretValueCommand({
      SecretId: secretId,
    }),
  );
  return response.SecretString;
}
