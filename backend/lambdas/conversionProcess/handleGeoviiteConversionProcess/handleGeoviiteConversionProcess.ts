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
    log.info({ message }, 'Start conversion');

    // how many to handle in this invocation
    const invocationTotalBatchSize = message.batchSize;
    const invocationTotalBatchIndex = message.batchIndex;
    const startingSkip = invocationTotalBatchSize * invocationTotalBatchIndex;
    // how many to handle in one request
    const requestBatchSize = 1000;

    if (message.orderBy !== 'id') {
      throw new Error('orderBy value other than id not implemented');
    }

    const raportti = await prismaClient.raportti.findFirst({
      where: {
        key,
      },
      select: {
        id: true,
      },
    });
    if (!raportti) {
      throw new Error('Raportti not found');
    }
    // separate mittaus count query for optimization
    const totalMittausCount = await prismaClient.mittaus.count({
      where: {
        raportti_id: raportti.id,
      },
    });
    // this will be smaller on last batch
    const remainingMittausCount = totalMittausCount - startingSkip;
    if (totalMittausCount === 0) {
      throw new Error('Mittaus count 0');
    }
    // how many to handle in this invocation
    const mittausCount = Math.min(remainingMittausCount, message.batchSize);
    log.info({ mittausCount, remainingMittausCount, totalMittausCount });
    // loop through array in batches: get results for batch and save to db
    for (
      let requestIndex = 0;
      requestIndex < mittausCount;
      requestIndex += requestBatchSize
    ) {
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
        orderBy: { id: 'asc' },
        take: requestBatchSize,
        skip: startingSkip + requestIndex,
      });
      log.info({ length: mittausRows.length }, 'Got from db');

      const convertedRows: GeoviiteClientResultItem[] =
        await geoviiteClient.getConvertedTrackAddressesWithPrismaCoords(
          mittausRows,
        );
      log.info({ length: convertedRows.length }, 'converted');
      if (convertedRows.length !== mittausRows.length) {
        // TODO can this happen? or other errors from geoviite api?
        log.error('Size mismatch');
      }

      // save result in smaller batches
      const saveBatchSize = 1000;

      // one timestamp for all
      const timestamp = new Date().toISOString();
      for (
        let saveBatchIndex = 0;
        saveBatchIndex < convertedRows.length;
        saveBatchIndex += saveBatchSize
      ) {
        const batch = convertedRows.slice(
          saveBatchIndex,
          saveBatchIndex + saveBatchSize,
        );

        /*        UPDATE kalle.mittaus SET geoviite_updated_at = '2024-11-01 07:55:49.194 UTC', geoviite_konvertoitu_long = 23.07481750580574, geoviite_konvertoitu_lat = 63.77560873588688,
          geoviite_konvertoitu_rataosuus_numero = 008, geoviite_konvertoitu_rata_kilometri = 543, geoviite_konvertoitu_rata_metrit = 983.849, geoviite_konvertoitu_rataosuus_nimi = 'KALLETEST',
          geoviite_konvertoitu_raide_numero = '', geoviite_valimatka = 0.77748252596, geoviite_sijaintiraide = '008 LPA-KOK', geoviite_sijaintiraide_kuvaus = 'Ratanumeron raide: 008 Lapua - Kokkola',
          geoviite_sijaintiraide_tyyppi = 'pääraide', geoviite_sijaintiraide_oid = '1.2.246.578.3.10002.190470', geoviite_ratanumero_oid = '1.2.246.578.3.10002.190470' WHERE raportti_id = 1411;

        UPDATE kalle.mittaus SET geoviite_konvertoitu_long = CASE
        when id in (27554660) then 23.07481750580574
        when id in (27554661) then 22.01481
        END,
          geoviite_konvertoitu_lat = 60
        WHERE id IN (27554660, 27554661);
        */

        let query: string = 'UPDATE mittaus SET ';
        let longPart: string = 'geoviite_konvertoitu_long = CASE';
        let latPart: string = 'geoviite_konvertoitu_lat = CASE';
        let wherePart: string = 'WHERE id IN (';
        batch.forEach((row: GeoviiteClientResultItem) => {
          longPart += ' when id in (' + row.id + ') then ' + row.x;
          latPart += 'when id in (' + row.id + ') then ' + row.y;
          wherePart += ''+row.id+',';
        });
        longPart+= 'END,'
        latPart+= 'END'

        wherePart = wherePart.substring(0, wherePart.length -1 );
        query += longPart + latPart + wherePart;
        console.info(query, 'HELLO query');

        await prismaClient.$transaction(
          // transaction to group multiple updates in one connection
          batch.map((result: GeoviiteClientResultItem) => {
            // get a sensible value if ratametri or ratametri_desimaalit is missing
            let rata_metrit = '';
            if (result.ratametri) {
              rata_metrit = `${result.ratametri}`;
            }
            if (result.ratametri_desimaalit) {
              rata_metrit = `${rata_metrit}.${result.ratametri_desimaalit}`;
            }
            return prismaClient.mittaus.update({
              where: {
                id: result.id,
                // Sadly checking mittaus.id not enough. Mittaus subtables can share id.
                // See: https://stackoverflow.com/questions/56637251/violation-of-uniqueness-in-primary-key-when-using-inheritance
                raportti_id: raportti.id,
              },
              data: {
                geoviite_updated_at: timestamp,
                geoviite_konvertoitu_long: result.x,
                geoviite_konvertoitu_lat: result.y,
                geoviite_konvertoitu_rataosuus_numero: result.ratanumero,
                geoviite_konvertoitu_rata_kilometri: result.ratakilometri,
                geoviite_konvertoitu_rata_metrit: Number(rata_metrit),
                geoviite_konvertoitu_rataosuus_nimi: '', //TODO saataisiinko parsittua tiedosta result.sijaintiraide? Muoto näyttää epäjohdonmukaiselta.
                geoviite_konvertoitu_raide_numero: '', //TODO saataisiinko parsittua tiedosta result.sijaintiraide? Muoto näyttää epäjohdonmukaiselta.
                geoviite_valimatka: result.valimatka,
                geoviite_sijaintiraide: result.sijaintiraide,
                geoviite_sijaintiraide_kuvaus: result.sijaintiraide_kuvaus,
                geoviite_sijaintiraide_tyyppi: result.sijaintiraide_tyyppi,
                geoviite_sijaintiraide_oid: result.sijaintiraide_oid,
                geoviite_ratanumero_oid: result.ratanumero_oid,
              },
            });
          }),
        );
        // TODO: check errors?
      }
    }

    const readyTimestamp = new Date().toISOString();

    await prismaClient.raportti.updateMany({
      // updateMany because key is not set as unique. TODO: should it be?
      where: {
        key,
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
