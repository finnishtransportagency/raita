import { Prisma } from '@prisma/client';
import { getPrismaClient } from '../../utils/prismaClient';
import { Resolvers } from '../__generated__/resolvers-types';
import { compareAsc } from 'date-fns';
import {
  getRaporttiWhereInput,
  getMittausFieldsPerSystem,
  getInputFieldDescriptions,
} from '../utils';

export const raporttiResolvers: Resolvers = {
  Query: {
    search_raportti: async (
      parent,
      { raportti: raporttiInput, page, page_size, order_by_variable },
      context,
    ) => {
      const client = await getPrismaClient();
      const orderBy: Prisma.raporttiOrderByWithRelationInput = {};
      if (
        order_by_variable === 'inspection_datetime' ||
        order_by_variable === 'km_start'
      ) {
        orderBy[order_by_variable] = 'asc';
      }
      const where = getRaporttiWhereInput(raporttiInput);
      const [sizeResult, raporttiResult] = await client.$transaction([
        client.raportti.aggregate({
          where,
          _count: {
            id: true,
          },
          _sum: {
            size: true,
          },
        }),
        client.raportti.findMany({
          orderBy,
          skip: (page - 1) * page_size,
          take: page_size,
          where,
        }),
      ]);
      return {
        raportti: raporttiResult,
        count: sizeResult._count.id,
        total_size: sizeResult._sum.size ? Number(sizeResult._sum.size) : NaN,
        page_size,
        page,
      };
    },
    search_raportti_by_key_prefix: async (parent, { key, page, page_size }) => {
      const client = await getPrismaClient();
      const [sizeResult, raporttiResult] = await client.$transaction([
        client.raportti.aggregate({
          where: {
            key: {
              startsWith: key,
            },
          },
          _count: {
            id: true,
          },
          _sum: {
            size: true,
          },
        }),
        client.raportti.findMany({
          where: {
            key: {
              startsWith: key,
            },
          },
          skip: (page - 1) * page_size,
          take: page_size,
        }),
      ]);
      return {
        raportti: raporttiResult,
        count: sizeResult._count.id,
        total_size: sizeResult._sum.size ? Number(sizeResult._sum.size) : NaN,
        page_size,
        page,
      };
    },
    meta: async () => {
      const client = await getPrismaClient();

      // TODO: aggregate all in one query or move them to separate resolvers so that only fields that are queried are fetched from database
      const reportTypes = (
        await client.raportti.groupBy({
          by: 'report_type',
          _count: true,
        })
      ).filter(row => row.report_type !== null);

      const fileTypes = (
        await client.raportti.groupBy({
          by: 'file_type',
          _count: true,
        })
      ).filter(row => row.file_type !== null);
      const systems = (
        await client.raportti.groupBy({
          by: 'system',
          _count: true,
        })
      ).filter(row => row.system !== null);
      const trackParts = (
        await client.raportti.groupBy({
          by: 'track_part',
          _count: true,
        })
      ).filter(row => row.track_part !== null);
      const tilirataosanumerot = (
        await client.raportti.groupBy({
          by: 'tilirataosanumero',
          _count: true,
        })
      ).filter(row => row.tilirataosanumero !== null);

      const latestInspection = await client.raportti.aggregate({
        _max: {
          inspection_date: true,
          inspection_datetime: true,
        },
      });
      const latestDate = latestInspection._max.inspection_date ?? new Date(0);
      const latestDateTime =
        latestInspection._max.inspection_datetime ?? new Date(0);
      const realLatest =
        compareAsc(latestDate, latestDateTime) === 1
          ? latestDate
          : latestDateTime;

      const mittausSystems = getMittausFieldsPerSystem();
      return {
        report_type: reportTypes.map(row => ({
          value: row.report_type!,
          count: row._count,
        })),
        file_type: fileTypes.map(row => ({
          value: row.file_type!,
          count: row._count,
        })),
        system: systems.map(row => ({
          value: row.system!,
          count: row._count,
        })),
        track_part: trackParts.map(row => ({
          value: row.track_part!,
          count: row._count,
        })),
        tilirataosanumero: tilirataosanumerot.map(row => ({
          value: row.tilirataosanumero!,
          count: row._count,
        })),
        latest_inspection: realLatest.toISOString(),
        mittaus_systems: mittausSystems,
        input_fields: getInputFieldDescriptions(),
      };
    },
  },
  Raportti: {
    // no need to define trivial fields here, only more "complex" transformations or type casting
    size: raportti => (raportti.size ? Number(raportti.size) : null),
    inspection_date: raportti =>
      raportti.inspection_date ? raportti.inspection_date.toISOString() : null,
    parsed_at_datetime: raportti =>
      raportti.parsed_at_datetime
        ? raportti.parsed_at_datetime.toISOString()
        : null,
    inspection_datetime: raportti =>
      raportti.inspection_datetime
        ? raportti.inspection_datetime.toISOString()
        : null,
    metadata_changed_at_datetime: raportti =>
      raportti.metadata_changed_at_datetime
        ? raportti.metadata_changed_at_datetime.toISOString()
        : null,
  },
};
