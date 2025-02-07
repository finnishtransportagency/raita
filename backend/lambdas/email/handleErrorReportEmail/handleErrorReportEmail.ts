import { Context, SQSEvent } from 'aws-lambda';
import { log } from '../../../utils/logger';
import { getEnvOrFail } from '../../../../utils';

import { lambdaRequestTracker } from 'pino-lambda';

import { getDBConnection } from '../../dataProcess/csvCommon/db/dbUtil';
import { getSSMParameter } from '../../../utils/ssm';
function getLambdaConfigOrFail() {
  return {
    region: getEnvOrFail('REGION'),
    raitaStackIdentifier: getEnvOrFail('RAITA_STACK_ID'),
    senderAddress: getEnvOrFail('VERIFIED_SENDER_ADDRESS'),
    receiverAddressList: getEnvOrFail('RECEIVER_ADDRESS_LIST'),
    smtpEndpoint: getEnvOrFail('SMTP_ENDPOINT'),
  };
}

const withRequest = lambdaRequestTracker();

// const dbConnection = getDBConnection();

async function generateErrorReportBody() {
  // const { prisma } = await getDBConnection();
  // const today = new Date(); // Current date
  // const oneWeekLater = new Date();
  // oneWeekLater.setDate(today.getDate() - 7);

  // const errorLogs = await prisma.logging.findMany({
  //   where: {
  //     AND: [
  //       {
  //         log_timestamp: {
  //           gte: oneWeekLater,
  //           lte: today,
  //         },
  //       },
  //       { log_level: { in: ['error', 'warn'] } },
  //     ],
  //   },
  //   select: {
  //     invocation_id: true,
  //   },
  // });

  // const erroredZips = [...new Set(errorLogs.map(log => log.invocation_id))];
  // const zipsToEmail = erroredZips.map(key => `- ${key}`).join('\n');

  // const emailBody =
  //   errorLogs.length > 0
  //     ? `${errorLogs.length} vastaanotettua virhettä tai varoitusta viime viikon aikana. Virheet havaittu seuraavissa zip-tiedostoissa${zipsToEmail} \n Katso lisää adminlokista: https://raita.vaylapilvi.fi/admin/logs.`
  //     : 'Ei uusia erroreita viime viikon ajalta.';

  const emailBody = 'test body for error report email';

  return emailBody;
}

export async function handleErrorReportEmail(
  event: any,
  context: Context,
): Promise<void> {
  try {
    const port = 25;
    withRequest(event, context);
    const config = getLambdaConfigOrFail();
    // const email = await getSSMParameter({
    //   parameterName: SSM_EMAIL,
    //   encrypted: false,
    // });
    const emailBody = await generateErrorReportBody();
    // log.info(`THIS IS PARAMS IN Errors: ${JSON.stringify(generatedErrorMail)}`);
    if (!config.receiverAddressList || !config.senderAddress) {
      throw new Error('Addresses missing');
    }

    // TODO: nodemailder
    const recipients = config.receiverAddressList.split(','); // TODO validation?;
    //  Käytetään kuitenkin SMTP lähetystapaa?
    // const command = new SendEmailCommand({
    //   Source: config.senderAddress, // Replace with your verified email
    //   Destination: {
    //     ToAddresses: recipients,
    //   },
    //   Message: {
    //     Subject: {
    //       Data: 'RAITA - Virhe yhteenveto',
    //     },
    //     Body: {
    //       Text: {
    //         Data: emailBody,
    //       },
    //     },
    //   },
    // });
  } catch (error) {
    log.error(`Error sending email: ${error}`);
  }
}
