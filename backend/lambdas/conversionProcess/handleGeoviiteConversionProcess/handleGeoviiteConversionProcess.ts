import { Context, SQSEvent } from 'aws-lambda';
import { lambdaRequestTracker } from 'pino-lambda';

import { log, logLambdaInitializationError } from '../../../utils/logger';

import { getPrismaClient } from '../../../utils/prismaClient';
import { ConversionMessage } from '../util';
import {
  GeoviiteClient,
  GeoviiteClientResultItem,
} from '../../geoviite/geoviiteClient';
import { getEnvOrFail } from '../../../../utils';
import {
  getMittausSubtable,
  produceGeoviiteBatchUpdateSql, produceGeoviiteBatchUpdateSql2,
} from '../../dataProcess/csvCommon/db/dbUtil';
import { Prisma } from '@prisma/client';
import { ConversionStatus } from '../../dataProcess/csvCommon/db/model/Mittaus';

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
  const geoviiteHostname = getEnvOrFail('GEOVIITE_HOSTNAME');
  const geoviiteClient = new GeoviiteClient(geoviiteHostname);
  const prismaClient = await prisma;
  try {
    withRequest(event, context);
    const sqsRecords = event.Records;
    const sqsRecord = sqsRecords[0]; // assume only one event at a time

    const message: ConversionMessage = JSON.parse(sqsRecord.body);
    key = message.key;
    const id = message.id;
    const system = message.system;
    log.trace({ message }, 'Start conversion');

    // how many to handle in this invocation
    const invocationTotalBatchSize = message.batchSize;
    const invocationTotalBatchIndex = message.batchIndex;
    const startingSkip = invocationTotalBatchSize * invocationTotalBatchIndex;
    // how many to handle in one request
    const requestBatchSize = 1000;

    if (message.orderBy !== 'id') {
      throw new Error('orderBy value other than id not implemented');
    }

    //Use subtable for performance
    const mittausTable = await getMittausSubtable(system, prismaClient);

    // separate mittaus count query for optimization

    // @ts-ignore
    const totalMittausCount = await mittausTable.count({
      where: {
        raportti_id: id,
      },
    });
    // this will be smaller on last batch
    const remainingMittausCount = totalMittausCount - startingSkip;
    if (totalMittausCount === 0) {
      throw new Error('Mittaus count 0');
    }
    // how many to handle in this invocation
    const mittausCount = Math.min(remainingMittausCount, message.batchSize);
    log.trace({ mittausCount, remainingMittausCount, totalMittausCount });
    // loop through array in batches: get results for batch and save to db
    for (
      let requestIndex = 0;
      requestIndex < mittausCount;
      requestIndex += requestBatchSize
    ) {
      // @ts-ignore
      const mittausRows = await mittausTable.findMany({
        where: {
          raportti_id: id,
        },
        select: {
          lat: true,
          long: true,
          id: true,
        },
        orderBy: { id: 'asc' },
        take: requestBatchSize,
        skip: startingSkip + requestIndex,
      });
      log.trace({ length: mittausRows.length }, 'Got from db');

      const convertedRows: GeoviiteClientResultItem[] =
        await geoviiteClient.getConvertedTrackAddressesWithPrismaCoords(
          mittausRows,
        );
      log.trace({ length: convertedRows.length }, 'converted');
      if (convertedRows.length !== mittausRows.length) {
        /*
         Should not happen. Errors from geoviite api are returned as rows with 'virheet' -value.
         */
        log.error('Size mismatch');
      }

      // save result all at once to save db call time cost
      const saveBatchSize = 10;

      // one timestamp for all
      const timestamp = new Date();
      for (
        let saveBatchIndex = 0;
        saveBatchIndex < convertedRows.length;
        saveBatchIndex += saveBatchSize
      ) {
        const batch = convertedRows.slice(
          saveBatchIndex,
          saveBatchIndex + saveBatchSize,
        );

        const updateSql = produceGeoviiteBatchUpdateSql2(
          batch,
          timestamp,
          system,
        );
        try {
          log.trace('start geoviite db update');
          await prismaClient.$executeRaw(updateSql);
          log.trace('done geoviite db update');
        } catch (err) {
          log.error(updateSql);
          throw err;
        }
        // TODO: check errors?
      }
    }

    const readyTimestamp = new Date().toISOString();

    await prismaClient.raportti.update({
      where: {
        id,
      },
      data: {
        geoviite_status: ConversionStatus.SUCCESS,
        geoviite_update_at: readyTimestamp,
      },
    });
  } catch (err) {
    log.error(err);
    log.error({
      message: 'Error in conversion process',
      key,
    });
    await prismaClient.raportti.updateMany({
      where: {
        key,
      },
      data: {
        geoviite_status: ConversionStatus.ERROR,
        geoviite_update_at: new Date().toISOString(),
      },
    });
  }
}
