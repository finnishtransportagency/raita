import { Prisma, jarjestelma } from '@prisma/client';
import { getPrismaClient } from '../../utils/prismaClient';
import { RaporttiInput, Resolvers } from '../__generated__/resolvers-types';
import { compareAsc } from 'date-fns';

export const getRaporttiWhereInput = (
  raportti: RaporttiInput,
): Prisma.raporttiWhereInput => {
  const where: Prisma.raporttiWhereInput = {};
  const {
    file_name,
    key,
    inspection_datetime,
    system,
    report_type,
    track_part,
    tilirataosanumero,
    file_type,
    campaign,
    extra_information,
    is_empty,
    km_start,
    km_end,
    length,
    maintenance_area,
    maintenance_level,
    measurement_start_location,
    measurement_end_location,
    measurement_direction,
    metadata_changed_at_datetime,
    parsed_at_datetime,
    parser_version,
    report_category,
    source_system,
    temperature,
    track_number,
    track_id,
    year,
    zip_name,
  } = raportti;
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
  if (campaign) {
    where.campaign = {
      contains: campaign,
    };
  }
  if (extra_information) {
    where.extra_information = {
      contains: extra_information,
    };
  }
  if (is_empty !== undefined) {
    where.is_empty = {
      equals: is_empty,
    };
  }
  if (km_start) {
    where.km_start = {
      gte: km_start?.start ?? undefined,
      lte: km_start?.end ?? undefined,
    };
  }
  if (km_end) {
    where.km_end = {
      gte: km_end?.start ?? undefined,
      lte: km_end?.end ?? undefined,
    };
  }
  if (length) {
    where.length = {
      gte: length?.start ?? undefined,
      lte: length?.end ?? undefined,
    };
  }
  if (maintenance_area) {
    where.maintenance_area = {
      contains: maintenance_area,
    };
  }
  if (maintenance_level) {
    where.maintenance_level = {
      contains: maintenance_level,
    };
  }
  if (measurement_start_location) {
    where.measurement_start_location = {
      contains: measurement_start_location,
    };
  }
  if (measurement_end_location) {
    where.measurement_end_location = {
      contains: measurement_end_location,
    };
  }
  if (measurement_direction) {
    where.measurement_direction = {
      contains: measurement_direction,
    };
  }
  if (metadata_changed_at_datetime) {
    where.metadata_changed_at_datetime = {
      gte: metadata_changed_at_datetime?.start ?? undefined,
      lte: metadata_changed_at_datetime?.end ?? undefined,
    };
  }
  if (parsed_at_datetime) {
    where.parsed_at_datetime = {
      gte: parsed_at_datetime?.start ?? undefined,
      lte: parsed_at_datetime?.end ?? undefined,
    };
  }
  if (parser_version) {
    where.parser_version = {
      contains: parser_version,
    };
  }
  if (report_category) {
    where.report_category = {
      contains: report_category,
    };
  }
  if (source_system) {
    where.source_system = {
      contains: source_system,
    };
  }
  if (temperature) {
    where.temperature = {
      gte: temperature?.start ?? undefined,
      lte: temperature?.end ?? undefined,
    };
  }
  if (track_number) {
    where.track_number = {
      contains: track_number,
    };
  }
  if (track_id) {
    where.track_id = {
      contains: track_id,
    };
  }
  if (year) {
    where.year = {
      equals: year,
    };
  }
  if (zip_name) {
    where.zip_name = {
      contains: zip_name,
    };
  }
  return where;
};

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
      const [count, raporttiResult] = await client.$transaction([
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
        raportti: raporttiResult,
        count,
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

      // get lists of columns that are unique for each subtype of mittaus
      // bit of a hack here: get names of columns by inspecting the inner data representation of generated prisma library
      // TODO: is there a better way to do this that is not hardcoding field names?
      const getFields = (tableName: string) =>
        Prisma.dmmf.datamodel.models
          .find(model => model.name === tableName)
          ?.fields.map(field => field.name) ?? [];

      const commonFields = getFields('mittaus');
      const mittausSystems = [
        {
          name: 'AMS',
          columns: getFields('ams_mittaus').filter(
            field => !commonFields.includes(field),
          ),
        },
        {
          name: 'OHL',
          columns: getFields('ohl_mittaus').filter(
            field => !commonFields.includes(field),
          ),
        },
        {
          name: 'PI',
          columns: getFields('pi_mittaus').filter(
            field => !commonFields.includes(field),
          ),
        },
        {
          name: 'RC',
          columns: getFields('rc_mittaus').filter(
            field => !commonFields.includes(field),
          ),
        },
        {
          name: 'RP',
          columns: getFields('rp_mittaus').filter(
            field => !commonFields.includes(field),
          ),
        },
        {
          name: 'TG',
          columns: getFields('tg_mittaus').filter(
            field => !commonFields.includes(field),
          ),
        },
        {
          name: 'TSIGHT',
          columns: getFields('tsight_mittaus').filter(
            field => !commonFields.includes(field),
          ),
        },
      ];
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
