import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  GetObjectCommand,
  S3Client,
  UploadPartCommand,
  UploadPartCommandOutput,
} from '@aws-sdk/client-s3';
import { getGetEnvWithPreassignedContext } from '../../../../utils';
import { log } from '../../../utils/logger';
import { lambdaRequestTracker } from 'pino-lambda';
import { Context } from 'aws-lambda';
import { MutationGenerate_Mittaus_CsvArgs } from '../../../apollo/__generated__/resolvers-types';
import { getPrismaClient } from '../../../utils/prismaClient';
import {
  Prisma,
  PrismaClient,
  ams_mittaus,
  jarjestelma,
  mittaus,
  ohl_mittaus,
  pi_mittaus,
  rc_mittaus,
  rp_mittaus,
  tg_mittaus,
  tsight_mittaus,
} from '@prisma/client';
import { ProgressStatus, uploadProgressData } from '../handleZipRequest/utils';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { formatDate, objectToCsvBody, objectToCsvHeader } from './utils';
import {
  getMittausFieldsPerSystem,
  getRaporttiWhereInput,
} from '../../../apollo/utils';
import { CSV_GENERATION_MAX_RAPORTTI_ROW_COUNT } from '../../../../constants';
import { PassThrough, Readable } from 'stream';

const withRequest = lambdaRequestTracker();

const CSV_CHUNK_SIZE = 50000;

const wait = (time: number) =>
  new Promise(resolve => {
    setTimeout(() => resolve(true), time);
  });

function getLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext('handleZipProcessing');
  return {
    targetBucket: getEnv('TARGET_BUCKET'),
  };
}

export type CsvGenerationEvent = {
  searchParameters: MutationGenerate_Mittaus_CsvArgs;
  progressKey: string;
  csvKey: string;
};

type MittausDbResult =
  | Partial<ams_mittaus>
  | Partial<ohl_mittaus>
  | Partial<pi_mittaus>
  | Partial<rc_mittaus>
  | Partial<rp_mittaus>
  | Partial<tg_mittaus>
  | Partial<tsight_mittaus>;

type AnyMittausTableWhereInput =
  | Prisma.ams_mittausFindManyArgs
  | Prisma.ohl_mittausFindManyArgs
  | Prisma.pi_mittausFindManyArgs
  | Prisma.rc_mittausFindManyArgs
  | Prisma.rp_mittausFindManyArgs
  | Prisma.tg_mittausFindManyArgs
  | Prisma.tsight_mittausFindManyArgs;

type CsvRow = {
  [column: string]: string | number | null;
};

type MultipartUploadResultWithPartNumber = {
  uploadPartCommandOutput: UploadPartCommandOutput;
  partNumber: number;
};

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
      {
        status: ProgressStatus.FAILED,
        progressPercentage: 0,
        url: undefined,
      },
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

  const { raportti, raportti_keys, mittaus, columns } = params;

  const selectedColumns = columns;

  const progressKey = event.progressKey;
  const csvKey = event.csvKey;
  await uploadProgressData(
    {
      status: ProgressStatus.PENDING,
      progressPercentage: 0,
    },
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
        }
      : getRaporttiWhereInput(raportti ?? {});

  // use a readable stream to read data from db and write to s3
  // this is because the desired data chunk sizes when reading from db and writing to s3 are different
  const csvStream: Readable = await readDbToReadable(
    raporttiWhere,
    selectedColumns,
  );

  const uploadResult = await uploadReadableToS3(
    csvStream,
    targetBucket,
    csvKey,
    s3Client,
  );
  if (!uploadResult) {
    throw new Error('S3 upload: uploadResult failed');
  }

  const downloadCommand = new GetObjectCommand({
    Bucket: targetBucket,
    Key: csvKey,
  });
  const downloadUrl = await getSignedUrl(s3Client, downloadCommand, {
    expiresIn: 3600,
  });

  await uploadProgressData(
    {
      status: ProgressStatus.SUCCESS,
      progressPercentage: 100,
      url: downloadUrl,
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
) => {
  const systemSpecificColumnSelections = getColumnsSelectInputForSystem(
    system,
    selectedColumns,
  );
  const params: AnyMittausTableWhereInput = {
    where: {
      raportti_id: {
        in: raporttiIds,
      },
    },
    orderBy: [
      {
        raportti_id: 'asc',
      },
      {
        sscount: 'asc',
      },
    ],

    select: {
      sscount: false,
      running_date: true,
      track: true,
      jarjestelma: false,
      location: true,
      latitude: true,
      longitude: true,
      ajonopeus: false,
      ...systemSpecificColumnSelections,
    },
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

const mapMittausRowsToCsvRows = (mittausRows: MittausDbResult[]) => {
  return mittausRows.map(mittaus => {
    let systemMittaus: { [column: string]: any } = mittaus;
    const { location, latitude, longitude, track, running_date } = mittaus;

    const filledColumns = Object.assign(systemMittaus);
    const formatted_latitude = latitude?.replace(/[^\d.-]/g, '');
    const formatted_longitude = longitude?.replace(/[^\d.-]/g, '');
    const formatted_running_date = formatDate(running_date!);

    // map fields to string or number
    const newRow = {
      // TODO: determine which metadata are to be included in csv
      // file_name: result.file_name,
      // inspection_date: result.inspection_date?.toISOString(),
      // system: result.system,
      // track_part: result.track_part,
      ...filledColumns,
      track,
      location,
      latitude: formatted_latitude,
      longitude: formatted_longitude,
      running_date: formatted_running_date,
    };
    return newRow;
  });
};

const getEmptyCsvRowObject = (systems: string[]) => {
  const allColumnsPerSystem = getMittausFieldsPerSystem();
  const allSystemSpecificColumnsInCsv = systems.flatMap(system => {
    return allColumnsPerSystem
      .filter(desc => desc.name === system)
      .flatMap(desc => desc.columns);
  });
  // this includes columns from all systems in the query, to preserve field order between systems
  const emptySystemSpecificColumns: CsvRow = {};
  allSystemSpecificColumnsInCsv.forEach(
    column => (emptySystemSpecificColumns[column] = null),
  );
  return emptySystemSpecificColumns;
};

/**
 * Get Readable stream that will eventually contain all csv data, fetched from dn
 */
const readDbToReadable = async (
  raporttiWhere: Prisma.raporttiWhereInput,
  selectedColumns: string[],
): Promise<Readable> => {
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

  const systemsInResults: string[] = systemsResult
    .filter(res => !!res.system)
    .map(res => res.system!);
  const emptyCsvRow = getEmptyCsvRowObject(systemsInResults);

  // handle one chunk at a time to allow arbitrary length
  const rowCountToRead = CSV_CHUNK_SIZE;

  const csvStream = new PassThrough();
  csvStream.pause();
  new Promise(async resolve => {
    for (
      let systemIndex = 0;
      systemIndex < systemsInResults.length;
      systemIndex++
    ) {
      // get csv rows per system for faster queries
      const system = systemsInResults[systemIndex];
      // get list of raporttiIds to make queries faster
      const raporttiRows = await client.raportti.findMany({
        where: { ...raporttiWhere, system: { equals: system as jarjestelma } },
        select: {
          id: true,
        },
      });
      const raporttiIds = raporttiRows.map(raportti => raportti.id);
      const mittausCount = await client.mittaus.count({
        where: {
          raportti_id: {
            in: raporttiIds,
          },
        },
      });
      const partCount = Math.ceil(mittausCount / rowCountToRead);
      for (
        let partIndexInSystem = 0;
        partIndexInSystem < partCount;
        partIndexInSystem++
      ) {
        const offset = partIndexInSystem * rowCountToRead;
        const mittausRows = await getPartialMittausRows(
          client,
          raporttiIds,
          system,
          offset,
          rowCountToRead,
          selectedColumns,
        );

        // map to csv format
        const mittausMappedRows = mapMittausRowsToCsvRows(mittausRows);
        const firstChunk = systemIndex === 0 && partIndexInSystem === 0;
        const body = firstChunk
          ? objectToCsvHeader(mittausMappedRows[0]) +
            objectToCsvBody(mittausMappedRows)
          : objectToCsvBody(mittausMappedRows);

        csvStream.write(body, 'utf8');
      }
    }
    csvStream.end();
    resolve(true);
  });
  // return stream immediately
  return csvStream;
};

const uploadReadableToS3 = async (
  stream: Readable,
  targetBucket: string,
  csvKey: string,
  s3Client: S3Client,
) => {
  const partPromises: Promise<MultipartUploadResultWithPartNumber>[] = [];
  let partNumber = 1; // this should only be modified from one read function call at a time

  const chunkSize = 10 << 20; // 10 MB
  let multipartUploadId: string | undefined = undefined;
  let streamEnded = false;

  let reading = false;

  /**
   * Handle read and upload
   */
  const read = async () => {
    while (true) {
      const firstChunk = partNumber === 1;
      const data = stream.read(chunkSize);
      if (data === null) {
        if (streamEnded) {
          log.info('Stream end');
          break;
        }
        log.info('Data null but stream not over');
        await wait(10);
        continue;
      }
      if (firstChunk) {
        const multipartUpload = await s3Client.send(
          new CreateMultipartUploadCommand({
            Bucket: targetBucket,
            Key: csvKey,
          }),
        );
        multipartUploadId = multipartUpload.UploadId;
      }
      const uploadCommand = new UploadPartCommand({
        Bucket: targetBucket,
        Key: csvKey,
        PartNumber: partNumber,
        UploadId: multipartUploadId,
        Body: data,
      });
      // TODO update upload progress percentage? is it useful?
      const res = s3Client.send(uploadCommand);
      const resultWithNumber: MultipartUploadResultWithPartNumber = {
        uploadPartCommandOutput: await res,
        partNumber,
      };
      partNumber += 1;
      partPromises.push(Promise.resolve(resultWithNumber));
    }
    const partResults = await Promise.all(partPromises);
    return await s3Client.send(
      new CompleteMultipartUploadCommand({
        Bucket: targetBucket,
        Key: csvKey,
        UploadId: multipartUploadId,
        MultipartUpload: {
          Parts: partResults.map((res, i) => ({
            ETag: res.uploadPartCommandOutput.ETag,
            PartNumber: res.partNumber,
          })),
        },
      }),
    );
  };

  stream.on('end', async () => {
    // tell read function loop that stream is over
    // TODO: this seems a bit fragile
    streamEnded = true;
  });
  return new Promise((resolve, reject) => {
    stream.on('readable', async () => {
      // there can be multiple readable events, but the easiest way is to have read loop running continuously until env event
      log.info('readable');
      if (!reading) {
        reading = true;
        await read();
        resolve(true);
      }
    });
  });
};
