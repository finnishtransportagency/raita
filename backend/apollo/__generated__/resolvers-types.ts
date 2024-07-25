import { GraphQLResolveInfo } from 'graphql';
import { raportti } from '@prisma/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
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
  status: Scalars['String']['output'];
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

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  DateTimeIntervalInput: DateTimeIntervalInput;
  FieldAggregation: ResolverTypeWrapper<FieldAggregation>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  FloatIntervalInput: FloatIntervalInput;
  InputFieldDescription: ResolverTypeWrapper<InputFieldDescription>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  IntIntervalInput: IntIntervalInput;
  MetaResponse: ResolverTypeWrapper<MetaResponse>;
  Mittaus: ResolverTypeWrapper<Mittaus>;
  MittausCountResponse: ResolverTypeWrapper<MittausCountResponse>;
  MittausGenerateResponse: ResolverTypeWrapper<MittausGenerateResponse>;
  MittausInput: MittausInput;
  MittausSystemDescription: ResolverTypeWrapper<MittausSystemDescription>;
  Mutation: ResolverTypeWrapper<{}>;
  Query: ResolverTypeWrapper<{}>;
  Raportti: ResolverTypeWrapper<raportti>;
  RaporttiInput: RaporttiInput;
  SearchRaporttiResponse: ResolverTypeWrapper<Omit<SearchRaporttiResponse, 'raportti'> & { raportti?: Maybe<Array<ResolversTypes['Raportti']>> }>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Boolean: Scalars['Boolean']['output'];
  DateTimeIntervalInput: DateTimeIntervalInput;
  FieldAggregation: FieldAggregation;
  Float: Scalars['Float']['output'];
  FloatIntervalInput: FloatIntervalInput;
  InputFieldDescription: InputFieldDescription;
  Int: Scalars['Int']['output'];
  IntIntervalInput: IntIntervalInput;
  MetaResponse: MetaResponse;
  Mittaus: Mittaus;
  MittausCountResponse: MittausCountResponse;
  MittausGenerateResponse: MittausGenerateResponse;
  MittausInput: MittausInput;
  MittausSystemDescription: MittausSystemDescription;
  Mutation: {};
  Query: {};
  Raportti: raportti;
  RaporttiInput: RaporttiInput;
  SearchRaporttiResponse: Omit<SearchRaporttiResponse, 'raportti'> & { raportti?: Maybe<Array<ResolversParentTypes['Raportti']>> };
  String: Scalars['String']['output'];
}>;

export type FieldAggregationResolvers<ContextType = any, ParentType extends ResolversParentTypes['FieldAggregation'] = ResolversParentTypes['FieldAggregation']> = ResolversObject<{
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type InputFieldDescriptionResolvers<ContextType = any, ParentType extends ResolversParentTypes['InputFieldDescription'] = ResolversParentTypes['InputFieldDescription']> = ResolversObject<{
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MetaResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['MetaResponse'] = ResolversParentTypes['MetaResponse']> = ResolversObject<{
  file_type?: Resolver<Array<ResolversTypes['FieldAggregation']>, ParentType, ContextType>;
  input_fields?: Resolver<Array<ResolversTypes['InputFieldDescription']>, ParentType, ContextType>;
  latest_inspection?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  mittaus_systems?: Resolver<Array<ResolversTypes['MittausSystemDescription']>, ParentType, ContextType>;
  report_type?: Resolver<Array<ResolversTypes['FieldAggregation']>, ParentType, ContextType>;
  system?: Resolver<Array<ResolversTypes['FieldAggregation']>, ParentType, ContextType>;
  tilirataosanumero?: Resolver<Array<ResolversTypes['FieldAggregation']>, ParentType, ContextType>;
  track_part?: Resolver<Array<ResolversTypes['FieldAggregation']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MittausResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mittaus'] = ResolversParentTypes['Mittaus']> = ResolversObject<{
  Id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  ajonopeus?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  jarjestelma?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  lat?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  latitude?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  location?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  long?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  longitude?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  raide_numero?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  raportti_id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  rata_kilometri?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  rata_metrit?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  rataosuus_nimi?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  rataosuus_numero?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  running_date?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sscount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  track?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MittausCountResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['MittausCountResponse'] = ResolversParentTypes['MittausCountResponse']> = ResolversObject<{
  row_count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  size_estimate?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MittausGenerateResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['MittausGenerateResponse'] = ResolversParentTypes['MittausGenerateResponse']> = ResolversObject<{
  polling_key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MittausSystemDescriptionResolvers<ContextType = any, ParentType extends ResolversParentTypes['MittausSystemDescription'] = ResolversParentTypes['MittausSystemDescription']> = ResolversObject<{
  columns?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  generate_mittaus_csv?: Resolver<ResolversTypes['MittausGenerateResponse'], ParentType, ContextType, RequireFields<MutationGenerate_Mittaus_CsvArgs, 'columns' | 'mittaus'>>;
}>;

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  meta?: Resolver<ResolversTypes['MetaResponse'], ParentType, ContextType>;
  search_mittaus_count?: Resolver<ResolversTypes['MittausCountResponse'], ParentType, ContextType, RequireFields<QuerySearch_Mittaus_CountArgs, 'columns' | 'mittaus'>>;
  search_raportti?: Resolver<ResolversTypes['SearchRaporttiResponse'], ParentType, ContextType, RequireFields<QuerySearch_RaporttiArgs, 'page' | 'page_size' | 'raportti'>>;
  search_raportti_by_key_prefix?: Resolver<ResolversTypes['SearchRaporttiResponse'], ParentType, ContextType, RequireFields<QuerySearch_Raportti_By_Key_PrefixArgs, 'key' | 'page' | 'page_size'>>;
}>;

export type RaporttiResolvers<ContextType = any, ParentType extends ResolversParentTypes['Raportti'] = ResolversParentTypes['Raportti']> = ResolversObject<{
  campaign?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  extra_information?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  file_name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  file_type?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  inspection_date?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  inspection_datetime?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  is_empty?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  key?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  km_end?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  km_start?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  length?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  maintenance_area?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  maintenance_level?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  measurement_direction?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  measurement_end_location?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  measurement_start_location?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  metadata_changed_at_datetime?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  nonparsed_inspection_datetime?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  parsed_at_datetime?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  parser_version?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  report_category?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  report_type?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  size?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  source_system?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  system?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  temperature?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  tilirataosanumero?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  track_id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  track_number?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  track_part?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  year?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  zip_name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  zip_reception__date?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  zip_reception__year?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SearchRaporttiResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['SearchRaporttiResponse'] = ResolversParentTypes['SearchRaporttiResponse']> = ResolversObject<{
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  page?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  page_size?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  raportti?: Resolver<Maybe<Array<ResolversTypes['Raportti']>>, ParentType, ContextType>;
  total_size?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = any> = ResolversObject<{
  FieldAggregation?: FieldAggregationResolvers<ContextType>;
  InputFieldDescription?: InputFieldDescriptionResolvers<ContextType>;
  MetaResponse?: MetaResponseResolvers<ContextType>;
  Mittaus?: MittausResolvers<ContextType>;
  MittausCountResponse?: MittausCountResponseResolvers<ContextType>;
  MittausGenerateResponse?: MittausGenerateResponseResolvers<ContextType>;
  MittausSystemDescription?: MittausSystemDescriptionResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Raportti?: RaporttiResolvers<ContextType>;
  SearchRaporttiResponse?: SearchRaporttiResponseResolvers<ContextType>;
}>;

