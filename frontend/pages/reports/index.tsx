/**
 * @todo Handle empty search queries
 * @todo Handle form data validation
 */
import { useState, useMemo, useRef, Fragment } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import * as R from 'rambda';
import { useTranslation } from 'next-i18next';
import type { SearchTotalHits } from '@opensearch-project/opensearch/api/types';
import { clsx } from 'clsx';
import { format } from 'date-fns/fp';

import * as cfg from 'shared/config';
import type { App, Range, Rest } from 'shared/types';
import { takeOptionValues, toSearchQueryTerm } from 'shared/util';

import { makeFromMulti, makeMatchQuery, makeQuery } from 'shared/query-builder';
import { RANGE_DATE_FMT } from 'shared/constants';
import { Button, Dropdown } from 'components';
import { DateRange, Pager } from 'components';
import Footer from 'components/footer';
import FilterSelector from 'components/filters';
import { Entry } from 'components/filters/selector';

import { useMetadataQuery, useSearch, useFileQuery } from '../../shared/hooks';
import css from './reports.module.css';
import MultiChoice from 'components/filters/multi-choice';

//

const ReportsIndex: NextPage = () => {
  const { t } = useTranslation(['common', 'metadata']);
  const meta = useMetadataQuery();

  const router = useRouter();

  const curPage_ = parseInt(router.query['p'] as string, 10);
  const curPage = !isNaN(curPage_) ? curPage_ : 1;

  const selectRef = useRef<HTMLSelectElement>(null);

  const [state, setState] = useState<ReportsState>({
    filters: {},
    filter: [],
    special: {
      dateRange: { start: undefined, end: undefined },
      fileType: undefined,
      reportTypes: [],
    },
    subQueries: {
      reportTypes: {},
      fileTypes: {},
    },
    dateRange: {
      end: undefined,
      start: undefined,
    },
    reportTypes: [],
    paging: {
      size: cfg.paging.pageSize,
      page: curPage,
    },
    debug: false,
  });

  // #region Special extra filters

  const hasFileTypeFilter = !!state.special.fileType;
  const hasRangeFilter =
    !!state.special.dateRange?.start || !!state.special.dateRange?.end;

  const fileTypeFilter: Entry = {
    field: 'file_type',
    type: 'match',
    rel: 'eq',
    value: state.special.fileType,
  };

  const dateRangeFilter = [
    state?.special?.dateRange?.start
      ? {
          field: 'inspection_datetime',
          type: 'range',
          rel: 'gte',
          value: state?.special?.dateRange?.start?.toISOString(),
        }
      : {},
    state?.special?.dateRange?.end
      ? {
          field: 'inspection_datetime',
          type: 'range',
          rel: 'lte',
          value: state?.special?.dateRange?.end?.toISOString(),
        }
      : {},
  ]
    .filter(R.complement(R.isEmpty))
    .filter(x => !!x) as Entry[]; // <- because we like to roll like that

  const reportTypeFilter = {
    bool: {
      should: state.special.reportTypes?.map(t => ({
        match: {
          [`metadata.report_type`]: t,
        },
      })),
    },
  };

  // #endregion

  const newFilters = [...state.filter, hasFileTypeFilter && fileTypeFilter]
    .concat(hasRangeFilter ? dateRangeFilter : [])
    .filter(R.identity) as Entry[];

  /**
   * Use query builder to get an OpenSearch query based on the filters
   */
  const query = useMemo(
    () =>
      makeQuery(
        newFilters,
        {
          paging: { curPage, size: cfg.paging.pageSize },
        },
        Object.values(state.subQueries).filter(x => !R.isEmpty(x)),
      ),
    [newFilters, reportTypeFilter, state.subQueries, curPage],
  );

  /**
   * Mutations in React Query lingo don't mutate data per se,
   * they are more like invokable queries; where regular queries are meant to be
   * more automatic, mutations are used for things where we want to explicitly
   * make a query as a result of some action, e.g. like doing a POST request.
   */
  // #region Mutations

  // Search mutation
  const mutation = useSearch();

  // S3 file URL endpoint mutation
  const getFileUrl = useFileQuery();

  // #endregion

  const resultsData = mutation.data;

  const updateDateRange = (range: Range<Date>) => {
    setState(R.assocPath(['special', 'dateRange'], range));
  };

  const updateReportType = () => {};

  const updateFilterList = (fs: Entry[]) => setState(R.assoc('filter', fs));

  //

  const setPage = (n: number) => setState(R.assocPath(['paging', 'page'], n));

  //

  if (meta.isLoading || !meta.data) return <div>Loading</div>;

  if (meta.isError) return <div>Error</div>;

  //

  return (
    <div className={clsx(css.root)}>
      <Head>
        <title>{t('common:reports_head_title')}</title>
      </Head>

      <div className="bg-primary text-white">
        <div className="container mx-auto px-16 py-6">
          <header>
            <h1 className="text-4xl">
              {t('common:reports_heading')} Page: {curPage}
            </h1>
          </header>
        </div>
      </div>

      <div className="container mx-auto px-16 py-6">
        <header className="mb-4"></header>

        <div className="grid grid-cols-2 gap-12">
          <section className="space-y-4">
            <header className="text-3xl border-primary border-b-2 mb-4 pb-2">
              {t('common:reports_search')}
            </header>

            <div className="space-y-4 divide-y-2 divide-main-gray-10">
              <section className={clsx(css.subSection)}>
                <header>{t('common:reports_metadata')}</header>

                <FilterSelector
                  filters={[]}
                  onChange={updateFilterList}
                  fields={meta.data?.fields!}
                />
              </section>

              {/* Search date range */}
              <section className={clsx(css.subSection)}>
                <header>{t('common:reports_timespan')}</header>

                <DateRange range={state.dateRange} onUpdate={updateDateRange} />
              </section>

              {/* Search file types */}
              <section className={clsx(css.subSection)}>
                <header>{t('common:reports_file_types')}</header>

                <MultiChoice
                  items={(meta.data?.fileTypes || []).map(x => ({
                    key: x.fileType,
                    value: x.fileType,
                  }))}
                  onChange={e => {
                    setState(
                      R.assocPath(
                        ['subQueries', 'fileTypes'],
                        makeFromMulti(
                          takeOptionValues(e.target.selectedOptions),
                          'file_type',
                        ),
                      ),
                    );
                  }}
                />
              </section>

              <section className={clsx(css.subSection)}>
                <header>{t('common:reports_report_types')}</header>

                <MultiChoice
                  items={(meta.data?.reportTypes || []).map(it => ({
                    key: it.reportType,
                    value: it.reportType,
                  }))}
                  onChange={e => {
                    setState(
                      R.assocPath(
                        ['subQueries', 'reportTypes'],
                        makeFromMulti(
                          takeOptionValues(e.target.selectedOptions),
                          'report_type',
                        ),
                      ),
                    );
                  }}
                />
              </section>

              <section className={clsx(css.subSection)}>
                <header>{t('common:reports_track_parts')}</header>

                <MultiChoice
                  items={(meta.data?.trackParts || []).map(it => ({
                    key: it.value,
                    value: it.value,
                  }))}
                  onChange={e => {
                    setState(
                      R.assocPath(
                        ['subQueries', 'trackParts'],
                        makeFromMulti(
                          takeOptionValues(e.target.selectedOptions),
                          'track_part',
                        ),
                      ),
                    );
                  }}
                />
              </section>

              <section className={clsx(css.subSection)}>
                <header>{t('common:reports_systems')}</header>

                <MultiChoice
                  items={(meta.data?.systems || []).map(x => ({
                    key: x.value,
                    value: x.value,
                  }))}
                  onChange={e => {
                    setState(
                      R.assocPath(
                        ['subQueries', 'systems'],
                        makeFromMulti(
                          takeOptionValues(e.target.selectedOptions),
                          'system',
                        ),
                      ),
                    );
                  }}
                />
              </section>

              <footer className="pt-4">
                {/* Search controls for doing the search, reset */}
                <div className="space-x-2">
                  <Button
                    label={t('common:search')}
                    onClick={() => mutation.mutate(query as any)}
                  />
                  <Button
                    label={t('common:clear')}
                    onClick={() => mutation.reset()}
                  />
                </div>
              </footer>
            </div>
          </section>

          <section>
            <header className="text-3xl border-b-2 border-gray-500 mb-4 pb-2">
              {!mutation.data && t('no_search_results')}

              {mutation.data &&
                t('search_result_count', {
                  count: resultsData?.total,
                })}
            </header>

            <section>
              {!resultsData && <div>{t('common:no_results')}</div>}

              {mutation.isSuccess && mutation.data && (
                <div>
                  <ul className="space-y-2 divide-y-2">
                    {resultsData?.hits.map((it, ix) => {
                      const { source: doc } = it;

                      // Bail out if we have nothing
                      if (!doc) return null;

                      return (
                        <li key={`result-${ix}`}>
                          <article className="py-2 space-y-2">
                            <header>
                              {doc.file_name}
                              <span className="text-xs">
                                Score=
                                <span className="font-mono">{it.score}</span>
                              </span>
                            </header>

                            <div className="text-xs">
                              <dl className="grid grid-cols-4">
                                {Object.entries(doc.metadata).map(
                                  ([k, v], mi) => (
                                    <Fragment key={mi}>
                                      <dt className="">{k}</dt>
                                      <dd className="">{`${v}`}</dd>
                                    </Fragment>
                                  ),
                                )}
                              </dl>
                            </div>

                            <footer className="text-right space-x-2">
                              <Button
                                disabled={true}
                                size="sm"
                                label={t('common:preview')}
                                onClick={() => {}}
                              />
                              <Button
                                size="sm"
                                label={t('common:download')}
                                onClick={() => {
                                  const opts = {
                                    key: doc.key,
                                    fileName: doc.file_name,
                                  };

                                  getFileUrl.mutate(opts);
                                }}
                              />
                            </footer>
                          </article>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <footer className="space-y-2 flex justify-between mt-2">
                <Button
                  disabled={true}
                  label={t('common:download_all')}
                  type="secondary"
                  onClick={() => {}}
                />

                <div>
                  {mutation.isSuccess && (
                    <Pager
                      size={state.paging.size}
                      page={state.paging.page}
                      // TODO: Temporary solution to default to 0.
                      // Update to handle missing resultsData closer to source or
                      // Pager to accept undefined count?
                      count={resultsData?.total || 0}
                      onGotoPage={setPage}
                    />
                  )}
                </div>
              </footer>
            </section>
          </section>
        </div>
      </div>

      <div className="container mx-auto px-16 pb-4">
        <details>
          <summary>{t('debug:debug')}</summary>
          <div className="opacity-40 space-y-4 text-xs mt-4">
            <div className="grid grid-cols-2 gap-4">
              <fieldset>
                <legend>{t('debug:state')}</legend>

                <pre className="max-h-96 overflow-auto">
                  <code>{JSON.stringify(state, null, 2)}</code>
                </pre>
              </fieldset>

              <fieldset>
                <legend>query</legend>

                <pre className="max-h-96 overflow-auto">
                  <code>{JSON.stringify(query, null, 2)}</code>
                </pre>
              </fieldset>
            </div>
          </div>
        </details>
      </div>

      <Footer />
    </div>
  );
};

export default ReportsIndex;

//

export type StaticProps = {
  locale: App.Locales;
};

type ReportsState = {
  filters: Record<string, string>;
  filter: Entry[];
  special: {
    dateRange?: Partial<Range<Date>>;
    fileType?: 'csv' | 'pdf' | 'txt' | 'xlsx';
    reportTypes?: string[];
  };
  subQueries: {
    reportTypes: object;
    fileTypes: object;
  };
  dateRange: Partial<Range<Date>>;
  reportTypes: string[];
  paging: {
    size: number;
    page: number;
  };
  debug?: boolean;
};

type ReportFilters = Record<string, string>;
