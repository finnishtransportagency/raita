import { Prisma, jarjestelma } from '@prisma/client';
import { RaporttiInput } from './__generated__/resolvers-types';

/**
 * Get input for prisma where query froom RaporttiInput graphql input object
 */
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
    deleted,
    deleted_at,
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
  // always search either deleted or not deleted default = not deleted
  where.deleted = {
    equals: !!deleted,
  };
  // deleted_at only makes sense if deleted = true, but no validation here done for that
  if (deleted_at) {
    where.deleted_at = {
      gte: deleted_at?.start ?? undefined,
      lte: deleted_at?.end ?? undefined,
    };
  }
  return where;
};

type SystemColumnsDescription = {
  name: string;
  columns: string[];
};

const getFields = (tableName: string) =>
  Prisma.dmmf.datamodel.models
    .find(model => model.name === tableName)
    ?.fields.map(field => field.name) ?? [];

/**
 * Get lists of columns that are unique for each subtype of mittaus
 */
export const getMittausFieldsPerSystem: () => SystemColumnsDescription[] =
  () => {
    // bit of a hack here: get names of columns by inspecting the inner data representation of generated prisma library
    // TODO: is there a better way to do this that is not hardcoding field names?
    const commonFields = getFields('mittaus');
    const filterOut = [
      // filter out some "duplicate" fields
      'mittaus',
      'ams_ajonopeus',
      'ohl_ajonopeus',
      'rp_ajonopeus',
    ];
    const allExcludedFields = commonFields.concat(filterOut);
    const mittausSystems = [
      {
        name: 'AMS',
        columns: getFields('ams_mittaus').filter(
          field => !allExcludedFields.includes(field),
        ),
      },
      {
        name: 'OHL',
        columns: getFields('ohl_mittaus').filter(
          field => !allExcludedFields.includes(field),
        ),
      },
      {
        name: 'PI',
        columns: getFields('pi_mittaus').filter(
          field => !allExcludedFields.includes(field),
        ),
      },
      {
        name: 'RC',
        columns: getFields('rc_mittaus').filter(
          field => !allExcludedFields.includes(field),
        ),
      },
      {
        name: 'RP',
        columns: getFields('rp_mittaus').filter(
          field => !allExcludedFields.includes(field),
        ),
      },
      {
        name: 'TG',
        columns: getFields('tg_mittaus').filter(
          field => !allExcludedFields.includes(field),
        ),
      },
      {
        name: 'TSIGHT',
        columns: getFields('tsight_mittaus').filter(
          field => !allExcludedFields.includes(field),
        ),
      },
    ];
    return mittausSystems;
  };

/**
 * Description and input types of fields for frontend
 */
export const getInputFieldDescriptions: () => {
  name: string;
  type: string;
}[] = () => {
  return [
    { name: 'file_name', type: 'String' },
    { name: 'key', type: 'String' },
    { name: 'inspection_datetime', type: 'DateTimeIntervalInput' },
    { name: 'system', type: '[String]' },
    { name: 'report_type', type: '[String]' },
    { name: 'track_part', type: '[String]' },
    { name: 'tilirataosanumero', type: '[String]' },
    { name: 'file_type', type: '[String]' },
    { name: 'campaign', type: 'String' },
    { name: 'extra_information', type: 'String' },
    { name: 'is_empty', type: 'Boolean' },
    { name: 'km_start', type: 'IntIntervalInput' },
    { name: 'km_end', type: 'IntIntervalInput' },
    { name: 'length', type: 'IntIntervalInput' },
    { name: 'maintenance_area', type: 'String' },
    { name: 'maintenance_level', type: 'String' },
    { name: 'measurement_start_location', type: 'String' },
    { name: 'measurement_end_location', type: 'String' },
    { name: 'measurement_direction', type: 'String' },
    { name: 'metadata_changed_at_datetime', type: 'DateTimeIntervalInput' },
    { name: 'parsed_at_datetime', type: 'DateTimeIntervalInput' },
    { name: 'parser_version', type: 'String' },
    { name: 'report_category', type: 'String' },
    { name: 'source_system', type: 'String' },
    { name: 'temperature', type: 'FloatIntervalInput' },
    { name: 'track_number', type: 'String' },
    { name: 'track_id', type: 'String' },
    { name: 'year', type: 'Int' },
    { name: 'zip_name', type: 'String' },
  ];
};
