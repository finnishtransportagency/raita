import { SSM } from 'aws-sdk';

export const getSSMParameter = async ({
  parameterName,
  encrypted = false,
}: {
  parameterName: string;
  encrypted: boolean;
}) => {
  const ssm = new SSM();
  const parameter = await ssm
    .getParameter({
      Name: parameterName,
      WithDecryption: encrypted,
    })
    .promise();
  return parameter.Parameter?.Value;
};
