import { Prisma } from '@prisma/client';
import { getPrismaClient } from '../../utils/prismaClient';
import { Resolvers } from '../__generated__/resolvers-types';
import { RaitaLambdaError } from '../../lambdas/utils';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { CsvGenerationEvent } from '../../lambdas/raitaApi/csvGeneration/handleCsvGeneration';
import { getRaporttiWhereInput } from '../utils';

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
            }
          : getRaporttiWhereInput(raportti ?? {});
      // TODO: search with mittaus specific fields
      const countResult = await client.raportti.findMany({
        where: raporttiWhere,
        select: {
          _count: {
            select: {
              mittaus: true,
            },
          },
        },
      });
      const rowCount = countResult.reduce(
        // TODO: can this sum be calculated in query?
        (sum, row) => sum + row._count.mittaus,
        0,
      );
      return {
        row_count: rowCount,
        size_estimate: getSizeEstimate(rowCount, columns),
      };
    },
  },
  Mutation: {
    generate_mittaus_csv: async (parent, params, context) => {
      const { csvGenerationLambda, region } = context;
      if (!csvGenerationLambda || !region) {
        throw new Error('Missing env vars');
      }

      // TODO: file name
      const fileBaseName = `test-${Date.now()}`;
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
