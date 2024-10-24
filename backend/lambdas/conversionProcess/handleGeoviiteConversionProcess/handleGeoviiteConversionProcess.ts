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
    log.info({ key }, 'Start conversion');

    // TODO: can row count be too large to fetch in one query?
    // Yes, a raportti can have 500 0000 mittauses. Geoviite has made an initial promise of 1000 per conversion.
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

    const convertedRows: GeoviiteClientResultItem[] =
      await geoviiteClient.getConvertedTrackAddressesWithPrismaCoords(
        mittausRows,
      );

    // TODO: fetch all results first, or save after fetching one batch?

    // save result in batches
    const batchSize = 100;
    const batches: GeoviiteClientResultItem[][] = [];
    for (let i = 0; i < convertedRows.length; i += batchSize) {
      batches.push(convertedRows.slice(i, i + batchSize));
    }

    // one timestamp for all
    const timestamp = new Date().toISOString();
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      await prismaClient.$transaction(
        // transaction to group multiple updates in one connection
        batch.map((result: GeoviiteClientResultItem) =>
          prismaClient.mittaus.update({
            where: {
              id: result.id,
              // Sadly checking mittaus.id not enough. Mittaus subtables can share id.
              // See: https://stackoverflow.com/questions/56637251/violation-of-uniqueness-in-primary-key-when-using-inheritance
              raportti: {
                key,
              },
            },
            data: {
              geoviite_updated_at: timestamp,
              geoviite_konvertoitu_long: result.x,
              geoviite_konvertoitu_lat: result.y,
              geoviite_konvertoitu_rataosuus_numero: result.ratanumero,
              geoviite_konvertoitu_rata_kilometri: result.ratakilometri,
              geoviite_konvertoitu_rata_metrit:
                result.ratametri.toString() +
                '.' +
                result.ratametri_desimaalit.toString(),
              geoviite_konvertoitu_rataosuus_nimi: '', //TODO saataisiinko parsittua tiedosta result.sijaintiraide? Muoto näyttää epäjohdonmukaiselta.
              geoviite_konvertoitu_raide_numero: '', //TODO saataisiinko parsittua tiedosta result.sijaintiraide? Muoto näyttää epäjohdonmukaiselta.
              geoviite_valimatka: result.valimatka,
              geoviite_sijaintiraide: result.sijaintiraide,
              geoviite_sijaintiraide_kuvaus: result.sijaintiraide_kuvaus,
              geoviite_sijaintiraide_tyyppi: result.sijaintiraide_tyyppi,
              geoviite_sijaintiraide_oid: result.sijaintiraide_oid,
              geoviite_ratanumero_oid: result.ratanumero_oid,
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
