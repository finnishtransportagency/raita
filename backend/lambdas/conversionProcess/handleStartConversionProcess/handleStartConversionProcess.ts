import { Context } from 'aws-lambda';
import { lambdaRequestTracker } from 'pino-lambda';

import { log, logLambdaInitializationError } from '../../../utils/logger';
import { SendMessageBatchCommand, SQSClient } from '@aws-sdk/client-sqs';

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

// TODO: how are possible status values defined?
const waitingForConversionStatus = 'WAITING';
const inProgressStatus = 'IN_PROGRESS';

/**
 * Handle conversion process:
 * Fetch list of raporttis to convert and add them to SQS
 */
export async function handleStartConversionProcess(
  event: any, // TODO what event will be the trigger?
  context: Context,
): Promise<void> {
  try {
    withRequest(event, context);
    log.info('Start conversion process');
    // TODO: extract some input from event, like prefix path?

    // currently fetch all files with a specific status. TODO: do we need to limit maximum amount somehow?
    const whereInput = {
      geoviite_status: {
        equals: waitingForConversionStatus,
      },
      file_type: {
        equals: 'csv',
      },
    };
    // TODO: do we need to account for more raportti being added during this process?
    const totalCount = await (
      await prisma
    ).raportti.count({
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
      const files = await (
        await prisma
      ).raportti.findMany({
        where: whereInput,
        select: {
          key: true,
        },
        take: pageCount,
      });
      const keys = files.map(file => file.key).filter(key => key !== null);
      // sending to queue has a batch limit of 10
      const queueBatchSize = 10;
      let successfulKeys: string[] = [];
      let failedKeys: string[] = [];
      for (
        let keyIndex = 0;
        keyIndex < keys.length;
        keyIndex += queueBatchSize
      ) {
        const currentKeys = keys.slice(keyIndex, keyIndex + queueBatchSize);
        const command = new SendMessageBatchCommand({
          QueueUrl: config.queueUrl,
          Entries: currentKeys.map((key, i) => {
            const body: ConversionMessage = { key };
            return {
              Id: `${i}`, // unique in single request only
              MessageBody: JSON.stringify(body),
            };
          }),
        });
        const queueResponse = await sqsClient.send(command);
        if (queueResponse.Failed?.length) {
          log.error({ queueResponse }, 'Some keys failed');
          const failed = queueResponse.Failed?.map(
            result => currentKeys[Number(result.Id)],
          );
          failedKeys = failedKeys.concat(failed);
        }
        const succeeded =
          queueResponse.Successful?.map(
            result => currentKeys[Number(result.Id)],
          ) ?? [];
        successfulKeys = successfulKeys.concat(succeeded);

        await asyncWait(5); // wait to avoid hitting rate limits
      }
      await (
        await prisma
      ).raportti.updateMany({
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
    log.error({
      error: err,
      message: 'An error occured while processing events',
    });
  }
}
