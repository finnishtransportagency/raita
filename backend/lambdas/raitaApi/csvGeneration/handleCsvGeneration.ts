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
import { MutationGenerate_Mittaus_CsvArgs } from '../../../apollo/__generated__/resolvers-types';
import { getPrismaClient } from '../../../utils/prismaClient';
import { Prisma } from '@prisma/client';
import { ProgressStatus, uploadProgressData } from '../handleZipRequest/utils';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { objectToCsvBody, objectToCsvHeader } from './utils';
import {
  getMittausFieldsPerSystem,
  getRaporttiWhereInput,
} from '../../../apollo/utils';

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
  // TODO: mittaus filter

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

  const allColumnsPerSystem = getMittausFieldsPerSystem();
  const countResult = await client.raportti.count({
    where: raporttiWhere,
  });

  // handle one chunk at a time to allow arbitrary length
  const pageSize = CSV_CHUNK_SIZE;
  const partPromises = [];
  const partCount = Math.ceil(countResult / pageSize);
  let multipartUploadId: string | undefined;

  for (let partIndex = 0; partIndex < partCount; partIndex++) {
    const offset = partIndex * pageSize;
    const raporttiRows = await client.raportti.findMany({
      where: raporttiWhere,
      select: {
        file_name: true,
        inspection_date: true,
        system: true,
        track_part: true,
        tilirataosanumero: true,
        mittaus: {
          orderBy: {
            sscount: 'asc',
          },
          select: {
            sscount: true,
            track: true,
            location: true,
            latitude: true,
            longitude: true,
            ajonopeus: true,
            ams_mittaus: systemsInResults.includes('AMS')
              ? {
                  select: getColumnsSelectInputForSystem('AMS', columns),
                }
              : false,
            ohl_mittaus: systemsInResults.includes('OHL')
              ? {
                  select: getColumnsSelectInputForSystem('OHL', columns),
                }
              : false,
            pi_mittaus: systemsInResults.includes('PI')
              ? {
                  select: getColumnsSelectInputForSystem('PI', columns),
                }
              : false,
            rc_mittaus: systemsInResults.includes('RC')
              ? {
                  select: getColumnsSelectInputForSystem('RC', columns),
                }
              : false,
            rp_mittaus: systemsInResults.includes('RP')
              ? {
                  select: getColumnsSelectInputForSystem('RP', columns),
                }
              : false,
            tg_mittaus: systemsInResults.includes('TG')
              ? {
                  select: getColumnsSelectInputForSystem('TG', columns),
                }
              : false,
            tsight_mittaus: systemsInResults.includes('TSIGHT')
              ? {
                  select: getColumnsSelectInputForSystem('TSIGHT', columns),
                }
              : false,
          },
        },
      },
      skip: offset,
      take: pageSize,
    });

    log.info({ mittaus: raporttiRows[0].mittaus[0] });

    const allSystemSpecificColumnsInCsv = systemsInResults.flatMap(system => {
      return allColumnsPerSystem
        .filter(desc => desc.name === system)
        .flatMap(desc => desc.columns);
    });

    // this includes columns from all systems in the query, to preserve field order between systems
    const emptySystemSpecificColumns: { [column: string]: any } = {};
    allSystemSpecificColumnsInCsv.forEach(
      column => (emptySystemSpecificColumns[column] = null),
    );

    // map to csv format
    const mittausRows = raporttiRows.flatMap(result => {
      let mittaus = result.mittaus;
      const newMittausRows = mittaus.map(mittausRow => {
        let systemMittaus: { [column: string]: any } = mittausRow;
        if (result.system === 'AMS' && mittausRow.ams_mittaus) {
          systemMittaus = mittausRow.ams_mittaus;
        }
        if (result.system === 'OHL' && mittausRow.ohl_mittaus) {
          systemMittaus = mittausRow.ohl_mittaus;
        }
        if (result.system === 'PI' && mittausRow.pi_mittaus) {
          systemMittaus = mittausRow.pi_mittaus;
        }
        if (result.system === 'RC' && mittausRow.rc_mittaus) {
          systemMittaus = mittausRow.rc_mittaus;
        }
        if (result.system === 'RP' && mittausRow.rp_mittaus) {
          systemMittaus = mittausRow.rp_mittaus;
        }
        if (result.system === 'TG' && mittausRow.tg_mittaus) {
          systemMittaus = mittausRow.tg_mittaus;
        }
        if (result.system === 'TSIGHT' && mittausRow.tsight_mittaus) {
          systemMittaus = mittausRow.tsight_mittaus;
        }
        const { ajonopeus, location, latitude, longitude, sscount, track } =
          mittausRow;
        const emptyColumns = Object.assign({}, emptySystemSpecificColumns);
        const filledColumns = Object.assign(emptyColumns, systemMittaus);

        // map fields to string or number
        const newRow = {
          file_name: result.file_name,
          inspection_date: result.inspection_date?.toISOString(),
          system: result.system,
          track_part: result.track_part,
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
      return newMittausRows;
    });

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
        objectToCsvHeader(mittausRows[0]) + objectToCsvBody(mittausRows);
    } else {
      fileBody = objectToCsvBody(mittausRows);
    }
    const uploadCommand = new UploadPartCommand({
      Bucket: targetBucket,
      Key: csvKey,
      PartNumber: partIndex + 1,
      UploadId: multipartUploadId,
      Body: fileBody,
    });
    // TODO update upload progress percentage? is it useful?
    partPromises.push(s3Client.send(uploadCommand));
  }

  const partResults = await Promise.all(partPromises);

  await s3Client.send(
    new CompleteMultipartUploadCommand({
      Bucket: targetBucket,
      Key: csvKey,
      UploadId: multipartUploadId,
      MultipartUpload: {
        Parts: partResults.map((res, i) => ({
          ETag: res.ETag,
          PartNumber: i + 1,
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
