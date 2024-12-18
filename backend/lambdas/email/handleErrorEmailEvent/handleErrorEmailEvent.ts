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
const dbConnection = getDBConnection();

async function generateErrorMail(receiver: string) {
  const { prisma } = await getDBConnection();
  const today = new Date(); // Current date
  const oneWeekLater = new Date();
  oneWeekLater.setDate(today.getDate() - 60);

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

  // Step 2: Format the report keys for the email body
  const emailBody =
    errorLogs.length > 0
      ? `There are ${errorLogs.length} received error or warning logs during the last week. Check adminlog for more.`
      : 'No error logs were received during the last week.';

  // Step 3: Define email parameters
  const params = {
    Source: 'your-verified-email@example.com', // Replace with your verified email
    Destination: {
      ToAddresses: [receiver], // Replace with the recipient's email
    },
    Message: {
      Subject: {
        Data: 'Weekly error log Summary', // Email subject
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
    log.info(`THIS IS LOG FROM EMAIL LAMBDA`);
    log.info(`Receiver email is ${email}`);
  } catch (error) {
    log.error(`Error sending email: ${error}`);
  }
}
