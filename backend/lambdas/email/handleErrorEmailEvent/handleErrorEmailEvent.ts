import { Context, SQSEvent } from 'aws-lambda';
import { log } from '../../../utils/logger';
import { getEnvOrFail } from '../../../../utils';

import { lambdaRequestTracker } from 'pino-lambda';

import { getDBConnection } from '../../dataProcess/csvCommon/db/dbUtil';
import { SSM_EMAIL } from '../../../../constants';
import { getSSMParameter } from '../../../utils/ssm';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
function getLambdaConfigOrFail() {
  return {
    region: getEnvOrFail('REGION'),
    raitaStackIdentifier: getEnvOrFail('RAITA_STACK_ID'),
  };
}

const withRequest = lambdaRequestTracker();

const config = getLambdaConfigOrFail();
const dbConnection = getDBConnection();

const sesClient = new SESClient({ region: config.region });

async function generateErrorMail(receiver: string) {
  const { prisma } = await getDBConnection();
  const today = new Date(); // Current date
  const oneWeekLater = new Date();
  oneWeekLater.setDate(today.getDate() - 7);

  const errorLogs = await prisma.logging.findMany({
    where: {
      AND: [
        {
          log_timestamp: {
            gte: oneWeekLater,
            lte: today,
          },
        },
        { log_level: { in: ['error', 'warn'] } },
      ],
    },
    select: {
      invocation_id: true,
    },
  });

  const erroredZips = [...new Set(errorLogs.map(log => log.invocation_id))];
  const zipsToEmail = erroredZips.map(key => `- ${key}`).join('\n');

  const emailBody =
    errorLogs.length > 0
      ? `${errorLogs.length} vastaanotettua virhettä tai varoitusta viime viikon aikana. Virheet havaittu seuraavissa zip-tiedostoissa${zipsToEmail} \n Katso lisää adminlokista: https://raita.vaylapilvi.fi/admin/logs.`
      : 'Ei uusia erroreita viime viikon ajalta.';

  const params = {
    Source: 'your-verified-email@example.com', // Replace with your verified email
    Destination: {
      ToAddresses: [receiver],
    },
    Message: {
      Subject: {
        Data: 'RAITA - Virhe yhteenveto',
      },
      Body: {
        Text: {
          Data: emailBody,
        },
      },
    },
  };

  return params;
}

export async function handleErrorEmailEvent(
  queueEvent: SQSEvent,
  context: Context,
): Promise<void> {
  try {
    const email = await getSSMParameter({
      parameterName: SSM_EMAIL,
      encrypted: false,
    });
    const generatedErrorMail = await generateErrorMail(email!);
    log.info(`THIS IS PARAMS IN Errors: ${JSON.stringify(generatedErrorMail)}`);
    /* THESE LINES ARE COMMENTED UNTIL EMAIL ADDRESS IS SET
    const command = new SendEmailCommand(generatedErrorMail);
    const response = await sesClient.send(command);*/
  } catch (error) {
    log.error(`Error sending email: ${error}`);
  }
}
