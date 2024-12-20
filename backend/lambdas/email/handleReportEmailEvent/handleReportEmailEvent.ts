import { Context, SQSEvent } from 'aws-lambda';
import { log } from '../../../utils/logger';
import { getEnvOrFail } from '../../../../utils';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { lambdaRequestTracker } from 'pino-lambda';

import { getDBConnection } from '../../dataProcess/csvCommon/db/dbUtil';
import { SSM_EMAIL } from '../../../../constants';
import { getSSMParameter } from '../../../utils/ssm';

function getLambdaConfigOrFail() {
  return {
    region: getEnvOrFail('REGION'),
    raitaStackIdentifier: getEnvOrFail('RAITA_STACK_ID'),
  };
}

const withRequest = lambdaRequestTracker();

const config = getLambdaConfigOrFail();
const sesClient = new SESClient({ region: config.region });

async function generateReportMail(receiver: string) {
  const { prisma } = await getDBConnection();
  const today = new Date(); // Current date
  const onMonthLater = new Date();
  onMonthLater.setDate(today.getMonth() - 1);

  //list of keys with inspection dates between these dates
  const raportti = await prisma.raportti.findMany({
    where: {
      inspection_date: {
        gte: onMonthLater,
        lte: today,
      },
    },
    select: {
      key: true,
      inspection_date: true,
    },
    orderBy: {
      inspection_date: 'asc',
    },
  });

  const reportList =
    raportti.length > 0
      ? raportti.map(key => `- ${key.key}, ${key.inspection_date}`).join('\n')
      : 'Ei vastaanotettuja raportteja viime kuukauden aikana';

  const emailBody = `Raportteja vastaanotettu yhteensä: ${raportti.length}. Nämä raportit vastaanotettiin viime kuukauden aikana:\n\n${reportList}`;

  const params = {
    Source: 'your-verified-email@example.com', // Replace with your verified email
    Destination: {
      ToAddresses: [receiver],
    },
    Message: {
      Subject: {
        Data: 'RAITA - Raportti yhteenveto', // Email subject
      },
      Body: {
        Text: {
          Data: emailBody, // Email body containing the report list
        },
      },
    },
  };

  return params;
}

export async function handleReportEmailEvent(
  queueEvent: SQSEvent,
  context: Context,
): Promise<void> {
  try {
    const email = await getSSMParameter({
      parameterName: SSM_EMAIL,
      encrypted: false,
    });
    const generatedReportMail = await generateReportMail(email!);
    log.info(
      `THIS IS PARAMS IN REPORTS: ${JSON.stringify(generatedReportMail)}`,
    );
    /* THESE LINES ARE COMMENTED UNTIL EMAIL ADDRESS IS SET
    const command = new SendEmailCommand(generatedReportMail);
    const response = await sesClient.send(command);*/
  } catch (error) {
    log.error(`Error sending email: ${error}`);
  }
}
