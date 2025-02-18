import { Context } from 'aws-lambda';
import * as CSV from 'csv-string';
import { log } from '../../../utils/logger';
import { getEnvOrFail } from '../../../../utils';

import { lambdaRequestTracker } from 'pino-lambda';
import { createTransport } from 'nodemailer';

import {
  DBConnection,
  getDBConnection,
} from '../../dataProcess/csvCommon/db/dbUtil';
import { getSSMParameter } from '../../../utils/ssm';
import { getSecretsManagerSecret } from '../../../utils/secretsManager';
import {
  SECRET_KEY_SMTP_CREDENTIALS,
  SMTP_PORT,
  SSM_EMAIL_REPORTS_RECEIVERS,
} from '../../../../constants';
import {
  endOfDay,
  format,
  previousMonday,
  previousSunday,
  startOfDay,
} from 'date-fns';
import { Attachment } from 'nodemailer/lib/mailer';
function getLambdaConfigOrFail() {
  return {
    region: getEnvOrFail('REGION'),
    raitaEnv: getEnvOrFail('RAITA_ENV'),
    senderAddress: getEnvOrFail('VERIFIED_SENDER_ADDRESS'),
    smtpEndpoint: getEnvOrFail('SMTP_ENDPOINT'),
  };
}

type TestEvent = {
  testEvent?: boolean;
  disableSending?: boolean;
};

const withRequest = lambdaRequestTracker();

/**
 * Generate content for error email report
 *
 * Assume that content is small enough to generate in memory
 */
async function generateErrorReportContent(
  dbConnection: DBConnection,
  startTime: Date,
  endTime: Date,
  addTestEnvironmentNotification: boolean,
): Promise<{ messageBody: string; csvBody: string }> {
  const maxZipsToListInBody = 20;
  const prisma = dbConnection.prisma;
  const errorLogs = await prisma.logging.findMany({
    where: {
      AND: [
        {
          log_timestamp: {
            gte: startTime.toISOString(),
            lte: endTime.toISOString(),
          },
        },
        {
          log_level: { in: ['error', 'warn'] },
          source: {
            in: [
              'data-inspection',
              'data-reception',
              'data-csv',
              'conversion-process',
            ],
          },
        },
      ],
    },
    select: {
      source: true,
      log_timestamp: true,
      invocation_id: true,
      log_message: true,
      log_level: true,
    },
  });
  const logStats: {
    [invocationId: string]: { errorCount: number; warnCount: number };
  } = {};
  errorLogs.forEach(logEntry => {
    if (!logEntry.invocation_id) {
      return;
    }
    if (!logStats[logEntry.invocation_id]) {
      logStats[logEntry.invocation_id] = { errorCount: 0, warnCount: 0 };
    }
    if (logEntry.log_level === 'error') {
      logStats[logEntry.invocation_id].errorCount += 1;
    } else if (logEntry.log_level === 'warn') {
      logStats[logEntry.invocation_id].warnCount += 1;
    }
    // TODO: categorize by error "category"?
  });

  const zips = Object.keys(logStats);

  const startTimeFormatted = format(startTime, 'dd.MM.yyyy HH:mm');
  const endTimeFormatted = format(endTime, 'dd.MM.yyyy HH:mm');
  // TODO: support for different languages? better formattin? HTML?
  const firstRow = `Raportti RAITA dataprosessin virheistä aikavälillä ${startTimeFormatted} - ${endTimeFormatted}\n`;
  const envNotification = addTestEnvironmentNotification
    ? 'Raportti on generoitu TESTIympäristössä\n'
    : '';
  const lastRow = 'Tämä viesti on RAITA-järjestelmän lähettämä.';
  if (!zips.length) {
    return {
      messageBody: `${firstRow}
${envNotification}
Ei havaittuja virheitä tai huomautuksia.\n${lastRow}`,
      csvBody: '',
    };
  }

  const errorZipCount = zips.filter(
    invocationId => logStats[invocationId].errorCount > 0,
  ).length;
  const warnZipCount = zips.filter(
    invocationId => logStats[invocationId].warnCount > 0,
  ).length;

  const messageContent = `ZIP-tiedostoja joissa havaittu virheitä: ${errorZipCount} kpl.
ZIP-tiedostoja joissa havaittu huomatuksia: ${warnZipCount} kpl.

ZIP-tiedostot:
${zips
  .slice(0, maxZipsToListInBody)
  .map(
    invocationId => `${invocationId}
  Virheitä: ${logStats[invocationId].errorCount}
  Huomautuksia: ${logStats[invocationId].warnCount}`,
  )
  .join('\n')}\n${
    zips.length > maxZipsToListInBody
      ? `...
Lista on liian pitkä näytettäväksi kokonaisuudessaan. Loput tiedot ovat liitteenä olevassa CSV-tiedostossa.
  `
      : '\nTiedot ovat myös liitteenä olevassa CSV-tiedostossa.'
  }
`;
  const messageBody = `${firstRow}
${envNotification}
${messageContent}
${lastRow}
`;
  const header = ['ZIP-tiedosto', 'Virheet', 'Huomautukset'];
  const rows = zips.map(invocationId => {
    const entry = logStats[invocationId];
    return [invocationId, entry.errorCount, entry.warnCount];
  });
  return {
    messageBody,
    csvBody: `\uFEFF${CSV.stringify([header, ...rows], ';')}`,
  };
}

export async function handleErrorReportEmail(
  event: TestEvent,
  context: Context,
): Promise<void> {
  try {
    const port = SMTP_PORT;
    withRequest(event, context);
    const config = getLambdaConfigOrFail();
    log.info({ event });

    // get receiver list at runtime so it can easily be changed
    const receivers = await getSSMParameter({
      parameterName: SSM_EMAIL_REPORTS_RECEIVERS,
      encrypted: false,
    });
    if (!receivers || receivers === 'DISABLED') {
      log.info('No receiver address specified, quitting.');
      return;
    }

    const dbConnection = await getDBConnection();

    const now = new Date();
    // gather report from last week
    const endTime = endOfDay(previousSunday(now));
    const startTime = startOfDay(previousMonday(endTime));

    const startDateFormatted = format(startTime, 'dd.MM.yyyy');
    const endDateFormatted = format(endTime, 'dd.MM.yyyy');
    const subject = `RAITA virheraportti ${startDateFormatted} - ${endDateFormatted}`;

    const addTestEnvironmentNotification = config.raitaEnv !== 'prod';
    const emailContent = await generateErrorReportContent(
      dbConnection,
      startTime,
      endTime,
      addTestEnvironmentNotification,
    );

    const credentials = await getSecretsManagerSecret(
      SECRET_KEY_SMTP_CREDENTIALS,
    );

    if (!credentials) {
      throw new Error('Error fetching credentials');
    }
    const parsedCredentials: { username: string; password: string } =
      JSON.parse(credentials);

    const transporter = createTransport({
      host: config.smtpEndpoint,
      port,
      secure: false, // true for port 465, false for other ports
      requireTLS: true,
      auth: {
        type: 'login',
        user: parsedCredentials.username,
        pass: parsedCredentials.password,
      },
    });

    const disableSending = event && event.disableSending;
    log.info({
      from: config.senderAddress,
      to: receivers,
      subject,
      emailContent,
    });
    if (disableSending) {
      log.info('Sending disabled for testing');
      return;
    }
    const attachments: Attachment[] = [];
    if (emailContent.csvBody.length) {
      attachments.push({
        filename: `RAITA-errors-${startDateFormatted}-${endDateFormatted}.csv`,
        content: emailContent.csvBody,
      });
    }
    await transporter.sendMail({
      from: config.senderAddress,
      to: receivers,
      subject,
      text: emailContent.messageBody,
      attachments,
    });
    log.info('Send success');
  } catch (error) {
    log.error(`Error sending email: ${error}`);
  }
}
