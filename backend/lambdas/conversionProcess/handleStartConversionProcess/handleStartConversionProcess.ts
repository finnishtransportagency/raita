import { Context, SQSEvent } from 'aws-lambda';
import { LambdaEvent, lambdaRequestTracker } from 'pino-lambda';

import { log, logLambdaInitializationError } from '../../../utils/logger';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';

import { getPrismaClient } from '../../../utils/prismaClient';
import { getLambdaConfigOrFail } from './util';
import { asyncWait } from '../../../utils/common';
import { ConversionMessage } from '../util';
import { ConversionStatus } from '../../dataProcess/csvCommon/db/model/Mittaus';
import { Prisma } from '@prisma/client';

const init = () => {
  try {
    const withRequest = lambdaRequestTracker();

    const prisma = getPrismaClient();
    const config = getLambdaConfigOrFail();
    const sqsClient = new SQSClient({});

    return {
      withRequest,
      prisma,
      config,
      sqsClient,
    };
  } catch (error) {
    logLambdaInitializationError.error(
      { error },
      'Error in lambda initialization code, abort',
    );
    throw error;
  }
};

const { withRequest, prisma, config, sqsClient } = init();
const pageCount = 1000;

const conversionBatchSize = 50000;

// for manually triggering conversion process
type ManualTriggerEvent = {
  type: 'ManualTrigger';
} & LambdaEvent;

type ConversionEvent = ManualTriggerEvent | SQSEvent;

type ConversionStartMessage = { id: number };

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

    log.info('Start conversion process');
    const prismaClient = await prisma;

    const queueTrigger = event.Records && event.Records.length;
    let whereInput: Prisma.raporttiWhereInput;
    if (queueTrigger) {
      log.info('Trigger from queue');
      const typedEvent = event as SQSEvent;
      const raporttiIds = typedEvent.Records.map(record => {
        const body: ConversionStartMessage = JSON.parse(record.body);
        if (!body.id) {
          throw new Error('No key in sqs message');
        }
        return body.id;
      });
      whereInput = {
        id: {
          in: raporttiIds,
        },
      };
    } else {
      const typedEvent = event as ManualTriggerEvent;
      if (typedEvent.type !== 'ManualTrigger') {
        throw new Error('From trigger event format');
      }
      log.info('Trigger from manual event');
      whereInput = {
        geoviite_status: {
          equals: ConversionStatus.READY_FOR_CONVERSION,
        },
        file_type: {
          equals: 'csv',
        },
      };
    }

    const totalCount = await prismaClient.raportti.count({
      where: whereInput,
    });

    log.info({ totalCount }, 'Adding keys to queue');

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
        // faster to fetch mittaus count for each raportti separately than to do in initial raportti query
        const mittausCount = await prismaClient.mittaus.count({
          where: {
            raportti_id: raportti.id,
          },
        });

        let flippedLatLong: boolean = false;
        const a = await prismaClient.mittaus.findFirst({
          where: {
            raportti_id: raportti.id,
            lat: { not: null },
          },
        });

        const key = raportti.key;
        if (key === null) {
          log.error('File with no key?');
          continue;
        }
        // split one raportti into batches
        const batchCount = Math.ceil(mittausCount / conversionBatchSize);
        for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
          const body: ConversionMessage = {
            key,
            id: raportti.id,
            system: raportti.system,
            batchSize: conversionBatchSize,
            batchIndex,
            orderBy: 'id',
          };
          const command = new SendMessageCommand({
            QueueUrl: config.queueUrl,
            MessageBody: JSON.stringify(body),
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
          geoviite_status: ConversionStatus.IN_PROGRESS,
        },
        where: {
          key: {
            in: successfulKeys,
          },
        },
      });
      log.info({ count: successfulKeys.length }, 'Updated status');
      if (failedKeys.length) {
        log.error({ failedKeys }); // TODO: do something else to these?
      }
    }
  } catch (err) {
    log.error(err);
    log.error({
      message: 'An error occured while processing events',
    });
  }
}
