import { Context, SQSEvent } from 'aws-lambda';
import { lambdaRequestTracker } from 'pino-lambda';

import { log, logLambdaInitializationError } from '../../../utils/logger';

import { ConversionMessage, isLatLongFlipped, isNonsenseCoords } from '../util';
import {
  GeoviiteClient,
  GeoviiteClientResultItem,
} from '../../geoviite/geoviiteClient';
import { getEnvOrFail } from '../../../../utils';
import {
  DBConnection,
  getDBConnection,
  getMittausSubtable,
  produceGeoviiteBatchUpdateSql,
  produceGeoviiteBatchUpdateStatementInitSql,
} from '../../dataProcess/csvCommon/db/dbUtil';
import { ConversionStatus } from '../../dataProcess/csvCommon/db/model/Mittaus';
import { IAdminLogger } from '../../../utils/adminLog/types';
import { PostgresLogger } from '../../../utils/adminLog/postgresLogger';
import { PrismaClient } from '@prisma/client';

const init = () => {
  try {
    const withRequest = lambdaRequestTracker();

    const dbConnection: Promise<DBConnection> = getDBConnection();
    const adminLogger: IAdminLogger = new PostgresLogger(dbConnection);

    return {
      withRequest,
      adminLogger,
      dbConnection,
    };
  } catch (error) {
    logLambdaInitializationError.error(
      { error },
      'Error in lambda initialization code, abort',
    );
    throw error;
  }
};

const { withRequest, dbConnection, adminLogger } = init();

// First call to produceGeoviiteBatchUpdateSql should be done with decimal vals in decimal fields, cause postgres deduces datatypes from the first
// call to the prepared statement. Otherwise if the first val to decimal fields is int, later decimal vals cause error:  incorrect binary data format in bind parameter
async function initStatement(
  saveBatchSize: number,
  system: string | null,
  latLongFlipped: boolean,
  prismaClient: PrismaClient,
  invocationTotalBatchIndex: string | number,
): Promise<void> {
  const updateSql = produceGeoviiteBatchUpdateStatementInitSql(
    saveBatchSize,
    system,
    latLongFlipped,
  );

  try {
    log.trace('start geoviite StatementInit update');
    await prismaClient.$executeRaw(updateSql);
    log.trace('done geoviite StatementInit update');
  } catch (err) {
    log.error(
      { err },
      'StatementInit error at invocationBatchIndex: ' +
        invocationTotalBatchIndex,
    );
    log.error({ updateSql });
    throw err;
  }

  log.trace(
    'StatementInit success at invocationBatchIndex: ' +
      invocationTotalBatchIndex,
  );
}

/**
 * Handle geoviite conversion process: get raportti from queue, run it through geoviite conversion api and save result in database
 */
export async function handleGeoviiteConversionProcess(
  event: SQSEvent,
  context: Context,
): Promise<void> {
  let message: ConversionMessage | null = null;
  const geoviiteHostname = getEnvOrFail('GEOVIITE_HOSTNAME');
  const geoviiteClient = new GeoviiteClient(geoviiteHostname);
  const prismaClient = (await dbConnection).prisma;
  try {
    withRequest(event, context);
    const sqsRecords = event.Records;
    const sqsRecord = sqsRecords[0]; // assume only one event at a time

    message = JSON.parse(sqsRecord.body);
    if (!message) {
      throw new Error('Error parsing JSON');
    }
    const id = message.id;
    const system = message.system;

    const invocationId = message.invocationId;
    await adminLogger.init('conversion-process', invocationId);

    // how many to handle in this invocation
    const invocationTotalBatchSize = message.batchSize;
    const invocationTotalBatchIndex = message.batchIndex;
    const invocationTotalBatchCount = message.batchCount;

    await prismaClient.raportti.update({
      where: {
        id,
        geoviite_status: { not: ConversionStatus.ERROR },
      },
      data: {
        geoviite_status:
          ConversionStatus.IN_PROGRESS +
          '_' +
          invocationTotalBatchIndex +
          '/' +
          invocationTotalBatchCount,
      },
    });

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

    // Save result in smaller batches.
    // We use the largest value that works with prepared statement to reduce db call count.
    const saveBatchSize = 500;

    let first = true;

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

      let latLongFlipped = false;
      if (isNonsenseCoords(mittausRows)) {
        await adminLogger.warn(
          `Normaalien koordinaattien ulkpuolinen lat ja/tai long arvo viitekehysmuuntimen prosessissa tiedostolla: ${message.key}`,
        );
      } else {
        latLongFlipped = isLatLongFlipped(mittausRows);
      }

      if (first) {
        initStatement(
          saveBatchSize,
          system,
          latLongFlipped,
          prismaClient,
          invocationTotalBatchIndex,
        );
        first = false;
      }

      if (latLongFlipped) {
        await adminLogger.warn(
          `Lat ja long vaihdettu oikein päin viitekehysmuuntimen prosessissa tiedostolla: ${message.key}`,
        );
        mittausRows.forEach((row: { lat: any; long: any }) => {
          const oldLat = row.lat;
          row.lat = row.long;
          row.long = oldLat;
        });
      }

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

        const updateSql = produceGeoviiteBatchUpdateSql(
          batch,
          timestamp,
          system,
          latLongFlipped,
        );
        try {
          await prismaClient.$executeRaw(updateSql);
        } catch (err) {
          log.error(
            { err },
            'update error at invocationBatchIndex: ' +
              invocationTotalBatchIndex +
              ' requestIndex:' +
              requestIndex +
              ' saveBatchIndex:' +
              saveBatchIndex,
          );
          log.error({ updateSql });
          throw err;
        }

        log.trace(
          ' success at invocationBatchIndex: ' +
            invocationTotalBatchIndex +
            ' requestIndex:' +
            requestIndex +
            ' saveBatchIndex:' +
            saveBatchIndex,
        );
      }
    }

    const readyTimestamp = new Date().toISOString();

    if (invocationTotalBatchIndex == invocationTotalBatchCount) {
      await prismaClient.raportti.update({
        where: {
          id,
          geoviite_status: { not: ConversionStatus.ERROR },
        },
        data: {
          geoviite_status: ConversionStatus.SUCCESS,
          geoviite_update_at: readyTimestamp,
        },
      });
    }
  } catch (err) {
    log.error(err);
    log.error(
      {
        message: message,
      },
      'Error in conversion process',
    );
    if (message?.key) {
      await prismaClient.raportti.updateMany({
        where: {
          key: message.key,
        },
        data: {
          geoviite_status: ConversionStatus.ERROR,
          geoviite_update_at: new Date().toISOString(),
        },
      });
      await adminLogger.error(
        `Virhe viitekehysmuuntimen prosessissa tiedostolla: ${message.key}`,
      );
    } else {
      await adminLogger.error(
        `Virhe viitekehysmuuntimen prosessissa tiedostolla: tuntematon tiedosto`,
      );
    }
  }
}
