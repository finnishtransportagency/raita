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

export async function handleErrorEmailEvent(
  queueEvent: SQSEvent,
  context: Context,
): Promise<void> {
  try {
    const email = await getSSMParameter({
      parameterName: SSM_EMAIL,
      encrypted: false,
    });
    /*const generetatedAlarmMail = generateErrorMail();
      const generetatedReportMail = generateReportMail();*/

    log.info(`THIS IS LOG FROM EMAIL LAMBDA`);
    log.info(`Receiver email is ${email}`);
  } catch (error) {
    log.error(`Error sending email: ${error}`);
  }
}
