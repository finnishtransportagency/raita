import { gql } from '../__generated__';

export const SEARCH_MITTAUS_COUNT = gql(`
  query search_mittaus_count(
    $raportti: RaporttiInput!,
    $raportti_keys: [String!]!,
    $mittaus: MittausInput!,
    $columns: [String!]!
    ) {
    search_mittaus_count(
      raportti: $raportti,
      raportti_keys: $raportti_keys,
      mittaus: $mittaus,
      columns: $columns,
      ) {
      status
      row_count
      size_estimate
    }
  }

`);

export const GENERATE_MITTAUS_CSV = gql(`
  mutation generate_mittaus_csv(
    $raportti: RaporttiInput!,
    $raportti_keys: [String!]!,
    $mittaus: MittausInput!,
    $columns: [String!]!
    ) {
    generate_mittaus_csv(
      raportti: $raportti,
      raportti_keys: $raportti_keys,
      mittaus: $mittaus,
      columns: $columns
      ) {
      polling_key
    }
  }
`);

export const SEARCH_CSV_RAPORTTI_DETAILS = gql(`
  query search_csv_raportti_details(
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
        file_name
        inspection_date
        inspection_datetime
      }
      count
      page
      page_size
    }
  }
`);

export const MITTAUS_META = gql(`
  query mittaus_meta {
    meta {
      report_type { value count }
      file_type { value count }
      system { value count }
      track_part { value count }
      tilirataosanumero { value count }
      mittaus_systems { name columns }
      latest_inspection
      input_fields { name type }
    }
  }
`);
