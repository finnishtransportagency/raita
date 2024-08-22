import { useState, useEffect } from 'react';
import * as R from 'rambda';
import { i18n, useTranslation } from 'next-i18next';
import { clsx } from 'clsx';

import { App, BannerType, RaitaNextPage, Range } from 'shared/types';
import { sizeformatter, takeOptionValues } from 'shared/util';

import { Button, TextInput } from 'components';
import { DateRange } from 'components';
import MultiChoice from 'components/filters/multi-choice';
import LoadingOverlay from 'components/loading-overlay';
import InfoBanner from 'components/infobanner';

import css from '../reports/reports.module.css';

import { RaitaRole, useUser } from 'shared/user';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import {
  DateTimeIntervalInput,
  Search_Mittaus_CountQueryVariables,
} from 'shared/graphql/__generated__/graphql';
import {
  GENERATE_MITTAUS_CSV,
  MITTAUS_META,
  SEARCH_CSV_RAPORTTI_DETAILS,
  SEARCH_MITTAUS_COUNT,
} from 'shared/graphql/queries/csv';
import { CsvDownload } from 'components/csv-download';

//

const initialState: CsvState = {
  resetFilters: false,
  debug: false,
  queryVariables: {
    raportti: { file_type: ['csv'] },
    mittaus: {},
    columns: [],
    raportti_keys: [],
  },
};

const CsvIndex: RaitaNextPage = () => {
  const { t } = useTranslation(['common', 'metadata']);
  const meta = useQuery(MITTAUS_META);
  const [triggerMittausCountSearch, mittausCountQuery] =
    useLazyQuery(SEARCH_MITTAUS_COUNT);
  const [triggerRaporttiSearch, raporttiQuery] = useLazyQuery(
    SEARCH_CSV_RAPORTTI_DETAILS,
  );

  const [state, setState] = useState<CsvState>(initialState);

  const doSearch = () => {
    setState(R.assocPath(['queryVariables', 'columns'], []));
    setState(R.assocPath(['queryVariables', 'query_variables'], []));
    triggerRaporttiSearch({
      variables: {
        raportti: state.queryVariables.raportti,
        page: 1,
        page_size: 1000, // TODO: we want all?
      },
    });
  };

  const resetSearch = () => {
    setState(() => JSON.parse(JSON.stringify(initialState)) as CsvState);
    setState(R.assoc('resetFilters', true));
  };

  const updateDateRange = (range: Range<Date>) => {
    if (!range.start && !range.end) {
      setState(
        R.assocPath(
          ['queryVariables', 'raportti', 'inspection_datetime'],
          undefined,
        ),
      );
      return;
    }
    const input: DateTimeIntervalInput = {
      start: range.start?.toISOString(),
      end: range.end?.toISOString(),
    };
    setState(
      R.assocPath(['queryVariables', 'raportti', 'inspection_datetime'], input),
    );
    setState(R.assoc('resetFilters', false));
  };

  const updateSearchText = (text: string) => {
    setState(R.assocPath(['queryVariables', 'raportti', 'file_name'], text));
    setState(R.assoc('resetFilters', false));
  };
  //

  const triggerCountSearch = () => {
    // TODO: initial query vs refetch? need to fix state management of the different queries
    triggerMittausCountSearch({ variables: state.queryVariables });
  };

  /**
   * Check whether any of our queries/mutations are loading,
   * so that we can do things like disable UI controls.
   */
  const isLoading = [meta.loading, mittausCountQuery.loading].some(R.identity);

  if (meta.loading || !meta.data) return <LoadingOverlay />;

  if (meta.error) return <div>Error</div>;
  const inspectionDateRangeForSelector: Range<Date> = {
    // TODO: mapping function
    start: state.queryVariables.raportti.inspection_datetime?.start
      ? new Date(state.queryVariables.raportti.inspection_datetime.start)
      : undefined,
    end: state.queryVariables.raportti.inspection_datetime?.end
      ? new Date(state.queryVariables.raportti.inspection_datetime.end)
      : undefined,
  };
  const mittausSystems = meta.data.meta.mittaus_systems;
  const selectedSystems = state.queryVariables.raportti.system ?? [];
  const columnChoices = mittausSystems
    .filter(
      system =>
        selectedSystems.length === 0 || selectedSystems.includes(system.name),
    )
    .flatMap(system =>
      system.columns.map(columnName => ({
        key: `${system.name}: ${columnName}`,
        value: columnName,
      })),
    );

  return (
    <div className={clsx(css.root, isLoading && css.isLoading)}>
      <InfoBanner
        bannerType={BannerType.INFO}
        text={t('common:rights_restriction_info')}
      />

      <div className="container mx-auto px-16 py-6">
        <div className="grid grid-cols-3 gap-12">
          <section className="space-y-4">
            <header className="text-3xl border-primary border-b-2 mb-4 pb-2">
              {t('common:csv_search')}
            </header>

            <TextInput
              onUpdate={updateSearchText}
              value={state.queryVariables.raportti.file_name ?? ''}
              placeholder={t('common:search_by_filename')}
              resetSearchText={state.resetFilters}
            />

            <div className="space-y-4 divide-y-2 divide-main-gray-10">
              <section className={clsx(css.subSection)}>
                <header>{t('common:reports_metadata')}</header>

                {/*
                TODO: implement with graphql
                <FilterSelector
                  filters={[]}
                  onChange={updateFilterList}
                  fields={meta.data?.fields!}
                  resetFilterSelector={state.resetFilters}
                /> */}
              </section>

              {/* Search date range */}
              <section className={clsx(css.subSection)}>
                <header>{t('common:reports_timespan')}</header>

                <DateRange
                  range={inspectionDateRangeForSelector}
                  onUpdate={updateDateRange}
                  resetDateRange={state.resetFilters}
                  inputId="reports-daterange"
                />
              </section>

              <section className={clsx(css.subSection)}>
                <MultiChoice
                  label={t('common:reports_systems')}
                  inputId="report-system"
                  items={(
                    meta.data.meta.mittaus_systems.map(system => system.name) ||
                    []
                  ).map(x => ({
                    key: i18n?.exists(`metadata:${x}`)
                      ? `${x} / ${t(`metadata:${x}`)}`
                      : x,
                    value: x,
                  }))}
                  resetFilters={state.resetFilters}
                  onChange={e => {
                    setState(
                      R.assocPath(
                        ['queryVariables', 'raportti', 'system'],
                        takeOptionValues(e.target.selectedOptions),
                      ),
                    );
                    setState(R.assoc('resetFilters', false));
                  }}
                />
              </section>

              <section className={clsx(css.subSection)}>
                <MultiChoice
                  label={t('common:reports_track_parts')}
                  inputId="report-track-part"
                  items={(meta.data?.meta.track_part || []).map(it => ({
                    key: it.value,
                    value: it.value,
                  }))}
                  resetFilters={state.resetFilters}
                  onChange={e => {
                    setState(
                      R.assocPath(
                        ['queryVariables', 'raportti', 'track_part'],
                        takeOptionValues(e.target.selectedOptions),
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
                  items={(meta.data?.meta.tilirataosanumero || []).map(it => ({
                    key: it.value,
                    value: it.value,
                  }))}
                  resetFilters={state.resetFilters}
                  onChange={e => {
                    setState(
                      R.assocPath(
                        ['queryVariables', 'raportti', 'tilirataosanumero'],
                        takeOptionValues(e.target.selectedOptions),
                      ),
                    );
                    setState(R.assoc('resetFilters', false));
                  }}
                />
              </section>

              <footer className="pt-4">
                {/* Search controls for doing the search, reset */}
                <div className="space-x-2">
                  <Button label={t('common:search')} onClick={doSearch} />
                  <Button label={t('common:clear')} onClick={resetSearch} />
                </div>
              </footer>
            </div>
          </section>

          <section className="col-span-2">
            <header className="text-3xl border-b-2 border-gray-500 mb-4 pb-2"></header>

            {raporttiQuery.data && (
              <>
                <section className={clsx(css.subSection)}>
                  <MultiChoice
                    label={t('common:choose_columns')}
                    inputId="column-choice"
                    items={raporttiQuery.loading ? [] : columnChoices}
                    resetFilters={state.resetFilters || raporttiQuery.loading}
                    optionClassName="h-48"
                    onChange={e => {
                      setState(
                        R.assocPath(
                          ['queryVariables', 'columns'],
                          takeOptionValues(e.target.selectedOptions),
                        ),
                      );
                      setState(R.assoc('resetFilters', false));
                    }}
                    sortFn={(a, b) => a.key.localeCompare(b.key)}
                  />
                </section>
                <section className={clsx(css.subSection)}>
                  <MultiChoice
                    label={t('common:choose_reports')}
                    inputId="keys-choice"
                    items={(raporttiQuery.loading
                      ? []
                      : raporttiQuery.data.search_raportti.raportti || []
                    )
                      .filter(raportti => raportti.key && raportti.file_name)
                      .map(raportti => ({
                        key: `${raportti.file_name} ${raportti.inspection_date}`,
                        value: raportti.key?.toString()!,
                      }))}
                    resetFilters={state.resetFilters || raporttiQuery.loading}
                    optionClassName="h-48"
                    onChange={e => {
                      setState(
                        R.assocPath(
                          ['queryVariables', 'raportti_keys'],
                          takeOptionValues(e.target.selectedOptions),
                        ),
                      );
                      setState(R.assoc('resetFilters', false));
                    }}
                  />
                </section>
                <Button
                  label={t('common:search_csv')}
                  onClick={triggerCountSearch}
                />
              </>
            )}

            {!raporttiQuery.loading &&
              raporttiQuery.data &&
              !mittausCountQuery.loading &&
              mittausCountQuery.data &&
              mittausCountQuery.data.search_mittaus_count.status ===
                'size_limit' && <div>TODO: size limit reached</div>}

            {!raporttiQuery.loading &&
              raporttiQuery.data &&
              !mittausCountQuery.loading &&
              mittausCountQuery.data &&
              mittausCountQuery.data.search_mittaus_count &&
              mittausCountQuery.data.search_mittaus_count.status === 'ok' && (
                <>
                  <div>
                    <div className="mt-1">
                      {t('common:csv_row_count', {
                        count:
                          mittausCountQuery.data.search_mittaus_count.row_count,
                      })}
                    </div>
                    <div>
                      {t('common:csv_size_estimate', {
                        sizeEstimate: sizeformatter(
                          mittausCountQuery.data.search_mittaus_count
                            .size_estimate,
                        ),
                      })}
                    </div>
                  </div>

                  <CsvDownload
                    resetState={
                      raporttiQuery.loading ||
                      state.resetFilters ||
                      mittausCountQuery.loading
                    }
                    queryVariables={state.queryVariables}
                  />
                </>
              )}
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
  resetFilters: boolean;
  debug?: boolean;
  queryVariables: Search_Mittaus_CountQueryVariables;
};
