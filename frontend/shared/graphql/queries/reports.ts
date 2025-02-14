import { gql } from '../__generated__';

export const SEARCH_RAPORTTI = gql(`
  query search_raportti(
    $raportti: RaporttiInput!,
    $page: Int!,
    $page_size: Int!
    $order_by_variable: String
    ) {
    search_raportti(
      raportti: $raportti,
      page: $page,
      page_size: $page_size,
      order_by_variable: $order_by_variable
      ) {
      raportti {
        file_name
        key
        file_type
        source_system
        zip_name
        campaign
        track_number
        track_part
        track_id
        km_start
        km_end
        system
        nonparsed_inspection_datetime
        report_category
        parser_version
        size
        zip_reception__year
        zip_reception__date
        year
        extra_information
        maintenance_area
        is_empty
        length
        tilirataosanumero
        report_type
        temperature
        measurement_start_location
        measurement_end_location
        measurement_direction
        maintenance_level
        status
        inspection_date
        parsed_at_datetime
        inspection_datetime
        metadata_changed_at_datetime
        data_location
      }
      count
      total_size
      page
      page_size
    }
  }
`);

export const SEARCH_RAPORTTI_BY_KEY_PREFIX = gql(`
  query search_raportti_by_key_prefix(
    $key: String!,
    $page: Int!,
    $page_size: Int!
    ) {
    search_raportti_by_key_prefix(
      key: $key,
      page: $page,
      page_size: $page_size,
      ) {
      raportti {
        key
        zip_name
      }
      count
      total_size
    }
  }
`);

export const SEARCH_RAPORTTI_KEYS_ONLY = gql(`
  query search_raportti_keys_only(
    $raportti: RaporttiInput!,
    $page: Int!,
    $page_size: Int!
    ) {
    search_raportti(
      raportti: $raportti,
      page: $page,
      page_size: $page_size,
      ) {
      raportti {
        key
      }
      count
      total_size
    }
  }
`);

export const META = gql(`
  query meta {
    meta {
      report_type { value count }
      file_type { value count }
      system { value count }
      track_part { value count }
      tilirataosanumero { value count }
      latest_inspection
      input_fields { name type }
    }
  }
`);
