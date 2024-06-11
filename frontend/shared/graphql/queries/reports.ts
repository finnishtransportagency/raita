import { gql } from '../__generated__';

export const SEARCH_RAPORTTI = gql(`
  query search_raportti(
    $file_name: String,
    $key: String,
    $file_type: [String!],
    $inspection_datetime: DateTimeIntervalInput,
    $system: [String!],
    $report_type: [String!],
    $track_part: [String!],
    $tilirataosanumero: [String!]
    $page: Int!,
    $page_size: Int!
    $order_by_variable: String
    ) {
    search_raportti(
      file_name: $file_name,
      key: $key,
      file_type: $file_type,
      inspection_datetime: $inspection_datetime,
      system: $system,
      report_type: $report_type,
      track_part: $track_part,
      tilirataosanumero: $tilirataosanumero,
      page: $page,
      page_size: $page_size,
      order_by_variable: $order_by_variable
      ) {
      raportti {
        id
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
      }
      count
      page
      page_size
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
    }
  }
`);
