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
import { toSearchQueryTerm } from 'shared/util';

import { RANGE_DATE_FMT } from 'shared/constants';
import { Button } from 'components';
import { DateRange, Pager } from 'components';
import Footer from 'components/footer';
import FilterSelector from 'components/filters';

import { useMetadataQuery, useSearch, useFileQuery } from '../../shared/hooks';
import css from './reports.module.css';

//

const ReportsIndex: NextPage = () => {
  const { t } = useTranslation(['common', 'metadata']);
  const meta = useMetadataQuery();

  const router = useRouter();

  const curPage_ = parseInt(router.query['p'] as string, 10);
  const curPage = !isNaN(curPage_) ? curPage_ : 0;

  const selectRef = useRef<HTMLSelectElement>(null);

  const [state, setState] = useState<ReportsState>({
    filters: {},
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

  /**
   * @todo Extract into something more reusable
   * @todo Handle empty queries
   */
  const query = useMemo(() => {
    const terms = Object.entries(state.filters).map(([k, v]) =>
      toSearchQueryTerm(k, v, x => `metadata.${x}`),
    );

    const _hasReportTypes = state.reportTypes.length > 0;
    const _hasFilters = terms.length > 0;

    const _reportTypes = state.reportTypes
      .filter(x => !!x)
      .map(t => toSearchQueryTerm('report_type', t, x => `metadata.${x}`));

    const _hasRange = R.pipe(
      R.values,
      R.filter(x => !!x), // That's right
      R.length,
    )(state.dateRange);

    const _range = {
      ...(_hasRange
        ? {
            range: {
              'metadata.inspection_date': {
                ...(state.dateRange?.start
                  ? { gte: format(RANGE_DATE_FMT, state.dateRange.start) }
                  : {}),
                ...(state.dateRange?.end
                  ? { lte: format(RANGE_DATE_FMT, state.dateRange.end) }
                  : {}),
              },
            },
          }
        : {}),
    };

    const _filters = {
      ...(_hasFilters || _hasRange || _hasReportTypes
        ? {
            bool: {
              must: [
                ...terms,
                ..._reportTypes,
                _hasRange ? _range : undefined,
              ].filter(x => x),
            },
          }
        : {}),
    };

    // Paging
    const _page = {
      from: state.paging.page * state.paging.size,
      size: state.paging.size,
    };

    const _res = {
      query: {
        ..._filters,
      },
      ..._page,
    };

    const __res = R.isEmpty(_res.query) ? R.omit('query', _res) : _res;

    return __res;
  }, [state.filters, state.paging, state.dateRange, state.reportTypes]);

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

  const resultsData = mutation.data?.result.body;

  const updateFilters = (fs: ReportFilters) => setState(R.assoc('filters', fs));

  const updateDateRange = (range: Range<Date>) => {
    setState(R.assoc('dateRange', range));
  };

  const updateReportType = () => {};

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
            <h1 className="text-4xl">{t('common:reports_heading')}</h1>
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
                  filters={[
                    { field: 'km_start', value: '123', rel: 'gte' },
                    { field: 'source_system', value: 'PI' },
                  ]}
                  onChange={e => {
                    // Store filter changes from here to build a workable search query
                    console.log('FilterSelector:onUpdate', e);
                  }}
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
              </section>

              <section className={clsx(css.subSection)}>
                <header>{t('common:reports_report_types')}</header>

                <select
                  className={clsx(css.select)}
                  multiple={true}
                  ref={selectRef}
                  onChange={e =>
                    setState(
                      R.assoc(
                        'reportTypes',
                        Array.from(e.target.selectedOptions).map(
                          R.prop('value'),
                        ),
                      ),
                    )
                  }
                >
                  <option value={''}>{t('common:no_selection')}</option>

                  {meta.data?.reportTypes?.map((it, ix) => (
                    <option className="px-2" key={ix} value={it.reportType}>
                      {it.reportType}
                    </option>
                  ))}
                </select>

                <footer className="py-2">
                  <Button
                    onClick={() => {
                      if (!selectRef.current) return;

                      /** @todo ??? */
                      selectRef.current.selectedOptions;
                    }}
                    size={'sm'}
                    type={'secondary'}
                    label={t('common:select_none')}
                  />
                </footer>
              </section>

              <section className={clsx(css.subSection)}>
                <header>{t('common:reports_track_parts')}</header>
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

            <details>
              <summary>{t('debug:debug')}</summary>
              <div className="opacity-40 space-y-4 text-xs max-h-96 mt-4 overflow-auto">
                <fieldset>
                  <legend>{t('debug:state')}</legend>

                  <pre>
                    <code>{JSON.stringify(state, null, 2)}</code>
                  </pre>
                </fieldset>

                <fieldset>
                  <legend>{t('debug:search_query')}</legend>

                  <div>
                    <pre>
                      <code>{JSON.stringify({ qʼ: query }, null, 2)}</code>
                    </pre>
                  </div>
                </fieldset>

                <fieldset>
                  <legend>{t('debug:response')}</legend>

                  <div>
                    <pre>
                      <code>
                        {JSON.stringify(
                          {
                            data: mutation.data,
                          },
                          null,
                          2,
                        )}
                      </code>
                    </pre>
                  </div>
                </fieldset>
              </div>
            </details>
          </section>

          <section>
            <header className="text-3xl border-b-2 border-gray-500 mb-4 pb-2">
              {!mutation.data && t('no_search_results')}

              {mutation.data &&
                t('search_result_count', {
                  count: (resultsData?.hits?.total as SearchTotalHits).value,
                })}
            </header>

            <section>
              {!resultsData && <div>{t('common:no_results')}</div>}

              {mutation.isSuccess && mutation.data && (
                <div>
                  <ul className="space-y-2 divide-y-2">
                    {resultsData?.hits.hits.map((it, ix) => {
                      const { _source: doc } = it;

                      // Bail out if we have nothing
                      if (!doc) return null;

                      return (
                        <li key={`result-${ix}`}>
                          <article className="py-2 space-y-2">
                            <header>
                              {doc.file_name}
                              <span className="text-xs">
                                Score=
                                <span className="font-mono">{it._score}</span>
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
                      count={resultsData?.hits.total as number}
                      onGotoPage={setPage}
                    />
                  )}
                </div>
              </footer>
            </section>
          </section>
        </div>
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
  dateRange: Partial<Range<Date>>;
  reportTypes: string[];
  paging: {
    size: number;
    page: number;
  };
  debug?: boolean;
};

type ReportFilters = Record<string, string>;
