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
  log.info("do nothing" + event + context);
}
