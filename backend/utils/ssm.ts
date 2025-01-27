import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

export const getSSMParameter = async ({
  parameterName,
  encrypted = false,
}: {
  parameterName: string;
  encrypted: boolean;
}) => {
  const ssm = new SSMClient();
  const parameter = await ssm.send(
    new GetParameterCommand({
      Name: parameterName,
      WithDecryption: encrypted,
    }),
  );
  return parameter.Parameter?.Value;
};
