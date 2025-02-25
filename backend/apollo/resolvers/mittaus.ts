import { Prisma } from '@prisma/client';
import { getPrismaClient } from '../../utils/prismaClient';
import { Resolvers } from '../__generated__/resolvers-types';
import { RaitaLambdaError } from '../../lambdas/utils';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { getRaporttiWhereInput } from '../utils';
import { CSV_GENERATION_MAX_RAPORTTI_ROW_COUNT } from '../../../constants';
import { CsvGenerationEvent } from '../../lambdas/raitaApi/fileGeneration/types';
import { format } from 'date-fns';

/**
 * Return estimate of result file size in bytes
 * TODO implement properly
 */
const getSizeEstimate = (rowCount: number, columns: string[]) => {
  const averageRowSize = 300;

  return rowCount * averageRowSize;
};

export const mittausResolvers: Resolvers = {
  Query: {
    search_mittaus_count: async (
      parent,
      { raportti, raportti_keys, mittaus, columns },
    ) => {
      if (!raportti && !raportti_keys) {
        throw new RaitaLambdaError('raportti or raportti_keys required', 400);
      }
      const client = await getPrismaClient();
      const raporttiWhere: Prisma.raporttiWhereInput =
        raportti_keys && raportti_keys.length
          ? {
              key: {
                in: raportti_keys,
              },
              deleted: false,
            }
          : getRaporttiWhereInput(raportti ?? {});
      // TODO: search with mittaus specific fields
      const raporttiCount = await client.raportti.count({
        where: raporttiWhere,
      });
      const limit = CSV_GENERATION_MAX_RAPORTTI_ROW_COUNT;
      if (raporttiCount > limit) {
        return {
          status: 'size_limit',
          row_count: raporttiCount,
          size_estimate: null,
        };
      }
      // mittaus table is BIG, make query faster by explicitly searching with raportti_id
      const raporttiRows = await client.raportti.findMany({
        where: raporttiWhere,
        select: {
          id: true,
        },
      });

      const mittausCount = await client.mittaus.count({
        where: {
          raportti_id: {
            // TODO: search with mittaus specific fields
            in: raporttiRows.map(raportti => raportti.id),
          },

          ...((mittaus.rata_kilometri?.start !== undefined ||
            mittaus.rata_kilometri?.end !== undefined) && {
            rata_kilometri: {
              ...(mittaus.rata_kilometri?.start !== undefined && {
                gte: mittaus.rata_kilometri.start,
              }),
              ...(mittaus.rata_kilometri?.end !== undefined && {
                lte: mittaus.rata_kilometri.end,
              }),
            },
          }),
        },
      });
      return {
        status: 'ok',
        row_count: mittausCount,
        size_estimate: getSizeEstimate(mittausCount, columns),
      };
    },
  },
  Mutation: {
    generate_mittaus_csv: async (parent, params, context) => {
      const { csvGenerationLambda, region } = context;
      if (!csvGenerationLambda || !region) {
        throw new Error('Missing env vars');
      }
      const now = new Date();
      // TODO: file name
      const fileBaseName = `RAITA-export-${format(now, 'dd.MM.yyyy-HH-mm')}`;
      const progressKey = `csv/progress/${fileBaseName}.json`;
      const csvKey = `csv/data/${fileBaseName}.csv`;
      const event: CsvGenerationEvent = {
        searchParameters: params,
        progressKey,
        csvKey,
      };
      const payloadJson = JSON.stringify(event);
      const payload = new TextEncoder().encode(payloadJson);

      const lambdaClient = new LambdaClient({ region });

      const command = new InvokeCommand({
        FunctionName: csvGenerationLambda,
        Payload: payload,
        InvocationType: 'Event',
      });
      await lambdaClient.send(command);

      return {
        polling_key: progressKey,
      };
    },
  },
};
