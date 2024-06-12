/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 */
const documents = {
    "\n  query search_mittaus_count(\n    $raportti: RaporttiInput!,\n    $raportti_keys: [String!]!,\n    $mittaus: MittausInput!,\n    $columns: [String!]!\n    ) {\n    search_mittaus_count(\n      raportti: $raportti,\n      raportti_keys: $raportti_keys,\n      mittaus: $mittaus,\n      columns: $columns,\n      ) {\n      row_count\n      size_estimate\n    }\n  }\n\n": types.Search_Mittaus_CountDocument,
    "\n  mutation generate_mittaus_csv(\n    $raportti: RaporttiInput!,\n    $raportti_keys: [String!]!,\n    $mittaus: MittausInput!,\n    $columns: [String!]!\n    ) {\n    generate_mittaus_csv(\n      raportti: $raportti,\n      raportti_keys: $raportti_keys,\n      mittaus: $mittaus,\n      columns: $columns\n      ) {\n      polling_url\n    }\n  }\n": types.Generate_Mittaus_CsvDocument,
    "\n  query search_csv_raportti_details(\n    $raportti: RaporttiInput!,\n    $page: Int!,\n    $page_size: Int!\n    ) {\n    search_raportti(\n      raportti: $raportti,\n      page: $page,\n      page_size: $page_size,\n      ) {\n      raportti {\n        key\n        file_name\n        inspection_date\n        inspection_datetime\n      }\n      count\n      page\n      page_size\n    }\n  }\n": types.Search_Csv_Raportti_DetailsDocument,
    "\n  query mittaus_meta {\n    meta {\n      report_type { value count }\n      file_type { value count }\n      system { value count }\n      track_part { value count }\n      tilirataosanumero { value count }\n      mittaus_systems { name columns }\n      latest_inspection\n    }\n  }\n": types.Mittaus_MetaDocument,
    "\n  query search_raportti(\n    $raportti: RaporttiInput!,\n    $page: Int!,\n    $page_size: Int!\n    $order_by_variable: String\n    ) {\n    search_raportti(\n      raportti: $raportti,\n      page: $page,\n      page_size: $page_size,\n      order_by_variable: $order_by_variable\n      ) {\n      raportti {\n        file_name\n        key\n        file_type\n        source_system\n        zip_name\n        campaign\n        track_number\n        track_part\n        track_id\n        km_start\n        km_end\n        system\n        nonparsed_inspection_datetime\n        report_category\n        parser_version\n        size\n        zip_reception__year\n        zip_reception__date\n        year\n        extra_information\n        maintenance_area\n        is_empty\n        length\n        tilirataosanumero\n        report_type\n        temperature\n        measurement_start_location\n        measurement_end_location\n        measurement_direction\n        maintenance_level\n        status\n        inspection_date\n        parsed_at_datetime\n        inspection_datetime\n        metadata_changed_at_datetime\n      }\n      count\n      page\n      page_size\n    }\n  }\n": types.Search_RaporttiDocument,
    "\n  query meta {\n    meta {\n      report_type { value count }\n      file_type { value count }\n      system { value count }\n      track_part { value count }\n      tilirataosanumero { value count }\n      latest_inspection\n    }\n  }\n": types.MetaDocument,
};

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function gql(source: string): unknown;

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query search_mittaus_count(\n    $raportti: RaporttiInput!,\n    $raportti_keys: [String!]!,\n    $mittaus: MittausInput!,\n    $columns: [String!]!\n    ) {\n    search_mittaus_count(\n      raportti: $raportti,\n      raportti_keys: $raportti_keys,\n      mittaus: $mittaus,\n      columns: $columns,\n      ) {\n      row_count\n      size_estimate\n    }\n  }\n\n"): (typeof documents)["\n  query search_mittaus_count(\n    $raportti: RaporttiInput!,\n    $raportti_keys: [String!]!,\n    $mittaus: MittausInput!,\n    $columns: [String!]!\n    ) {\n    search_mittaus_count(\n      raportti: $raportti,\n      raportti_keys: $raportti_keys,\n      mittaus: $mittaus,\n      columns: $columns,\n      ) {\n      row_count\n      size_estimate\n    }\n  }\n\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation generate_mittaus_csv(\n    $raportti: RaporttiInput!,\n    $raportti_keys: [String!]!,\n    $mittaus: MittausInput!,\n    $columns: [String!]!\n    ) {\n    generate_mittaus_csv(\n      raportti: $raportti,\n      raportti_keys: $raportti_keys,\n      mittaus: $mittaus,\n      columns: $columns\n      ) {\n      polling_url\n    }\n  }\n"): (typeof documents)["\n  mutation generate_mittaus_csv(\n    $raportti: RaporttiInput!,\n    $raportti_keys: [String!]!,\n    $mittaus: MittausInput!,\n    $columns: [String!]!\n    ) {\n    generate_mittaus_csv(\n      raportti: $raportti,\n      raportti_keys: $raportti_keys,\n      mittaus: $mittaus,\n      columns: $columns\n      ) {\n      polling_url\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query search_csv_raportti_details(\n    $raportti: RaporttiInput!,\n    $page: Int!,\n    $page_size: Int!\n    ) {\n    search_raportti(\n      raportti: $raportti,\n      page: $page,\n      page_size: $page_size,\n      ) {\n      raportti {\n        key\n        file_name\n        inspection_date\n        inspection_datetime\n      }\n      count\n      page\n      page_size\n    }\n  }\n"): (typeof documents)["\n  query search_csv_raportti_details(\n    $raportti: RaporttiInput!,\n    $page: Int!,\n    $page_size: Int!\n    ) {\n    search_raportti(\n      raportti: $raportti,\n      page: $page,\n      page_size: $page_size,\n      ) {\n      raportti {\n        key\n        file_name\n        inspection_date\n        inspection_datetime\n      }\n      count\n      page\n      page_size\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query mittaus_meta {\n    meta {\n      report_type { value count }\n      file_type { value count }\n      system { value count }\n      track_part { value count }\n      tilirataosanumero { value count }\n      mittaus_systems { name columns }\n      latest_inspection\n    }\n  }\n"): (typeof documents)["\n  query mittaus_meta {\n    meta {\n      report_type { value count }\n      file_type { value count }\n      system { value count }\n      track_part { value count }\n      tilirataosanumero { value count }\n      mittaus_systems { name columns }\n      latest_inspection\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query search_raportti(\n    $raportti: RaporttiInput!,\n    $page: Int!,\n    $page_size: Int!\n    $order_by_variable: String\n    ) {\n    search_raportti(\n      raportti: $raportti,\n      page: $page,\n      page_size: $page_size,\n      order_by_variable: $order_by_variable\n      ) {\n      raportti {\n        file_name\n        key\n        file_type\n        source_system\n        zip_name\n        campaign\n        track_number\n        track_part\n        track_id\n        km_start\n        km_end\n        system\n        nonparsed_inspection_datetime\n        report_category\n        parser_version\n        size\n        zip_reception__year\n        zip_reception__date\n        year\n        extra_information\n        maintenance_area\n        is_empty\n        length\n        tilirataosanumero\n        report_type\n        temperature\n        measurement_start_location\n        measurement_end_location\n        measurement_direction\n        maintenance_level\n        status\n        inspection_date\n        parsed_at_datetime\n        inspection_datetime\n        metadata_changed_at_datetime\n      }\n      count\n      page\n      page_size\n    }\n  }\n"): (typeof documents)["\n  query search_raportti(\n    $raportti: RaporttiInput!,\n    $page: Int!,\n    $page_size: Int!\n    $order_by_variable: String\n    ) {\n    search_raportti(\n      raportti: $raportti,\n      page: $page,\n      page_size: $page_size,\n      order_by_variable: $order_by_variable\n      ) {\n      raportti {\n        file_name\n        key\n        file_type\n        source_system\n        zip_name\n        campaign\n        track_number\n        track_part\n        track_id\n        km_start\n        km_end\n        system\n        nonparsed_inspection_datetime\n        report_category\n        parser_version\n        size\n        zip_reception__year\n        zip_reception__date\n        year\n        extra_information\n        maintenance_area\n        is_empty\n        length\n        tilirataosanumero\n        report_type\n        temperature\n        measurement_start_location\n        measurement_end_location\n        measurement_direction\n        maintenance_level\n        status\n        inspection_date\n        parsed_at_datetime\n        inspection_datetime\n        metadata_changed_at_datetime\n      }\n      count\n      page\n      page_size\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query meta {\n    meta {\n      report_type { value count }\n      file_type { value count }\n      system { value count }\n      track_part { value count }\n      tilirataosanumero { value count }\n      latest_inspection\n    }\n  }\n"): (typeof documents)["\n  query meta {\n    meta {\n      report_type { value count }\n      file_type { value count }\n      system { value count }\n      track_part { value count }\n      tilirataosanumero { value count }\n      latest_inspection\n    }\n  }\n"];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;