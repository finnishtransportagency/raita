import { Prisma } from '@prisma/client';
import { getPrismaClient } from '../../utils/prismaClient';
import { Resolvers } from '../__generated__/resolvers-types';
import { getRaporttiWhereInput } from './raportti';
import { RaitaLambdaError } from '../../lambdas/utils';

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
    generate_mittaus_csv: async (parent, { raportti, mittaus, columns }) => {
      raportti;
      // TODO: launch csv generation process here, new lambda?
      return {
        polling_url: 'not implemented',
      };
    },
  },
};
