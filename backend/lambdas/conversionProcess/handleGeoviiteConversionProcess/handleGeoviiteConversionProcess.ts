import { Context, SQSEvent } from 'aws-lambda';
import { lambdaRequestTracker } from 'pino-lambda';

import { log, logLambdaInitializationError } from '../../../utils/logger';

import { getPrismaClient } from '../../../utils/prismaClient';
import { ConversionMessage } from '../util';
import {
  GetConvertedTrackAddressesWithCoordsResultType,
  getConvertedTrackAddressesWithPrismaCoords,
} from '../../geoviite/geoviiteClient';

const init = () => {
  try {
    const withRequest = lambdaRequestTracker();

    const prisma = getPrismaClient();

    return {
      withRequest,
      prisma,
    };
  } catch (error) {
    logLambdaInitializationError.error(
      { error },
      'Error in lambda initialization code, abort',
    );
    throw error;
  }
};

const { withRequest, prisma } = init();

/**
 * Handle geoviite conversion process: get raportti from queue, run it through geoviite conversion api and save result in database
 */
export async function handleGeoviiteConversionProcess(
  event: SQSEvent,
  context: Context,
): Promise<void> {
  let key = '';
  const prismaClient = await prisma;
  try {
    withRequest(event, context);
    const sqsRecords = event.Records;
    const sqsRecord = sqsRecords[0]; // assume only one event at a time

    const message: ConversionMessage = JSON.parse(sqsRecord.body);
    key = message.key;
    log.info({ key }, 'Start conversion');

    // TODO: can row count be too large to fetch in one query?
    const mittausRows = await prismaClient.mittaus.findMany({
      where: {
        raportti: {
          key,
        },
      },
      select: {
        lat: true,
        long: true,
        id: true,
      },
    });


    const clientResult: GetConvertedTrackAddressesWithCoordsResultType = await getConvertedTrackAddressesWithPrismaCoords(mittausRows);

    const convertedRows = clientResult.features;
    // TODO: fetch all results first, or save after fetching one batch?

    // save result in batches
    const batchSize = 100;
    const batches: (typeof convertedRows)[] = [];
    for (let i = 0; i < convertedRows.length; i += batchSize) {
      batches.push(convertedRows.slice(i, i + batchSize));
    }

    // one timestamp for all
    const timestamp = new Date().toISOString();
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      await prismaClient.$transaction(
        // transaction to group multiple updates in one connection
        batch.map((result: { id: any }) =>
          prismaClient.mittaus.update({
            where: {
              id: result.id,
            },
            data: {
              // TODO: actual values here
              geoviite_updated_at: timestamp,
            },
          }),
        ),
      );
      // TODO: check errors?
    }
    await prismaClient.raportti.updateMany({
      // updateMany because key is not set as unique. TODO: should it be?
      where: {
        key,
      },
      data: {
        geoviite_status: 'SUCCESS',
        geoviite_update_at: timestamp,
      },
    });
  } catch (err) {
    log.error({
      error: err,
      message: 'Error in conversion process',
      key,
    });
    await prismaClient.raportti.updateMany({
      where: {
        key,
      },
      data: {
        geoviite_status: 'ERROR',
        geoviite_update_at: new Date().toISOString(),
      },
    });
  }
}
