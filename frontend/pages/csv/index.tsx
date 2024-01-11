/**
 * @todo Handle empty search queries
 * @todo Handle form data validation
 */
import { useState, useMemo, Fragment, useEffect } from 'react';
import { useRouter } from 'next/router';
import * as R from 'rambda';
import { i18n, useTranslation } from 'next-i18next';
import { clsx } from 'clsx';

import * as cfg from 'shared/config';
import { App, BannerType, RaitaNextPage, Range } from 'shared/types';
import { takeOptionValues } from 'shared/util';

import { makeFromMulti, makeQuery } from 'shared/query-builder';
import { Button, TextInput, CopyToClipboard } from 'components';
import { DateRange } from 'components';
import FilterSelector from 'components/filters';
import { Entry } from 'components/filters/selector';
import MultiChoice from 'components/filters/multi-choice';
import LoadingOverlay from 'components/loading-overlay';
import InfoBanner from 'components/infobanner';

import { useMetadataQuery, useSearch, useFileQuery } from '../../shared/hooks';
import css from './csv.module.css';
import { ZipDownload } from 'components/zip-download';

import { RaitaRole, useUser } from 'shared/user';
//

const initialState: CsvState = {
  text: '',
  filters: {},
  filter: [],
  resetFilters: false,
  special: {
    dateRange: { start: undefined, end: undefined },
  },
  subQueries: {},
  dateRange: {
    end: undefined,
    start: undefined,
  },
  debug: false,
  waitingToUpdateMutation: false,
};

//

const CsvIndex: RaitaNextPage = () => {
  const { t } = useTranslation(['common', 'metadata']);
  const meta = useMetadataQuery();

  const user = useUser();

  const [state, setState] = useState<CsvState>(initialState);
  const [testResult, setTestResult] = useState(false);

  // #region Special extra filters

  const hasRangeFilter =
    !!state.special.dateRange?.start || !!state.special.dateRange?.end;

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

  // #endregion

  const newFilters = [...state.filter]
    .concat(hasRangeFilter ? dateRangeFilter : [])
    .filter(R.identity) as Entry[];

  /**
   * Mutations in React Query lingo don't mutate data per se,
   * they are more like invokable queries; where regular queries are meant to be
   * more automatic, mutations are used for things where we want to explicitly
   * make a query as a result of some action, e.g. like doing a POST request.
   */
  // #region Mutations

  // Search mutation
  // const mutation = useSearch();

  // #endregion

  const doSearch = () => {
    setTestResult(true);
  };

  const resetSearch = () => {
    setState(() => JSON.parse(JSON.stringify(initialState)) as CsvState);
    setState(R.assoc('resetFilters', true));
    // mutation.reset();
  };

  // const resultsData = mutation.data;

  // make sure mutation is updated only after query object is changed
  // useEffect(() => {
  //   if (state.waitingToUpdateMutation) {
  //     mutation.mutate(query);
  //     setState(R.assoc('waitingToUpdateMutation', false));
  //   }
  // }, [state.waitingToUpdateMutation]);

  const updateDateRange = (range: Range<Date>) => {
    setState(R.assocPath(['special', 'dateRange'], range));
    setState(R.assoc('resetFilters', false));
  };

  const updateFilterList = (fs: Entry[]) => {
    setState(R.assoc('filter', fs));
    setState(R.assoc('resetFilters', false));
  };

  const updateSearchText = (text: string) => {
    setState(R.assoc('text', text));
    setState(R.assoc('resetFilters', false));
  };
  //

  /**
   * Check whether any of our queries/mutations are loading,
   * so that we can do things like disable UI controls.
   */
  const isLoading = [meta.isLoading /*mutation.isLoading*/].some(R.identity);

  if (meta.isLoading || !meta.data) return <LoadingOverlay />;

  if (meta.isError) return <div>Error</div>;

  const showFullFilePath =
    user.user && user.user.roles.includes(RaitaRole.Admin);

  return (
    <div className={clsx(css.root, isLoading && css.isLoading)}>
      <InfoBanner
        bannerType={BannerType.INFO}
        text={t('common:rights_restriction_info')}
      />

      <div className="container mx-auto px-16 py-6">
        {/* {resultsData?.total && resultsData.total >= 10000 && (
          <InfoBanner
            bannerType={BannerType.WARNING}
            text={t('common:too_many_results')}
            className="object-right w-3/6 ml-auto rounded"
          />
        )} */}

        <div className="grid grid-cols-3 gap-12">
          <section className="space-y-4">
            <header className="text-3xl border-primary border-b-2 mb-4 pb-2">
              {t('common:reports_search')}
            </header>
            <div className="space-y-4 divide-y-2 divide-main-gray-10">
              {/* Search date range */}
              <section className={clsx(css.subSection)}>
                <header>{t('common:reports_timespan')}</header>

                <DateRange
                  range={state.special.dateRange}
                  onUpdate={updateDateRange}
                  resetDateRange={state.resetFilters}
                  inputId="reports-daterange"
                />
              </section>

              <section className={clsx(css.subSection)}>
                <MultiChoice
                  label={t('common:reports_track_parts')}
                  inputId="report-track-part"
                  items={(meta.data?.trackParts || []).map(it => ({
                    key: it.value,
                    value: it.value,
                  }))}
                  resetFilters={state.resetFilters}
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
                    setState(R.assoc('resetFilters', false));
                  }}
                />
              </section>
              <section className={clsx(css.subSection)}>
                <MultiChoice
                  label={t('common:reports_tilirataosanumerot')}
                  inputId="report-tilirataosanumero"
                  items={(meta.data?.tilirataosanumerot || []).map(it => ({
                    key: it.value,
                    value: it.value,
                  }))}
                  resetFilters={state.resetFilters}
                  onChange={e => {
                    setState(
                      R.assocPath(
                        ['subQueries', 'tilirataosanumerot'],
                        makeFromMulti(
                          takeOptionValues(e.target.selectedOptions),
                          'tilirataosanumero',
                        ),
                      ),
                    );
                    setState(R.assoc('resetFilters', false));
                  }}
                />
              </section>

              <section>
                <TextInput
                  onUpdate={() => {}}
                  value={''}
                  placeholder={'Ratakilometri?'}
                  resetSearchText={state.resetFilters}
                />
              </section>

              <section>
                <TextInput
                  onUpdate={() => {}}
                  value={''}
                  placeholder={'Kartta?'}
                  resetSearchText={state.resetFilters}
                />
              </section>

              <section>
                <TextInput
                  onUpdate={updateSearchText}
                  value={state.text}
                  placeholder={t('common:search_by_filename')}
                  resetSearchText={state.resetFilters}
                />
              </section>

              <section className={clsx(css.subSection)}>
                <header>{t('common:reports_metadata')}</header>

                <FilterSelector
                  filters={[]}
                  onChange={updateFilterList}
                  fields={meta.data?.fields!}
                  resetFilterSelector={state.resetFilters}
                />
              </section>
            </div>
          </section>

          <section className="col-span-2">
            <header className="text-3xl border-b-2 border-gray-500 mb-4 pb-2">
              {/* {!mutation.data && t('no_search_results')} */}

              {/* {mutation.data && (
                <div className="flex">
                  <div className="mt-1">
                    {t('search_result_count', {
                      count: resultsData?.total,
                    })}
                  </div>
                  {resultsData?.totalSize && resultsData?.totalSize > 0 && (
                    <div className="ml-2">
                      <ZipDownload
                        aggregationSize={resultsData?.total}
                        usedQuery={query}
                        resultTotalSize={resultsData?.totalSize}
                      />
                    </div>
                  )}
                </div>
              )} */}
            </header>

            <section className={clsx(css.subSection)}>
              <MultiChoice
                label={t('common:reports_systems')}
                inputId="report-system"
                items={(meta.data?.systems || []).map(x => ({
                  key: i18n?.exists(`metadata:${x.value}`)
                    ? `${x.value} / ${t(`metadata:${x.value}`)}`
                    : x.value,
                  value: x.value,
                }))}
                resetFilters={state.resetFilters}
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
                  setState(R.assoc('resetFilters', false));
                }}
              />
            </section>
            <section>
              <MultiChoice
                label={'suureet'}
                inputId="todo"
                items={[
                  { key: 'suure 1', value: 'asd' },
                  { key: 'suure 2', value: 'asd' },

                  { key: 'suure 3', value: 'asd' },
                ]}
                resetFilters={state.resetFilters}
                onChange={e => {}}
              />
              <footer className="pt-4">
                {/* Search controls for doing the search, reset */}
                <div className="space-x-2">
                  <Button label={t('common:search')} onClick={doSearch} />
                  <Button label={t('common:clear')} onClick={resetSearch} />
                </div>
              </footer>
            </section>
            <section>
              {/* {!resultsData && <div>{t('common:no_results')}</div>}

              {mutation.isSuccess && mutation.data && (
                <div>
                  <ul className="space-y-2 divide-y-2">
                    {resultsData?.hits.map((it, ix) => {
                      const { source: doc } = it;

                      // Bail out if we have nothing
                      if (!doc) return null;

                      return <li key={`result-${ix}`}></li>;
                    })}
                  </ul>
                </div>
              )} */}
              {testResult && (
                <>
                  <div>Haun koko: X riviä. Tiedoston koko: YY MB</div>
                  <div>
                    <Button label="Lataa tiedosto" onClick={() => {}} />
                  </div>
                </>
              )}
            </section>
          </section>
        </div>
      </div>
    </div>
  );
};

CsvIndex.requiredRole = RaitaRole.Read;

export default CsvIndex;

//

export type StaticProps = {
  locale: App.Locales;
};

type CsvState = {
  text: string;
  filters: Record<string, string>;
  filter: Entry[];
  resetFilters: boolean;
  special: {
    dateRange?: Partial<Range<Date>>;
  };
  subQueries: {};
  dateRange: Partial<Range<Date>>;
  debug?: boolean;
  waitingToUpdateMutation: boolean;
};
