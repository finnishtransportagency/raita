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

export type MetaResponse = {
  __typename?: 'MetaResponse';
  file_type: Array<FieldAggregation>;
  latest_inspection: Scalars['String']['output'];
  report_type: Array<FieldAggregation>;
  system: Array<FieldAggregation>;
  tilirataosanumero: Array<FieldAggregation>;
  track_part: Array<FieldAggregation>;
};

export type Query = {
  __typename?: 'Query';
  meta: MetaResponse;
  search_raportti: SearchRaporttiResponse;
};


export type QuerySearch_RaporttiArgs = {
  file_name?: InputMaybe<Scalars['String']['input']>;
  file_type?: InputMaybe<Array<Scalars['String']['input']>>;
  inspection_datetime?: InputMaybe<DateTimeIntervalInput>;
  key?: InputMaybe<Scalars['String']['input']>;
  page: Scalars['Int']['input'];
  page_size: Scalars['Int']['input'];
  report_type?: InputMaybe<Array<Scalars['String']['input']>>;
  system?: InputMaybe<Array<Scalars['String']['input']>>;
  tilirataosanumero?: InputMaybe<Array<Scalars['String']['input']>>;
  track_part?: InputMaybe<Array<Scalars['String']['input']>>;
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

export type SearchRaporttiResponse = {
  __typename?: 'SearchRaporttiResponse';
  count: Scalars['Int']['output'];
  page: Scalars['Int']['output'];
  page_size: Scalars['Int']['output'];
  raportti?: Maybe<Array<Raportti>>;
};

export type Search_RaporttiQueryVariables = Exact<{
  file_name?: InputMaybe<Scalars['String']['input']>;
  key?: InputMaybe<Scalars['String']['input']>;
  file_type?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  inspection_datetime?: InputMaybe<DateTimeIntervalInput>;
  system?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  report_type?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  track_part?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  tilirataosanumero?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  page: Scalars['Int']['input'];
  page_size: Scalars['Int']['input'];
}>;


export type Search_RaporttiQuery = { __typename?: 'Query', search_raportti: { __typename?: 'SearchRaporttiResponse', count: number, page: number, page_size: number, raportti?: Array<{ __typename?: 'Raportti', id: number, file_name?: string | null, key?: string | null, file_type?: string | null, source_system?: string | null, zip_name?: string | null, campaign?: string | null, track_number?: string | null, track_part?: string | null, track_id?: string | null, km_start?: number | null, km_end?: number | null, system?: string | null, nonparsed_inspection_datetime?: string | null, report_category?: string | null, parser_version?: string | null, size?: number | null, zip_reception__year?: string | null, zip_reception__date?: string | null, year?: number | null, extra_information?: string | null, maintenance_area?: string | null, is_empty?: boolean | null, length?: number | null, tilirataosanumero?: string | null, report_type?: string | null, temperature?: number | null, measurement_start_location?: string | null, measurement_end_location?: string | null, measurement_direction?: string | null, maintenance_level?: string | null, status?: string | null, inspection_date?: string | null, parsed_at_datetime?: string | null, inspection_datetime?: string | null, metadata_changed_at_datetime?: string | null }> | null } };

export type MetaQueryVariables = Exact<{ [key: string]: never; }>;


export type MetaQuery = { __typename?: 'Query', meta: { __typename?: 'MetaResponse', latest_inspection: string, report_type: Array<{ __typename?: 'FieldAggregation', value: string, count: number }>, file_type: Array<{ __typename?: 'FieldAggregation', value: string, count: number }>, system: Array<{ __typename?: 'FieldAggregation', value: string, count: number }>, track_part: Array<{ __typename?: 'FieldAggregation', value: string, count: number }>, tilirataosanumero: Array<{ __typename?: 'FieldAggregation', value: string, count: number }> } };


export const Search_RaporttiDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"search_raportti"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"file_name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"key"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"file_type"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"inspection_datetime"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTimeIntervalInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"system"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"report_type"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"track_part"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tilirataosanumero"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page_size"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"search_raportti"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"file_name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"file_name"}}},{"kind":"Argument","name":{"kind":"Name","value":"key"},"value":{"kind":"Variable","name":{"kind":"Name","value":"key"}}},{"kind":"Argument","name":{"kind":"Name","value":"file_type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"file_type"}}},{"kind":"Argument","name":{"kind":"Name","value":"inspection_datetime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"inspection_datetime"}}},{"kind":"Argument","name":{"kind":"Name","value":"system"},"value":{"kind":"Variable","name":{"kind":"Name","value":"system"}}},{"kind":"Argument","name":{"kind":"Name","value":"report_type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"report_type"}}},{"kind":"Argument","name":{"kind":"Name","value":"track_part"},"value":{"kind":"Variable","name":{"kind":"Name","value":"track_part"}}},{"kind":"Argument","name":{"kind":"Name","value":"tilirataosanumero"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tilirataosanumero"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"page_size"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page_size"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"raportti"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"file_name"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"file_type"}},{"kind":"Field","name":{"kind":"Name","value":"source_system"}},{"kind":"Field","name":{"kind":"Name","value":"zip_name"}},{"kind":"Field","name":{"kind":"Name","value":"campaign"}},{"kind":"Field","name":{"kind":"Name","value":"track_number"}},{"kind":"Field","name":{"kind":"Name","value":"track_part"}},{"kind":"Field","name":{"kind":"Name","value":"track_id"}},{"kind":"Field","name":{"kind":"Name","value":"km_start"}},{"kind":"Field","name":{"kind":"Name","value":"km_end"}},{"kind":"Field","name":{"kind":"Name","value":"system"}},{"kind":"Field","name":{"kind":"Name","value":"nonparsed_inspection_datetime"}},{"kind":"Field","name":{"kind":"Name","value":"report_category"}},{"kind":"Field","name":{"kind":"Name","value":"parser_version"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"zip_reception__year"}},{"kind":"Field","name":{"kind":"Name","value":"zip_reception__date"}},{"kind":"Field","name":{"kind":"Name","value":"year"}},{"kind":"Field","name":{"kind":"Name","value":"extra_information"}},{"kind":"Field","name":{"kind":"Name","value":"maintenance_area"}},{"kind":"Field","name":{"kind":"Name","value":"is_empty"}},{"kind":"Field","name":{"kind":"Name","value":"length"}},{"kind":"Field","name":{"kind":"Name","value":"tilirataosanumero"}},{"kind":"Field","name":{"kind":"Name","value":"report_type"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"measurement_start_location"}},{"kind":"Field","name":{"kind":"Name","value":"measurement_end_location"}},{"kind":"Field","name":{"kind":"Name","value":"measurement_direction"}},{"kind":"Field","name":{"kind":"Name","value":"maintenance_level"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"inspection_date"}},{"kind":"Field","name":{"kind":"Name","value":"parsed_at_datetime"}},{"kind":"Field","name":{"kind":"Name","value":"inspection_datetime"}},{"kind":"Field","name":{"kind":"Name","value":"metadata_changed_at_datetime"}}]}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"page_size"}}]}}]}}]} as unknown as DocumentNode<Search_RaporttiQuery, Search_RaporttiQueryVariables>;
export const MetaDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"meta"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meta"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"report_type"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}},{"kind":"Field","name":{"kind":"Name","value":"file_type"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}},{"kind":"Field","name":{"kind":"Name","value":"system"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}},{"kind":"Field","name":{"kind":"Name","value":"track_part"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tilirataosanumero"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}},{"kind":"Field","name":{"kind":"Name","value":"latest_inspection"}}]}}]}}]} as unknown as DocumentNode<MetaQuery, MetaQueryVariables>;