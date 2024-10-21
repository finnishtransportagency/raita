import { Context, SQSEvent } from 'aws-lambda';
import { lambdaRequestTracker } from 'pino-lambda';

import { log, logLambdaInitializationError } from '../../../utils/logger';

import { getPrismaClient } from '../../../utils/prismaClient';
import { ConversionMessage } from '../util';
import {
  GeoviiteClient
} from '../../geoviite/geoviiteClient';
import {getEnvOrFail} from "../../../../utils";

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
  const geoviiteClient =  new GeoviiteClient(geoviiteHostname);
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



    const clientResult: any = await geoviiteClient.getConvertedTrackAddressesWithPrismaCoords(mittausRows);

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
        batch.map((result:any) =>
          prismaClient.mittaus.update({
            where: {
              id: result.id,
            },
            data: {
              // TODO: actual values here
              geoviite_updated_at: timestamp,
              long: result.x,
              lat: result.y,
              geoviite_valimatka: result.valimatka,
              geoviite_konvertoitu_rataosuus_numero: result.ratanumero,
              geoviite_ratanumero_oid: result.ratanumer.oid,
              geoviite_raide: sijaintiraide: '007 PR KE-HLT',
              geoviite_sijaintiraide_kuvaus: 'Kerava - Hakosilta oikorata pohjoinen raide',
              geoviite_sijaintiraide_tyyppi: 'pääraide',
              geoviite_sijaintiraide_oid: '1.2.246.578.3.10002.191405',
              geoviite_konvertoitu_ratakilometri: 30,
              geoviite_konvertoitu_ratametri: 995,
              ratametri_desimaalit: 738
            },
          }),
        ),
      );
      // TODO: check errors?
    }

    geoviite_konvertoitu_lat                       Decimal?                  @db.Decimal
      geoviite_konvertoitu_long                      Decimal?                  @db.Decimal
      geoviite_konvertoitu_rataosuus_numero          String?                   @db.VarChar(40)
      geoviite_konvertoitu_rataosuus_nimi            String?                   @db.VarChar(40)
      geoviite_konvertoitu_raide_numero              String?                   @db.VarChar(40)
      geoviite_konvertoitu_rata_kilometri            Int?
      geoviite_konvertoitu_rata_metrit               Decimal?                  @db.Decimal
        geoviite_konvertoitu_sijainti                  Unsupported("geography")?
      geoviite_valimatka                             Decimal?                  @db.Decimal
        geoviite_sijaintiraide_kuvaus                  String?                   @db.VarChar(200)
      geoviite_sijaintiraide_tyyppi



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
