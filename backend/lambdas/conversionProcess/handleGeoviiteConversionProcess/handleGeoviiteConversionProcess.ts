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
} from '../../dataProcess/csvCommon/db/dbUtil';
import { ConversionStatus } from '../../dataProcess/csvCommon/db/model/Mittaus';
import { IAdminLogger } from '../../../utils/adminLog/types';
import { PostgresLogger } from '../../../utils/adminLog/postgresLogger';

const init = () => {
  try {
    const withRequest = lambdaRequestTracker();

    const dbConnection: Promise<DBConnection> = getDBConnection(true);
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

    log.info('message id ' + sqsRecord.messageId);
    message = JSON.parse(sqsRecord.body);
    if (!message) {
      throw new Error('Error parsing JSON');
    }
    const id = message.id;
    const key = message.key;

    log.info({ id }, 'handleGeoviiteConversionProcess raportti id');
    const system = message.system;

    const invocationId = message.invocationId;
    await adminLogger.init('conversion-process', invocationId);

    const invocationTotalBatchIndex = message.batchIndex;
    const invocationTotalBatchCount = message.batchCount;

    // what to handle in this invocation
    const invocationStartId = message.startID;
    const invocationEndId = message.endID;
    log.trace('start end: ' + invocationStartId + ' ' + invocationEndId);

    await prismaClient.raportti.updateMany({
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

    // how many to handle in one request (could be less cause ids not necessarily adjacent)
    const requestBatchSize = 1000;

    if (message.orderBy !== 'id') {
      throw new Error('orderBy value other than id not implemented');
    }

    //Use subtable for performance
    const mittausTable = await getMittausSubtable(system, prismaClient);

    // Save result in smaller batches.
    // We use the largest value that works with prepared statement to reduce db call count.
    const saveBatchSize = 500;

    let rapottiHasLatLongFlippedMittauses = false;
    let first = true;

    let startId = invocationStartId;
    // loop through array in batches: get results for batch and save to db
    while (startId <= invocationEndId) {
      // @ts-ignore
      const mittausRows = await mittausTable.findMany({
        where: {
          raportti_id: id,
          id: {
            gte: startId,
          },
        },
        select: {
          lat: true,
          long: true,
          id: true,
        },
        orderBy: { id: 'asc' },
        take: requestBatchSize,
      });

      log.trace(
        'Got from db' +
          mittausRows.length +
          ' Raportti id: ' +
          id +
          ' Mittaus start id: ' +
          startId,
      );

      if (mittausRows.length == 0) {
        break;
      }
      startId = 1 + mittausRows[mittausRows.length - 1].id;

      log.trace('startId: ' + startId);

      log.trace('saveBatchSize: ' + saveBatchSize);
      log.trace('mittausRows.length: ' + mittausRows.length);

      mittausRows.forEach(async (row: { lat: any; long: any }) => {
        if (isNonsenseCoords(row)) {
          await adminLogger.warn(
            `Normaalien koordinaattien ulkopuolinen lat ja/tai long arvo (${row.lat},${row.long}) viitekehysmuuntimen prosessissa tiedostolla: ${key} `,
          );
        } else if (isLatLongFlipped(row)) {
          const oldLat = row.lat;
          row.lat = row.long;
          row.long = oldLat;
          rapottiHasLatLongFlippedMittauses = true;
        }
      });

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
          true,
        );

        try {
          await prismaClient.$executeRaw(updateSql);
        } catch (err) {
          log.error(
            { err },
            'update error at invocationBatchIndex: ' +
              invocationTotalBatchIndex +
              ' startId:' +
              startId +
              ' saveBatchIndex:' +
              saveBatchIndex,
          );
          log.error({ updateSql });
          throw err;
        }

        log.trace(
          ' success at invocationBatchIndex: ' +
            invocationTotalBatchIndex +
            ' startId:' +
            startId +
            ' saveBatchIndex:' +
            saveBatchIndex,
        );
      }
    }

    const readyTimestamp = new Date().toISOString();
    if (rapottiHasLatLongFlippedMittauses) {
      await adminLogger.warn(
        `Lat ja long vaihdettu oikein päin viitekehysmuuntimen prosessissa tiedostolla: ${message.key}`,
      );
    }
    if (invocationTotalBatchIndex + 1 == invocationTotalBatchCount) {
      await prismaClient.raportti.updateMany({
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
          id: message.id,
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
    throw err;
  }

}
