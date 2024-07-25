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
import { objectToCsvBody, objectToCsvHeader } from './utils';
import {
  getMittausFieldsPerSystem,
  getRaporttiWhereInput,
} from '../../../apollo/utils';
import { CSV_GENERATION_MAX_RAPORTTI_ROW_COUNT } from '../../../../constants';

const withRequest = lambdaRequestTracker();

const CSV_CHUNK_SIZE = 50000;

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

// type MittausDbResult = Partial<mittaus> & {
//   ams_mittaus: Partial<ams_mittaus> | null;
//   ohl_mittaus: Partial<ohl_mittaus> | null;
//   pi_mittaus: Partial<pi_mittaus> | null;
//   rc_mittaus: Partial<rc_mittaus> | null;
//   rp_mittaus: Partial<rp_mittaus> | null;
//   tg_mittaus: Partial<tg_mittaus> | null;
//   tsight_mittaus: Partial<tsight_mittaus> | null;
// };
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
    log.error({ error }, 'Error at top level');
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

  const client = await getPrismaClient();

  const raporttiWhere: Prisma.raporttiWhereInput =
    raportti_keys && raportti_keys.length
      ? {
          key: {
            in: raportti_keys,
          },
        }
      : getRaporttiWhereInput(raportti ?? {});
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
  const pageSize = CSV_CHUNK_SIZE;
  let multipartUploadId: string | undefined;

  const systemPromises = systemsInResults.map(async (system, systemIndex) => {
    // get list of raporttiIds to make queries simpler and hopefully more optimized
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
    const partCount = Math.ceil(mittausCount / pageSize);
    const parts = Array(partCount).fill(null);
    const partPromises = parts.map(async (_, partIndex) => {
      const offset = partIndex * pageSize;
      const mittausRows = await getPartialMittausRows(
        client,
        raporttiIds,
        system,
        offset,
        pageSize,
        selectedColumns,
      );

      // map to csv format
      const mittausMappedRows = mapMittausRowsToCsvRows(
        mittausRows,
        emptyCsvRow,
      );

      const firstChunk = partIndex === 0;
      let fileBody: string;
      if (firstChunk) {
        const multipartUpload = await s3Client.send(
          new CreateMultipartUploadCommand({
            Bucket: targetBucket,
            Key: csvKey,
          }),
        );
        multipartUploadId = multipartUpload.UploadId;
        fileBody =
          objectToCsvHeader(mittausMappedRows[0]) +
          objectToCsvBody(mittausMappedRows);
      } else {
        fileBody = objectToCsvBody(mittausMappedRows);
      }
      const partNumber = systemIndex * 100 + partIndex + 1; // TODO: quick hack, DO NOT MERGE need to calculate partnumber that is consistend accross systems. Precalculate size for each system first?
      const uploadCommand = new UploadPartCommand({
        Bucket: targetBucket,
        Key: csvKey,
        PartNumber: partNumber,
        UploadId: multipartUploadId,
        Body: fileBody,
      });
      // TODO update upload progress percentage? is it useful?
      const res = s3Client.send(uploadCommand);
      const resultWithNumber: MultipartUploadResultWithPartNumber = {
        uploadPartCommandOutput: await res,
        partNumber,
      };
      return resultWithNumber;
    });
    return Promise.all(partPromises);
  });
  const partResults = (await Promise.all(systemPromises)).flat();
  await s3Client.send(
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
      sscount: true,
      running_date: true,
      track: true,
      jarjestelma: true,
      location: true,
      latitude: true,
      longitude: true,
      ajonopeus: true,
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

const mapMittausRowsToCsvRows = (
  mittausRows: MittausDbResult[],
  emptyCsvRow: CsvRow,
) => {
  return mittausRows.map(mittaus => {
    let systemMittaus: { [column: string]: any } = mittaus;
    // if (mittaus.jarjestelma === 'AMS' && mittaus.ams_mittaus) {
    //   systemMittaus = mittaus.ams_mittaus;
    // }
    // if (mittaus.jarjestelma === 'OHL' && mittaus.ohl_mittaus) {
    //   systemMittaus = mittaus.ohl_mittaus;
    // }
    // if (mittaus.jarjestelma === 'PI' && mittaus.pi_mittaus) {
    //   systemMittaus = mittaus.pi_mittaus;
    // }
    // if (mittaus.jarjestelma === 'RC' && mittaus.rc_mittaus) {
    //   systemMittaus = mittaus.rc_mittaus;
    // }
    // if (mittaus.jarjestelma === 'RP' && mittaus.rp_mittaus) {
    //   systemMittaus = mittaus.rp_mittaus;
    // }
    // if (mittaus.jarjestelma === 'TG' && mittaus.tg_mittaus) {
    //   systemMittaus = mittaus.tg_mittaus;
    // }
    // if (mittaus.jarjestelma === 'TSIGHT' && mittaus.tsight_mittaus) {
    //   systemMittaus = mittaus.tsight_mittaus;
    // }
    const { ajonopeus, location, latitude, longitude, sscount, track } =
      mittaus;
    const emptyColumns = Object.assign({}, emptyCsvRow);
    const filledColumns = Object.assign(emptyColumns, systemMittaus);

    // map fields to string or number
    const newRow = {
      // file_name: result.file_name,
      // inspection_date: result.inspection_date?.toISOString(),
      // system: result.system,
      // track_part: result.track_part,
      track,
      location,
      latitude,
      longitude,
      sscount,
      ajonopeus: Number(ajonopeus),
      ...filledColumns,
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
