import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getGetEnvWithPreassignedContext } from '../../../../utils';
import { log } from '../../../utils/logger';
import { lambdaRequestTracker } from 'pino-lambda';
import { Context } from 'aws-lambda';
import { getPrismaClient } from '../../../utils/prismaClient';
import { Prisma, PrismaClient } from '@prisma/client';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  prependBOMToStream,
  uploadProgressData,
  uploadReadableToS3,
} from './utils';
import {
  getMittausFieldsPerSystem,
  getRaporttiWhereInput,
} from '../../../apollo/utils';
import { CSV_GENERATION_MAX_RAPORTTI_ROW_COUNT } from '../../../../constants';
import { PassThrough, Readable } from 'stream';
import {
  AnyMittausTableFindManyArgs,
  CsvGenerationEvent,
  MittausCombinationLogic,
  MittausDbResult,
} from './types';
import { MittausInput } from '../../../apollo/__generated__/resolvers-types';
import {
  FailedProgressData,
  InitialProgressData,
  SuccessProgressData,
} from './constants';
import { writeDbChunkToStream } from './mittausCsvUtils';

const withRequest = lambdaRequestTracker();

const CSV_CHUNK_SIZE = 10000;

function getLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext('handleZipProcessing');
  return {
    targetBucket: getEnv('TARGET_BUCKET'),
  };
}

export async function handleCsvGeneration(
  event: CsvGenerationEvent,
  context: Context,
) {
  withRequest(event, context);
  log.info({ event }, 'start');
  const config = getLambdaConfigOrFail();
  const s3Client = new S3Client({});

  try {
    await generateCsv(event, s3Client, config.targetBucket);
  } catch (error) {
    log.error({ error }, 'Error with CSV generation');
    await uploadProgressData(
      FailedProgressData,
      config.targetBucket,
      event.progressKey,
      s3Client,
    );
  }
}

async function generateCsv(
  event: CsvGenerationEvent,
  s3Client: S3Client,
  targetBucket: string,
) {
  if (
    !event ||
    !event.searchParameters ||
    !event.progressKey ||
    !event.csvKey
  ) {
    throw new Error('Missing params');
  }
  const params = event.searchParameters; // TODO is validation needed?

  const { raportti, raportti_keys, mittaus, columns, settings } = params;

  const selectedColumns = columns;

  const mittausCombinationLogic: MittausCombinationLogic =
    settings.mittausCombinationLogic ?? 'MEERI_RATAOSOITE';

  const progressKey = event.progressKey;
  const csvKey = event.csvKey;
  await uploadProgressData(
    InitialProgressData,
    targetBucket,
    progressKey,
    s3Client,
  );

  const raporttiWhere: Prisma.raporttiWhereInput =
    raportti_keys && raportti_keys.length
      ? {
          key: {
            in: raportti_keys,
          },
          deleted: {
            equals: false,
          },
        }
      : getRaporttiWhereInput(raportti ?? {});

  // use a readable stream to read data from db and write to s3
  // this is because the desired data chunk sizes when reading from db and writing to s3 are different
  const csvReadResult = await readDbToReadable(
    raporttiWhere,
    selectedColumns,
    mittaus,
    mittausCombinationLogic,
  );

  const csvStream = prependBOMToStream(csvReadResult.outputStream);

  try {
    await Promise.all([
      uploadReadableToS3(csvStream, targetBucket, csvKey, s3Client),
      csvReadResult.result,
    ]);
  } catch (error) {
    log.error(error);
    log.error('Error in upload or db read');
    throw new Error('Error in upload or db read');
  }

  const downloadCommand = new GetObjectCommand({
    Bucket: targetBucket,
    Key: csvKey,
  });
  const downloadUrl = await getSignedUrl(s3Client, downloadCommand, {
    expiresIn: 3600,
  });

  const split = csvKey.split('/');
  const filename = split[split.length - 1];
  await uploadProgressData(
    {
      ...SuccessProgressData,
      url: downloadUrl,
      filename,
    },
    targetBucket,
    progressKey,
    s3Client,
  );
  log.info({ csvKey, progressKey }, 'Done');
}

/**
 * Return a select input object for Prisma that selects the columns based on system
 * If columnsInput is empty, choose all columns, otherwise choose only ones in columnsInput
 */
const getColumnsSelectInputForSystem = (
  system: string,
  columnsInput: string[],
) => {
  const allColumnsPerSystem = getMittausFieldsPerSystem();
  const systemDescription = allColumnsPerSystem.find(
    description => description.name === system,
  );
  const allColumns = systemDescription?.columns;
  allColumns?.concat('ajonopeus');
  if (!allColumns) {
    throw new Error('TODO');
  }
  const result: { [column: string]: boolean } = {};
  const selectedColumns = columnsInput.length
    ? allColumns.filter(column => columnsInput.includes(column))
    : allColumns;
  selectedColumns.forEach(column => (result[column] = true));
  return result;
};

/**
 * Fetch mittaus rows from db from the correct system specific mittaus subtable
 */
const getPartialMittausRows = async (
  client: PrismaClient,
  raporttiIds: number[],
  system: string,
  offset: number,
  pageSize: number,
  selectedColumns: string[],
  mittaus: MittausInput,
  mittausCombinationLogic: MittausCombinationLogic,
): Promise<MittausDbResult[]> => {
  const systemSpecificColumnSelections = getColumnsSelectInputForSystem(
    system,
    selectedColumns,
  );
  const orderBy: AnyMittausTableFindManyArgs['orderBy'] =
    mittausCombinationLogic === 'MEERI_RATAOSOITE'
      ? [
          {
            rata_kilometri: 'asc',
          },
          {
            rata_metrit: 'asc',
          },
        ]
      : mittausCombinationLogic === 'GEOVIITE_RATAOSOITE_ROUNDED'
        ? [
            // TODO: could rounding of rataosoite be done in db query?
            { geoviite_konvertoitu_rata_kilometri: 'asc' },
            { geoviite_konvertoitu_rata_metrit: 'asc' },
          ]
        : [];
  const selectAjonopeus = selectedColumns.includes('ajonopeus');
  const params: AnyMittausTableFindManyArgs = {
    where: {
      raportti_id: {
        in: raporttiIds,
      },
      ...((mittaus.rata_kilometri?.start !== undefined ||
        mittaus.rata_kilometri?.end !== undefined) && {
        rata_kilometri: {
          ...(mittaus.rata_kilometri?.start !== undefined &&
            mittaus.rata_kilometri?.start !== null && {
              gte: mittaus.rata_kilometri.start,
            }),
          ...(mittaus.rata_kilometri?.end !== undefined &&
            mittaus.rata_kilometri?.end !== null && {
              lte: mittaus.rata_kilometri.end,
            }),
        },
      }),
    },
    orderBy,
    select: {
      ...systemSpecificColumnSelections,
      raportti_id: true,
      sscount: false,
      jarjestelma: false,
      ajonopeus: selectAjonopeus,
      rata_kilometri: true,
      rata_metrit: true,
      geoviite_konvertoitu_rata_kilometri: true,
      geoviite_konvertoitu_rata_metrit: true,
      lat: true,
      long: true,
      geoviite_konvertoitu_lat: true,
      geoviite_konvertoitu_long: true,
      track: true,
    },
    // TODO: offset paging could be too slow?
    skip: offset,
    take: pageSize,
  };
  switch (system) {
    case 'AMS':
      return await client.ams_mittaus.findMany(
        params as Prisma.ams_mittausFindManyArgs,
      );
    case 'OHL':
      return await client.ohl_mittaus.findMany(
        params as Prisma.ohl_mittausFindManyArgs,
      );
    case 'PI':
      return await client.pi_mittaus.findMany(
        params as Prisma.pi_mittausFindManyArgs,
      );
    case 'RC':
      return await client.rc_mittaus.findMany(
        params as Prisma.rc_mittausFindManyArgs,
      );
    case 'RP':
      return await client.rp_mittaus.findMany(
        params as Prisma.rp_mittausFindManyArgs,
      );
    case 'TG':
      return await client.tg_mittaus.findMany(
        params as Prisma.tg_mittausFindManyArgs,
      );
    case 'TSIGHT':
      return await client.tsight_mittaus.findMany(
        params as Prisma.tsight_mittausFindManyArgs,
      );
    default:
      throw new Error('Unknown system');
  }
};

/**
 * Get Readable stream that will eventually contain all csv data, fetched from dn
 *
 * result promise will resolve after writing is done, or reject with error
 */
const readDbToReadable = async (
  raporttiWhere: Prisma.raporttiWhereInput,
  selectedColumns: string[],
  mittaus: MittausInput,
  mittausCombinationLogic: MittausCombinationLogic,
): Promise<{ outputStream: Readable; result: Promise<any> }> => {
  const client = await getPrismaClient();
  const raporttiCount = await client.raportti.count({
    where: raporttiWhere,
  });
  const limit = CSV_GENERATION_MAX_RAPORTTI_ROW_COUNT;
  if (raporttiCount > limit) {
    throw new Error('Size limit reached');
  }
  const systemsResult = await client.raportti.findMany({
    where: raporttiWhere,
    distinct: ['system'],
    select: {
      system: true,
    },
  });

  const raporttiRows = await client.raportti.findMany({
    where: { ...raporttiWhere },
    select: {
      id: true,
      inspection_date: true,
      system: true,
    },
  });

  const systemsInResults: string[] = systemsResult
    .filter(res => !!res.system)
    .map(res => res.system!);
  // handle one chunk at a time to allow arbitrary length
  const rowCountToRead = CSV_CHUNK_SIZE;
  const defaultSelectedColumns = ['lat', 'long', 'track'];

  if (mittausCombinationLogic === 'GEOVIITE_RATAOSOITE_ROUNDED') {
    defaultSelectedColumns.push(
      'geoviite_konvertoitu_lat',
      'geoviite_konvertoitu_long',
    );
  }

  const outputStream = new PassThrough();
  outputStream.pause();

  const result = new Promise(async (resolve, reject) => {
    try {
      // TODO: multiple systems don't work currently
      // how to make them work?
      for (
        let systemIndex = 0;
        systemIndex < systemsInResults.length;
        systemIndex++
      ) {
        // get csv rows per system for faster queries
        const system = systemsInResults[systemIndex];
        // get list of raporttiIds to make queries faster
        const raporttiInSystem = raporttiRows.filter(
          raportti => `${raportti.system}` === system,
        );
        const raporttiIds = raporttiInSystem.map(raportti => raportti.id);
        const mittausCount = await client.mittaus.count({
          where: {
            raportti_id: {
              in: raporttiIds,
            },
          },
        });
        const partCount = Math.ceil(mittausCount / rowCountToRead);
        // read data from db, but handle it one rataosoite at a time

        for (
          let partIndexInSystem = 0;
          partIndexInSystem < partCount;
          partIndexInSystem++
        ) {
          const offset = partIndexInSystem * rowCountToRead;
          const mittausRows: MittausDbResult[] = await getPartialMittausRows(
            client,
            raporttiIds,
            system,
            offset,
            rowCountToRead,
            selectedColumns,
            mittaus,
            mittausCombinationLogic,
          );
          writeDbChunkToStream(
            mittausRows,
            selectedColumns.concat(defaultSelectedColumns),
            outputStream,
            systemIndex === 0 && partIndexInSystem === 0,
            raporttiInSystem,
            mittausCombinationLogic,
          );
        }
      }
      outputStream.end();
      resolve(true);
    } catch (err) {
      outputStream.end();
      log.error('Error in readDbToReadable');
      log.error(err);
      reject(err);
    }
  });

  // return stream immediately
  return {
    outputStream,
    result,
  };
};
