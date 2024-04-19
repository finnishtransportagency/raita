import { getPrismaClient } from '../../utils/prismaClient';
import { Resolvers } from '../__generated__/resolvers-types';

export const raporttiResolvers: Resolvers = {
  Query: {
    hello: () => 'world',
    search_raportti: async (parent, { file_name }) => {
      const client = await getPrismaClient();
      return client.raportti.findMany({
        where: {
          file_name: {
            contains: file_name ?? '',
          },
        },
      });
    },
  },
};
