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
  orderByVariable?: InputMaybe<Scalars['String']['input']>;
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
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  MetaResponse: ResolverTypeWrapper<MetaResponse>;
  Query: ResolverTypeWrapper<{}>;
  Raportti: ResolverTypeWrapper<raportti>;
  SearchRaporttiResponse: ResolverTypeWrapper<Omit<SearchRaporttiResponse, 'raportti'> & { raportti?: Maybe<Array<ResolversTypes['Raportti']>> }>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Boolean: Scalars['Boolean']['output'];
  DateTimeIntervalInput: DateTimeIntervalInput;
  FieldAggregation: FieldAggregation;
  Float: Scalars['Float']['output'];
  Int: Scalars['Int']['output'];
  MetaResponse: MetaResponse;
  Query: {};
  Raportti: raportti;
  SearchRaporttiResponse: Omit<SearchRaporttiResponse, 'raportti'> & { raportti?: Maybe<Array<ResolversParentTypes['Raportti']>> };
  String: Scalars['String']['output'];
}>;

export type FieldAggregationResolvers<ContextType = any, ParentType extends ResolversParentTypes['FieldAggregation'] = ResolversParentTypes['FieldAggregation']> = ResolversObject<{
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MetaResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['MetaResponse'] = ResolversParentTypes['MetaResponse']> = ResolversObject<{
  file_type?: Resolver<Array<ResolversTypes['FieldAggregation']>, ParentType, ContextType>;
  latest_inspection?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  report_type?: Resolver<Array<ResolversTypes['FieldAggregation']>, ParentType, ContextType>;
  system?: Resolver<Array<ResolversTypes['FieldAggregation']>, ParentType, ContextType>;
  tilirataosanumero?: Resolver<Array<ResolversTypes['FieldAggregation']>, ParentType, ContextType>;
  track_part?: Resolver<Array<ResolversTypes['FieldAggregation']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  meta?: Resolver<ResolversTypes['MetaResponse'], ParentType, ContextType>;
  search_raportti?: Resolver<ResolversTypes['SearchRaporttiResponse'], ParentType, ContextType, RequireFields<QuerySearch_RaporttiArgs, 'page' | 'page_size'>>;
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
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = any> = ResolversObject<{
  FieldAggregation?: FieldAggregationResolvers<ContextType>;
  MetaResponse?: MetaResponseResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Raportti?: RaporttiResolvers<ContextType>;
  SearchRaporttiResponse?: SearchRaporttiResponseResolvers<ContextType>;
}>;

