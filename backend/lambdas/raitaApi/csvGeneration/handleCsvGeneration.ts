import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  GetObjectCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { getGetEnvWithPreassignedContext } from '../../../../utils';
import { log } from '../../../utils/logger';
import { lambdaRequestTracker } from 'pino-lambda';
import { Context } from 'aws-lambda';
import { getPrismaClient } from '../../../utils/prismaClient';
import { Prisma, PrismaClient, jarjestelma } from '@prisma/client';
import { ProgressStatus, uploadProgressData } from '../handleZipRequest/utils';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  objectToCsvBody,
  objectToCsvHeader,
  mapMittausRowsToCsvRow,
} from './utils';
import {
  getMittausFieldsPerSystem,
  getRaporttiWhereInput,
} from '../../../apollo/utils';
import { CSV_GENERATION_MAX_RAPORTTI_ROW_COUNT } from '../../../../constants';
import { PassThrough, Readable } from 'stream';
import {
  AnyMittausTableWhereInput,
  CsvGenerationEvent,
  CsvRow,
  MittausDbResult,
  MultipartUploadResultWithPartNumber,
} from './types';

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
): Promise<MittausDbResult[]> => {
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
        rata_kilometri: 'asc',
      },
      {
        rata_metrit: 'asc',
      },
      // {
      //   track: 'asc',
      // },
    ],
    select: {
      raportti_id: true,
      rata_kilometri: true,
      rata_metrit: true,
      lat: true,
      long: true,
      running_date: true,
      track: true,
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

// const getEmptyCsvRowObject = (systems: string[]) => {
//   const allColumnsPerSystem = getMittausFieldsPerSystem();
//   const allSystemSpecificColumnsInCsv = systems.flatMap(system => {
//     return allColumnsPerSystem
//       .filter(desc => desc.name === system)
//       .flatMap(desc => desc.columns);
//   });
//   // this includes columns from all systems in the query, to preserve field order between systems
//   const emptySystemSpecificColumns: CsvRow = {};
//   allSystemSpecificColumnsInCsv.forEach(
//     column => (emptySystemSpecificColumns[column] = ''),
//   );
//   return emptySystemSpecificColumns;
// };

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

  const outputStream = new PassThrough();
  outputStream.pause();

  new Promise(async resolve => {
    // TODO: can this be written without so many mutable vars?
    let writeHeader = true;
    for (
      let systemIndex = 0;
      systemIndex < systemsInResults.length;
      systemIndex++
    ) {
      // TODO: multiple systems don't work
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
      log.info({
        partCount,
        mittausCount,
        raporttiIds,
      });
      // read data from db, but handle it one rataosoite at a time
      // these vars are read from inner loop, but data from last iteration will carry on to next db read
      // hold rows of same rataosoite to be converted to one csv row
      let mittausBuffer: MittausDbResult[] = [];
      let previousRataosoite = '';

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
        );

        for (
          let mittausRowIndex = 0;
          mittausRowIndex < mittausRows.length;
          mittausRowIndex++
        ) {
          const mittaus = mittausRows[mittausRowIndex];
          const rataosoite = `${mittaus.rata_kilometri}-${mittaus.rata_metrit}`;
          // trust that array is sorted by rataosoite, only check if it changes
          if (rataosoite === previousRataosoite) {
            mittausBuffer.push(mittaus);
          } else {
            previousRataosoite = rataosoite;
            if (mittausBuffer.length === 0) {
              // first row
              continue;
            }
            // rataosoite changed, convert current chunk to one row
            // TODO type not array of rows?
            const row: CsvRow = mapMittausRowsToCsvRow(
              mittausBuffer,
              raporttiInSystem,
              selectedColumns.concat(defaultSelectedColumns),
            );
            if (writeHeader) {
              outputStream.write(objectToCsvHeader(row), 'utf8');
              writeHeader = false;
            }
            outputStream.write(objectToCsvBody([row]), 'utf8');
            mittausBuffer = [mittaus];
          }
        }
        // at this point mittausBuffer still contains data to write but it is not known if next data will have same rataosoite, unless there is no more data
        if (partIndexInSystem === partCount - 1) {
          // last data (from this system?)
          const row: CsvRow = mapMittausRowsToCsvRow(
            mittausBuffer,
            raporttiInSystem,
            selectedColumns.concat(defaultSelectedColumns),
          );
          outputStream.write(objectToCsvBody([row]), 'utf8');
          mittausBuffer = [];
          previousRataosoite = '';
        }
      }
    }
    outputStream.end();
    resolve(true);
  });
  // return stream immediately
  return outputStream;
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
