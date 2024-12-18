import { Context, SQSEvent } from 'aws-lambda';
import { log } from '../../../utils/logger';
import { getEnvOrFail } from '../../../../utils';

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

async function generateReportMail(receiver: string) {
  const { prisma } = await getDBConnection();
  const today = new Date(); // Current date
  const oneWeekLater = new Date();
  oneWeekLater.setDate(today.getDate() - 60);

  //list of keys with inspection dates between these dates
  const raportti = await prisma.raportti.findMany({
    where: {
      inspection_date: {
        gte: oneWeekLater,
        lte: today,
      },
    },
    select: {
      key: true, // Replace 'key' with actual keys/fields you want to select
    },
  });

  // Step 2: Format the report keys for the email body
  const reportList =
    raportti.length > 0
      ? raportti.map(key => `- ${key}`).join('\n')
      : 'No reports were received during the last week.';

  const emailBody = `These are the reports that are received during the last week:\n\n${reportList}`;

  // Step 3: Define email parameters
  const params = {
    Source: 'your-verified-email@example.com', // Replace with your verified email
    Destination: {
      ToAddresses: [receiver], // Replace with the recipient's email
    },
    Message: {
      Subject: {
        Data: 'Weekly Report Summary', // Email subject
      },
      Body: {
        Text: {
          Data: emailBody, // Email body containing the report list
        },
      },
    },
  };
  log.info(emailBody);

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
    log.info(`THIS IS LOG FROM EMAIL LAMBDA`);
    log.info(`Receiver email is ${email}`);
  } catch (error) {
    log.error(`Error sending email: ${error}`);
  }
}
