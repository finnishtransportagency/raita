import { Context, SQSEvent } from 'aws-lambda';
import { LambdaEvent, lambdaRequestTracker } from 'pino-lambda';

import { log, logLambdaInitializationError } from '../../../utils/logger';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';

import { getLambdaConfigOrFail } from './util';
import { asyncWait } from '../../../utils/common';
import { ConversionMessage } from '../util';
import { ConversionStatus } from '../../dataProcess/csvCommon/db/model/Mittaus';
import { Prisma } from '@prisma/client';
import { IAdminLogger } from '../../../utils/adminLog/types';
import { PostgresLogger } from '../../../utils/adminLog/postgresLogger';
import {
  DBConnection,
  getDBConnection,
} from '../../dataProcess/csvCommon/db/dbUtil';

const init = () => {
  try {
    const withRequest = lambdaRequestTracker();

    const dbConnection: Promise<DBConnection> = getDBConnection();

    const config = getLambdaConfigOrFail();
    const sqsClient = new SQSClient({});
    const adminLogger: IAdminLogger = new PostgresLogger(dbConnection);
    return {
      withRequest,
      dbConnection,
      config,
      sqsClient,
      adminLogger,
    };
  } catch (error) {
    logLambdaInitializationError.error(
      { error },
      'Error in lambda initialization code, abort',
    );
    throw error;
  }
};

const { withRequest, dbConnection, config, sqsClient, adminLogger } = init();
const pageCount = 1000;

const conversionBatchSize = 50000;

// for manually triggering conversion process
type ManualTriggerEvent = {
  type: 'ManualTrigger';
} & LambdaEvent;

type ConversionEvent = ManualTriggerEvent | SQSEvent;

type ConversionStartMessage = { reportId: number; invocationId: string };

/**
 * Handle conversion process:
 * There are two ways to trigger this:
 *  - From SQS queue with a message containing raportti id
 *  - From Manual trigger event. In this case all raportti from db with geoviite_status=READY_FOR_CONVERSION are handled
 */
export async function handleStartConversionProcess(
  event: ConversionEvent,
  context: Context,
): Promise<void> {
  try {
    withRequest(event, context);
    const queueTrigger = event.Records && event.Records.length;

    // init logger first with placeholder invocationId
    let invocationId = 'INVOCATION_ID_NOT_FOUND_YET';
    await adminLogger.init('conversion-process', invocationId);

    const prismaClient = (await dbConnection).prisma;

    let whereInput: Prisma.raporttiWhereInput;
    if (queueTrigger) {
      const typedEvent = event as SQSEvent;
      // there should be only one event at a time
      // adminLogging can go to wrong invocationId if there are multiple
      let raporttiIds: number[] = [];
      for (let i = 0; i < typedEvent.Records.length; i++) {
        const record = typedEvent.Records[i];
        const body: ConversionStartMessage = JSON.parse(record.body);
        if (!body.reportId) {
          throw new Error('No reportId in sqs message');
        }
        raporttiIds.push(body.reportId);
        invocationId = body.invocationId;
      }
      whereInput = {
        id: {
          in: raporttiIds,
        },
      };
    } else {
      const typedEvent = event as ManualTriggerEvent;
      invocationId = 'Manual Trigger';
      if (typedEvent.type !== 'ManualTrigger') {
        throw new Error('From trigger event format');
      }
      whereInput = {
        geoviite_status: {
          equals: ConversionStatus.READY_FOR_CONVERSION,
        },
        file_type: {
          equals: 'csv',
        },
      };
    }
    // init logger again with correct invocationId
    await adminLogger.init('conversion-process', invocationId);

    const totalCount = await prismaClient.raportti.count({
      where: whereInput,
    });

    for (
      let currentIndex = 0;
      currentIndex < totalCount;
      currentIndex += pageCount
    ) {
      // get next set of files
      // as raportti entries are handled the status is changed, so always search the next available ones
      // TODO: make sure this paging works with other ways to determine raporttis than status
      const raporttis = await prismaClient.raportti.findMany({
        where: whereInput,
        select: {
          key: true,
          id: true,
          system: true,
        },
        take: pageCount,
      });
      let successfulKeys: string[] = [];
      let failedKeys: string[] = [];
      for (let fileIndex = 0; fileIndex < raporttis.length; fileIndex++) {
        const raportti = raporttis[fileIndex];
        const key = raportti.key;
        log.trace('key: ' + key);
        if (key === null) {
          log.error('File with no key?');
          continue;
        }
        // faster to fetch mittaus count for each raportti separately than to do in initial raportti query
        const mittausCount = await prismaClient.mittaus.count({
          where: {
            raportti_id: raportti.id,
          },
        });
        log.trace('mittausCount: ' + mittausCount);

        // raportti with no mittauses is set to geoviite success
        if (mittausCount == 0) {
          await adminLogger.warn('Raportissa ei mittauksia: ' + key);
          await prismaClient.raportti.updateMany({
            where: {
              id: raportti.id,
            },
            data: {
              geoviite_status: ConversionStatus.SUCCESS,
              geoviite_update_at: new Date().toISOString(),
            },
          });
          continue;
        }

        const minMittausId = (
          await prismaClient.mittaus.aggregate({
            where: {
              raportti_id: raportti.id,
            },
            _min: {
              id: true,
            },
          })
        )._min.id;
        log.trace('minMittausId: ' + minMittausId);

        const maxMittausId = (
          await prismaClient.mittaus.aggregate({
            where: {
              raportti_id: raportti.id,
            },
            _max: {
              id: true,
            },
          })
        )._max.id;

        log.trace('maxMittausId: ' + maxMittausId);

        if (!minMittausId || !maxMittausId) {
          throw new Error('Error getting start or end id');
        }
        let startID: number = minMittausId;

        // split one raportti into batches
        const batchCount = Math.ceil(mittausCount / conversionBatchSize);

        const idDifference = maxMittausId - minMittausId;
        log.trace('idDifference: ' + idDifference);
        const idIncrement = Math.ceil(idDifference / batchCount);
        log.trace('idIncrement: ' + idIncrement);

        for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
          const endID = startID + idIncrement;
          const body: ConversionMessage = {
            key,
            id: raportti.id,
            system: raportti.system,
            batchIndex,
            batchCount,
            orderBy: 'id',
            invocationId,
            startID,
            endID,
          };

          startID = endID + 1;
          let messageGroupId = key.replace(/_|\W/g, '');

          messageGroupId =
            messageGroupId.length > 128
              ? messageGroupId.substring(
                  messageGroupId.length - 128,
                  messageGroupId.length,
                )
              : messageGroupId;
          const command = new SendMessageCommand({
            QueueUrl: config.queueUrl,
            MessageBody: JSON.stringify(body),
            MessageGroupId: messageGroupId,
            MessageDeduplicationId: `${raportti.id}_${batchIndex}`,
          });
          const queueResponse = await sqsClient.send(command);
          if (queueResponse.$metadata.httpStatusCode !== 200) {
            log.error({ queueResponse, key, batchIndex }, 'Some key failed');
            failedKeys = failedKeys.concat(key);
          } else {
            successfulKeys = successfulKeys.concat(key);
          }
          await asyncWait(5); // wait to avoid hitting rate limits
        }
      }
      await prismaClient.raportti.updateMany({
        data: {
          geoviite_status: ConversionStatus.IN_QUEUE,
        },
        where: {
          key: {
            in: successfulKeys,
          },
        },
      });
      if (failedKeys.length) {
        log.error({ failedKeys });
      }
    }
  } catch (err) {
    log.error(err);
    log.error(
      {
        event,
      },
      'Error starting conversion',
    );
    await adminLogger.error('Virhe viitekehysmuunosprosessin käynnistämisessä');
  }
}
