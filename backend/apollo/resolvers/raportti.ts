import { Prisma, jarjestelma } from '@prisma/client';
import { getPrismaClient } from '../../utils/prismaClient';
import { Resolvers } from '../__generated__/resolvers-types';
import { compareAsc } from 'date-fns';

export const raporttiResolvers: Resolvers = {
  Query: {
    search_raportti: async (
      parent,
      {
        file_name,
        key,
        inspection_datetime,
        system,
        report_type,
        track_part,
        tilirataosanumero,
        file_type,
        page,
        page_size,
        order_by_variable,
      },
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

      const where: Prisma.raporttiWhereInput = {};
      if (file_name) {
        where.file_name = {
          contains: file_name,
        };
      }
      if (key) {
        where.key = {
          contains: key,
        };
      }
      if (inspection_datetime) {
        // check both inspection time timestamps
        where.OR = [
          {
            inspection_datetime: {
              gte: inspection_datetime?.start ?? undefined,
              lte: inspection_datetime?.end ?? undefined,
            },
          },
          {
            inspection_date: {
              gte: inspection_datetime?.start ?? undefined,
              lte: inspection_datetime?.end ?? undefined,
            },
          },
        ];
      }
      if (system && system.length) {
        where.system = {
          in: system.map(s => s as jarjestelma),
        };
      }
      if (report_type && report_type.length) {
        where.report_type = {
          in: report_type,
        };
      }
      if (track_part && track_part.length) {
        where.track_part = {
          in: track_part,
        };
      }
      if (tilirataosanumero && tilirataosanumero.length) {
        where.tilirataosanumero = {
          in: tilirataosanumero,
        };
      }
      if (file_type && file_type.length) {
        where.file_type = {
          in: file_type,
        };
      }
      const [count, raportti] = await client.$transaction([
        client.raportti.count({
          where,
        }),
        client.raportti.findMany({
          orderBy,
          skip: (page - 1) * page_size,
          take: page_size,
          where,
        }),
      ]);
      return {
        raportti,
        count,
        page_size,
        page,
      };
    },
    meta: async () => {
      const client = await getPrismaClient();

      // TODO: aggregate all in one query?
      const reportTypes = await client.raportti.groupBy({
        by: 'report_type',
        _count: true,
      });
      const fileTypes = await client.raportti.groupBy({
        by: 'file_type',
        _count: true,
      });
      const systems = await client.raportti.groupBy({
        by: 'system',
        _count: true,
      });
      const trackParts = await client.raportti.groupBy({
        by: 'track_part',
        _count: true,
      });
      const tilirataosanumerot = await client.raportti.groupBy({
        by: 'tilirataosanumero',
        _count: true,
      });

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
      return {
        // filter out non nulls
        report_type: reportTypes
          .filter(row => !!row.report_type)
          .map(row => ({
            value: row.report_type,
            count: row._count,
          })),
        file_type: fileTypes
          .filter(row => !!row.file_type)
          .map(row => ({
            value: row.file_type,
            count: row._count,
          })),
        system: systems
          .filter(row => !!row.system)
          .map(row => ({
            value: row.system,
            count: row._count,
          })),
        track_part: trackParts
          .filter(row => !!row.track_part)
          .map(row => ({
            value: row.track_part,
            count: row._count,
          })),
        tilirataosanumero: tilirataosanumerot
          .filter(row => !!row.tilirataosanumero)
          .map(row => ({
            value: row.tilirataosanumero,
            count: row._count,
          })),
        latest_inspection: realLatest.toISOString(),
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
