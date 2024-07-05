/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type DateTimeIntervalInput = {
  end?: InputMaybe<Scalars['String']['input']>;
  start?: InputMaybe<Scalars['String']['input']>;
};

export type FieldAggregation = {
  __typename?: 'FieldAggregation';
  count: Scalars['Int']['output'];
  value: Scalars['String']['output'];
};

export type FloatIntervalInput = {
  end?: InputMaybe<Scalars['Float']['input']>;
  start?: InputMaybe<Scalars['Float']['input']>;
};

export type InputFieldDescription = {
  __typename?: 'InputFieldDescription';
  name: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type IntIntervalInput = {
  end?: InputMaybe<Scalars['Int']['input']>;
  start?: InputMaybe<Scalars['Int']['input']>;
};

export type MetaResponse = {
  __typename?: 'MetaResponse';
  file_type: Array<FieldAggregation>;
  input_fields: Array<InputFieldDescription>;
  latest_inspection: Scalars['String']['output'];
  mittaus_systems: Array<MittausSystemDescription>;
  report_type: Array<FieldAggregation>;
  system: Array<FieldAggregation>;
  tilirataosanumero: Array<FieldAggregation>;
  track_part: Array<FieldAggregation>;
};

export type Mittaus = {
  __typename?: 'Mittaus';
  Id: Scalars['Int']['output'];
  ajonopeus?: Maybe<Scalars['Float']['output']>;
  jarjestelma?: Maybe<Scalars['String']['output']>;
  lat?: Maybe<Scalars['Float']['output']>;
  latitude?: Maybe<Scalars['String']['output']>;
  location?: Maybe<Scalars['String']['output']>;
  long?: Maybe<Scalars['Float']['output']>;
  longitude?: Maybe<Scalars['String']['output']>;
  raide_numero?: Maybe<Scalars['String']['output']>;
  raportti_id: Scalars['Int']['output'];
  rata_kilometri?: Maybe<Scalars['Int']['output']>;
  rata_metrit?: Maybe<Scalars['Float']['output']>;
  rataosuus_nimi?: Maybe<Scalars['String']['output']>;
  rataosuus_numero?: Maybe<Scalars['String']['output']>;
  running_date: Scalars['String']['output'];
  sscount?: Maybe<Scalars['Int']['output']>;
  track?: Maybe<Scalars['String']['output']>;
};

export type MittausCountResponse = {
  __typename?: 'MittausCountResponse';
  row_count: Scalars['Int']['output'];
  size_estimate: Scalars['Float']['output'];
};

export type MittausGenerateResponse = {
  __typename?: 'MittausGenerateResponse';
  polling_key: Scalars['String']['output'];
};

export type MittausInput = {
  rata_kilometri?: InputMaybe<Scalars['Int']['input']>;
  rata_metrit?: InputMaybe<Scalars['Float']['input']>;
};

export type MittausSystemDescription = {
  __typename?: 'MittausSystemDescription';
  columns: Array<Scalars['String']['output']>;
  name: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  generate_mittaus_csv: MittausGenerateResponse;
};


export type MutationGenerate_Mittaus_CsvArgs = {
  columns: Array<Scalars['String']['input']>;
  mittaus: MittausInput;
  raportti?: InputMaybe<RaporttiInput>;
  raportti_keys?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type Query = {
  __typename?: 'Query';
  meta: MetaResponse;
  search_mittaus_count: MittausCountResponse;
  search_raportti: SearchRaporttiResponse;
  search_raportti_by_key_prefix: SearchRaporttiResponse;
};


export type QuerySearch_Mittaus_CountArgs = {
  columns: Array<Scalars['String']['input']>;
  mittaus: MittausInput;
  raportti?: InputMaybe<RaporttiInput>;
  raportti_keys?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type QuerySearch_RaporttiArgs = {
  order_by_variable?: InputMaybe<Scalars['String']['input']>;
  page: Scalars['Int']['input'];
  page_size: Scalars['Int']['input'];
  raportti: RaporttiInput;
};


export type QuerySearch_Raportti_By_Key_PrefixArgs = {
  key: Scalars['String']['input'];
  page: Scalars['Int']['input'];
  page_size: Scalars['Int']['input'];
};

export type Raportti = {
  __typename?: 'Raportti';
  campaign?: Maybe<Scalars['String']['output']>;
  extra_information?: Maybe<Scalars['String']['output']>;
  file_name?: Maybe<Scalars['String']['output']>;
  file_type?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  inspection_date?: Maybe<Scalars['String']['output']>;
  inspection_datetime?: Maybe<Scalars['String']['output']>;
  is_empty?: Maybe<Scalars['Boolean']['output']>;
  key?: Maybe<Scalars['String']['output']>;
  km_end?: Maybe<Scalars['Int']['output']>;
  km_start?: Maybe<Scalars['Int']['output']>;
  length?: Maybe<Scalars['Int']['output']>;
  maintenance_area?: Maybe<Scalars['String']['output']>;
  maintenance_level?: Maybe<Scalars['String']['output']>;
  measurement_direction?: Maybe<Scalars['String']['output']>;
  measurement_end_location?: Maybe<Scalars['String']['output']>;
  measurement_start_location?: Maybe<Scalars['String']['output']>;
  metadata_changed_at_datetime?: Maybe<Scalars['String']['output']>;
  nonparsed_inspection_datetime?: Maybe<Scalars['String']['output']>;
  parsed_at_datetime?: Maybe<Scalars['String']['output']>;
  parser_version?: Maybe<Scalars['String']['output']>;
  report_category?: Maybe<Scalars['String']['output']>;
  report_type?: Maybe<Scalars['String']['output']>;
  size?: Maybe<Scalars['Float']['output']>;
  source_system?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  system?: Maybe<Scalars['String']['output']>;
  temperature?: Maybe<Scalars['Float']['output']>;
  tilirataosanumero?: Maybe<Scalars['String']['output']>;
  track_id?: Maybe<Scalars['String']['output']>;
  track_number?: Maybe<Scalars['String']['output']>;
  track_part?: Maybe<Scalars['String']['output']>;
  year?: Maybe<Scalars['Int']['output']>;
  zip_name?: Maybe<Scalars['String']['output']>;
  zip_reception__date?: Maybe<Scalars['String']['output']>;
  zip_reception__year?: Maybe<Scalars['String']['output']>;
};

export type RaporttiInput = {
  campaign?: InputMaybe<Scalars['String']['input']>;
  extra_information?: InputMaybe<Scalars['String']['input']>;
  file_name?: InputMaybe<Scalars['String']['input']>;
  file_type?: InputMaybe<Array<Scalars['String']['input']>>;
  inspection_datetime?: InputMaybe<DateTimeIntervalInput>;
  is_empty?: InputMaybe<Scalars['Boolean']['input']>;
  key?: InputMaybe<Scalars['String']['input']>;
  km_end?: InputMaybe<IntIntervalInput>;
  km_start?: InputMaybe<IntIntervalInput>;
  length?: InputMaybe<IntIntervalInput>;
  maintenance_area?: InputMaybe<Scalars['String']['input']>;
  maintenance_level?: InputMaybe<Scalars['String']['input']>;
  measurement_direction?: InputMaybe<Scalars['String']['input']>;
  measurement_end_location?: InputMaybe<Scalars['String']['input']>;
  measurement_start_location?: InputMaybe<Scalars['String']['input']>;
  metadata_changed_at_datetime?: InputMaybe<DateTimeIntervalInput>;
  parsed_at_datetime?: InputMaybe<DateTimeIntervalInput>;
  parser_version?: InputMaybe<Scalars['String']['input']>;
  report_category?: InputMaybe<Scalars['String']['input']>;
  report_type?: InputMaybe<Array<Scalars['String']['input']>>;
  source_system?: InputMaybe<Scalars['String']['input']>;
  system?: InputMaybe<Array<Scalars['String']['input']>>;
  temperature?: InputMaybe<FloatIntervalInput>;
  tilirataosanumero?: InputMaybe<Array<Scalars['String']['input']>>;
  track_id?: InputMaybe<Scalars['String']['input']>;
  track_number?: InputMaybe<Scalars['String']['input']>;
  track_part?: InputMaybe<Array<Scalars['String']['input']>>;
  year?: InputMaybe<Scalars['Int']['input']>;
  zip_name?: InputMaybe<Scalars['String']['input']>;
};

export type SearchRaporttiResponse = {
  __typename?: 'SearchRaporttiResponse';
  count: Scalars['Int']['output'];
  page: Scalars['Int']['output'];
  page_size: Scalars['Int']['output'];
  raportti?: Maybe<Array<Raportti>>;
  total_size: Scalars['Float']['output'];
};

export type Search_Mittaus_CountQueryVariables = Exact<{
  raportti: RaporttiInput;
  raportti_keys: Array<Scalars['String']['input']> | Scalars['String']['input'];
  mittaus: MittausInput;
  columns: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type Search_Mittaus_CountQuery = { __typename?: 'Query', search_mittaus_count: { __typename?: 'MittausCountResponse', row_count: number, size_estimate: number } };

export type Generate_Mittaus_CsvMutationVariables = Exact<{
  raportti: RaporttiInput;
  raportti_keys: Array<Scalars['String']['input']> | Scalars['String']['input'];
  mittaus: MittausInput;
  columns: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type Generate_Mittaus_CsvMutation = { __typename?: 'Mutation', generate_mittaus_csv: { __typename?: 'MittausGenerateResponse', polling_key: string } };

export type Search_Csv_Raportti_DetailsQueryVariables = Exact<{
  raportti: RaporttiInput;
  page: Scalars['Int']['input'];
  page_size: Scalars['Int']['input'];
}>;


export type Search_Csv_Raportti_DetailsQuery = { __typename?: 'Query', search_raportti: { __typename?: 'SearchRaporttiResponse', count: number, page: number, page_size: number, raportti?: Array<{ __typename?: 'Raportti', key?: string | null, file_name?: string | null, inspection_date?: string | null, inspection_datetime?: string | null }> | null } };

export type Mittaus_MetaQueryVariables = Exact<{ [key: string]: never; }>;


export type Mittaus_MetaQuery = { __typename?: 'Query', meta: { __typename?: 'MetaResponse', latest_inspection: string, report_type: Array<{ __typename?: 'FieldAggregation', value: string, count: number }>, file_type: Array<{ __typename?: 'FieldAggregation', value: string, count: number }>, system: Array<{ __typename?: 'FieldAggregation', value: string, count: number }>, track_part: Array<{ __typename?: 'FieldAggregation', value: string, count: number }>, tilirataosanumero: Array<{ __typename?: 'FieldAggregation', value: string, count: number }>, mittaus_systems: Array<{ __typename?: 'MittausSystemDescription', name: string, columns: Array<string> }> } };

export type Search_RaporttiQueryVariables = Exact<{
  raportti: RaporttiInput;
  page: Scalars['Int']['input'];
  page_size: Scalars['Int']['input'];
  order_by_variable?: InputMaybe<Scalars['String']['input']>;
}>;


export type Search_RaporttiQuery = { __typename?: 'Query', search_raportti: { __typename?: 'SearchRaporttiResponse', count: number, total_size: number, page: number, page_size: number, raportti?: Array<{ __typename?: 'Raportti', file_name?: string | null, key?: string | null, file_type?: string | null, source_system?: string | null, zip_name?: string | null, campaign?: string | null, track_number?: string | null, track_part?: string | null, track_id?: string | null, km_start?: number | null, km_end?: number | null, system?: string | null, nonparsed_inspection_datetime?: string | null, report_category?: string | null, parser_version?: string | null, size?: number | null, zip_reception__year?: string | null, zip_reception__date?: string | null, year?: number | null, extra_information?: string | null, maintenance_area?: string | null, is_empty?: boolean | null, length?: number | null, tilirataosanumero?: string | null, report_type?: string | null, temperature?: number | null, measurement_start_location?: string | null, measurement_end_location?: string | null, measurement_direction?: string | null, maintenance_level?: string | null, status?: string | null, inspection_date?: string | null, parsed_at_datetime?: string | null, inspection_datetime?: string | null, metadata_changed_at_datetime?: string | null }> | null } };

export type Search_Raportti_By_Key_PrefixQueryVariables = Exact<{
  key: Scalars['String']['input'];
  page: Scalars['Int']['input'];
  page_size: Scalars['Int']['input'];
}>;


export type Search_Raportti_By_Key_PrefixQuery = { __typename?: 'Query', search_raportti_by_key_prefix: { __typename?: 'SearchRaporttiResponse', count: number, total_size: number, raportti?: Array<{ __typename?: 'Raportti', key?: string | null }> | null } };

export type Search_Raportti_Keys_OnlyQueryVariables = Exact<{
  raportti: RaporttiInput;
  page: Scalars['Int']['input'];
  page_size: Scalars['Int']['input'];
}>;


export type Search_Raportti_Keys_OnlyQuery = { __typename?: 'Query', search_raportti: { __typename?: 'SearchRaporttiResponse', count: number, total_size: number, raportti?: Array<{ __typename?: 'Raportti', key?: string | null }> | null } };

export type MetaQueryVariables = Exact<{ [key: string]: never; }>;


export type MetaQuery = { __typename?: 'Query', meta: { __typename?: 'MetaResponse', latest_inspection: string, report_type: Array<{ __typename?: 'FieldAggregation', value: string, count: number }>, file_type: Array<{ __typename?: 'FieldAggregation', value: string, count: number }>, system: Array<{ __typename?: 'FieldAggregation', value: string, count: number }>, track_part: Array<{ __typename?: 'FieldAggregation', value: string, count: number }>, tilirataosanumero: Array<{ __typename?: 'FieldAggregation', value: string, count: number }>, input_fields: Array<{ __typename?: 'InputFieldDescription', name: string, type: string }> } };


export const Search_Mittaus_CountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"search_mittaus_count"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"raportti"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RaporttiInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"raportti_keys"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mittaus"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MittausInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"columns"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"search_mittaus_count"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"raportti"},"value":{"kind":"Variable","name":{"kind":"Name","value":"raportti"}}},{"kind":"Argument","name":{"kind":"Name","value":"raportti_keys"},"value":{"kind":"Variable","name":{"kind":"Name","value":"raportti_keys"}}},{"kind":"Argument","name":{"kind":"Name","value":"mittaus"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mittaus"}}},{"kind":"Argument","name":{"kind":"Name","value":"columns"},"value":{"kind":"Variable","name":{"kind":"Name","value":"columns"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"row_count"}},{"kind":"Field","name":{"kind":"Name","value":"size_estimate"}}]}}]}}]} as unknown as DocumentNode<Search_Mittaus_CountQuery, Search_Mittaus_CountQueryVariables>;
export const Generate_Mittaus_CsvDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"generate_mittaus_csv"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"raportti"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RaporttiInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"raportti_keys"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mittaus"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MittausInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"columns"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generate_mittaus_csv"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"raportti"},"value":{"kind":"Variable","name":{"kind":"Name","value":"raportti"}}},{"kind":"Argument","name":{"kind":"Name","value":"raportti_keys"},"value":{"kind":"Variable","name":{"kind":"Name","value":"raportti_keys"}}},{"kind":"Argument","name":{"kind":"Name","value":"mittaus"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mittaus"}}},{"kind":"Argument","name":{"kind":"Name","value":"columns"},"value":{"kind":"Variable","name":{"kind":"Name","value":"columns"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"polling_key"}}]}}]}}]} as unknown as DocumentNode<Generate_Mittaus_CsvMutation, Generate_Mittaus_CsvMutationVariables>;
export const Search_Csv_Raportti_DetailsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"search_csv_raportti_details"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"raportti"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RaporttiInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page_size"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"search_raportti"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"raportti"},"value":{"kind":"Variable","name":{"kind":"Name","value":"raportti"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"page_size"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page_size"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"raportti"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"file_name"}},{"kind":"Field","name":{"kind":"Name","value":"inspection_date"}},{"kind":"Field","name":{"kind":"Name","value":"inspection_datetime"}}]}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"page_size"}}]}}]}}]} as unknown as DocumentNode<Search_Csv_Raportti_DetailsQuery, Search_Csv_Raportti_DetailsQueryVariables>;
export const Mittaus_MetaDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"mittaus_meta"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meta"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"report_type"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}},{"kind":"Field","name":{"kind":"Name","value":"file_type"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}},{"kind":"Field","name":{"kind":"Name","value":"system"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}},{"kind":"Field","name":{"kind":"Name","value":"track_part"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tilirataosanumero"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}},{"kind":"Field","name":{"kind":"Name","value":"mittaus_systems"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"columns"}}]}},{"kind":"Field","name":{"kind":"Name","value":"latest_inspection"}}]}}]}}]} as unknown as DocumentNode<Mittaus_MetaQuery, Mittaus_MetaQueryVariables>;
export const Search_RaporttiDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"search_raportti"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"raportti"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RaporttiInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page_size"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"order_by_variable"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"search_raportti"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"raportti"},"value":{"kind":"Variable","name":{"kind":"Name","value":"raportti"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"page_size"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page_size"}}},{"kind":"Argument","name":{"kind":"Name","value":"order_by_variable"},"value":{"kind":"Variable","name":{"kind":"Name","value":"order_by_variable"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"raportti"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"file_name"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"file_type"}},{"kind":"Field","name":{"kind":"Name","value":"source_system"}},{"kind":"Field","name":{"kind":"Name","value":"zip_name"}},{"kind":"Field","name":{"kind":"Name","value":"campaign"}},{"kind":"Field","name":{"kind":"Name","value":"track_number"}},{"kind":"Field","name":{"kind":"Name","value":"track_part"}},{"kind":"Field","name":{"kind":"Name","value":"track_id"}},{"kind":"Field","name":{"kind":"Name","value":"km_start"}},{"kind":"Field","name":{"kind":"Name","value":"km_end"}},{"kind":"Field","name":{"kind":"Name","value":"system"}},{"kind":"Field","name":{"kind":"Name","value":"nonparsed_inspection_datetime"}},{"kind":"Field","name":{"kind":"Name","value":"report_category"}},{"kind":"Field","name":{"kind":"Name","value":"parser_version"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"zip_reception__year"}},{"kind":"Field","name":{"kind":"Name","value":"zip_reception__date"}},{"kind":"Field","name":{"kind":"Name","value":"year"}},{"kind":"Field","name":{"kind":"Name","value":"extra_information"}},{"kind":"Field","name":{"kind":"Name","value":"maintenance_area"}},{"kind":"Field","name":{"kind":"Name","value":"is_empty"}},{"kind":"Field","name":{"kind":"Name","value":"length"}},{"kind":"Field","name":{"kind":"Name","value":"tilirataosanumero"}},{"kind":"Field","name":{"kind":"Name","value":"report_type"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"measurement_start_location"}},{"kind":"Field","name":{"kind":"Name","value":"measurement_end_location"}},{"kind":"Field","name":{"kind":"Name","value":"measurement_direction"}},{"kind":"Field","name":{"kind":"Name","value":"maintenance_level"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"inspection_date"}},{"kind":"Field","name":{"kind":"Name","value":"parsed_at_datetime"}},{"kind":"Field","name":{"kind":"Name","value":"inspection_datetime"}},{"kind":"Field","name":{"kind":"Name","value":"metadata_changed_at_datetime"}}]}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"total_size"}},{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"page_size"}}]}}]}}]} as unknown as DocumentNode<Search_RaporttiQuery, Search_RaporttiQueryVariables>;
export const Search_Raportti_By_Key_PrefixDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"search_raportti_by_key_prefix"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"key"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page_size"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"search_raportti_by_key_prefix"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"key"},"value":{"kind":"Variable","name":{"kind":"Name","value":"key"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"page_size"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page_size"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"raportti"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}}]}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"total_size"}}]}}]}}]} as unknown as DocumentNode<Search_Raportti_By_Key_PrefixQuery, Search_Raportti_By_Key_PrefixQueryVariables>;
export const Search_Raportti_Keys_OnlyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"search_raportti_keys_only"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"raportti"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RaporttiInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page_size"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"search_raportti"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"raportti"},"value":{"kind":"Variable","name":{"kind":"Name","value":"raportti"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"page_size"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page_size"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"raportti"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}}]}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"total_size"}}]}}]}}]} as unknown as DocumentNode<Search_Raportti_Keys_OnlyQuery, Search_Raportti_Keys_OnlyQueryVariables>;
export const MetaDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"meta"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meta"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"report_type"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}},{"kind":"Field","name":{"kind":"Name","value":"file_type"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}},{"kind":"Field","name":{"kind":"Name","value":"system"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}},{"kind":"Field","name":{"kind":"Name","value":"track_part"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tilirataosanumero"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}},{"kind":"Field","name":{"kind":"Name","value":"latest_inspection"}},{"kind":"Field","name":{"kind":"Name","value":"input_fields"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]}}]}}]} as unknown as DocumentNode<MetaQuery, MetaQueryVariables>;