import { Context } from 'aws-lambda';
import { LambdaEvent, lambdaRequestTracker } from 'pino-lambda';

import { log, logLambdaInitializationError } from '../../../utils/logger';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';

import { getPrismaClient } from '../../../utils/prismaClient';
import { getLambdaConfigOrFail } from './util';
import { asyncWait } from '../../../utils/common';
import { ConversionMessage } from '../util';

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

// TODO: how are possible status values defined?
const waitingForConversionStatus = 'WAITING';
const inProgressStatus = 'IN_PROGRESS';

// for manual testing
type TestEvent = {
  key: string;
} & LambdaEvent;

/**
 * Handle conversion process:
 * Fetch list of raporttis to convert and add them to SQS
 */
export async function handleStartConversionProcess(
  event: TestEvent, // TODO what event will be the trigger?
  context: Context,
): Promise<void> {
  try {
    withRequest(event, context);
    log.info({ event });
    log.info('Start conversion process');
    const prismaClient = await prisma;
    // TODO: extract some input from event, like prefix path?

    // if no key is given, fetch all with status WAITING
    const whereInput = event.key
      ? {
          key: {
            equals: event.key,
          },
        }
      : {
          geoviite_status: {
            equals: waitingForConversionStatus,
          },
          file_type: {
            equals: 'csv',
          },
        };
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
          geoviite_status: inProgressStatus,
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
