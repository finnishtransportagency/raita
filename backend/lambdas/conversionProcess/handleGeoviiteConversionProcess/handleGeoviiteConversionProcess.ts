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

function produceUpdateSql(
  batch: GeoviiteClientResultItem[],
  timestamp: string,
): string {
  let query: string = 'UPDATE mittaus SET';
  let longPart: string = ' geoviite_konvertoitu_long = CASE';
  let latPart: string = ' geoviite_konvertoitu_lat = CASE';
  let osuusNumPart: string = ' geoviite_konvertoitu_rataosuus_numero = CASE';
  let kmPart: string = ' geoviite_konvertoitu_rata_kilometri = CASE';
  let mPart: string = ' geoviite_konvertoitu_rata_metrit = CASE';
  let osuusNimiPart: string = ' geoviite_konvertoitu_rataosuus_nimi = CASE';
  let raideNumPart: string = ' geoviite_konvertoitu_raide_numero = CASE';
  let valimatkaPart: string = ' geoviite_valimatka = CASE';
  let sijRaidePart: string = ' geoviite_sijaintiraide = CASE';
  let sijRaideKuvPart: string = ' geoviite_sijaintiraide_kuvaus = CASE';
  let sijRaideTyypPart: string = ' geoviite_sijaintiraide_tyyppi = CASE';
  let sijRaideOidPart: string = ' geoviite_sijaintiraide_oid = CASE';
  let ratanumOidPart: string = ' geoviite_ratanumero_oid = CASE';


  let wherePart: string = ' WHERE id IN (';
  batch.forEach((row: GeoviiteClientResultItem) => {
    longPart += ' when id in (' + row.id + ') then ' + row.x;
    latPart += ' when id in (' + row.id + ') then ' + row.y;
    osuusNumPart +=
      ' when id in (' + row.id + ') then ' + "'" + row.ratanumero + "'";
    kmPart += ' when id in (' + row.id + ') then ' + row.y;
    let rata_metrit = '';
    if (row.ratametri) {
      rata_metrit = `${row.ratametri}`;
    }
    if (row.ratametri_desimaalit) {
      rata_metrit = `${rata_metrit}.${row.ratametri_desimaalit}`;
    }
    mPart += ' when id in (' + row.id + ') then ' + rata_metrit;
    osuusNimiPart += ' when id in (' + row.id + ') then ' + "''";
    raideNumPart += ' when id in (' + row.id + ') then ' + "''";
    valimatkaPart += ' when id in (' + row.id + ') then ' + row.valimatka;
    sijRaidePart +=
      ' when id in (' + row.id + ') then ' + "'" + row.sijaintiraide + "'";
    sijRaideKuvPart +=
      ' when id in (' +
      row.id +
      ') then ' +
      "'" +
      row.sijaintiraide_kuvaus +
      "'";
    sijRaideTyypPart +=
      ' when id in (' +
      row.id +
      ') then ' +
      "'" +
      row.sijaintiraide_tyyppi +
      "'";
    sijRaideOidPart +=
      ' when id in (' + row.id + ') then ' + "'" + row.sijaintiraide_oid + "'";
    ratanumOidPart +=
      ' when id in (' + row.id + ') then ' + "'" + row.ratanumero_oid + "'";

    wherePart += '' + row.id + ',';
  });
  longPart += ' END,';
  latPart += ' END';

  wherePart = wherePart.substring(0, wherePart.length - 1);
  wherePart += ');';
  const timestampPart: string = ' geoviite_updated_at =  ' +timestamp;
  query += longPart + latPart + timestampPart + wherePart;
  log.info(query);
  return query;
}

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
      const saveBatchSize = 10;

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


        const updateSql:string = produceUpdateSql(batch, timestamp);
        await prismaClient.$executeRawUnsafe(updateSql);
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
