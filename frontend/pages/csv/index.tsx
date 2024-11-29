import { useState } from 'react';
import * as R from 'rambda';
import { i18n, useTranslation } from 'next-i18next';
import { clsx } from 'clsx';

import { App, BannerType, RaitaNextPage, Range } from 'shared/types';
import { sizeformatter, takeOptionValues } from 'shared/util';

import { Button, TextInput } from 'components';
import { DateRange } from 'components';
import FilterSelector from 'components/filters-graphql';
import { getInputVariablesFromEntries } from 'components/filters-graphql/utils';
import MultiChoice from 'components/filters/multi-choice';
import LoadingOverlay from 'components/loading-overlay';
import InfoBanner from 'components/infobanner';

import css from '../reports/reports.module.css';

import { RaitaRole } from 'shared/user';
import { useLazyQuery, useQuery } from '@apollo/client';
import {
  DateTimeIntervalInput,
  Generate_Mittaus_CsvMutationVariables,
  MittausCombinationLogic,
  RaporttiInput,
  Search_Mittaus_CountQueryVariables,
} from 'shared/graphql/__generated__/graphql';
import {
  MITTAUS_META,
  SEARCH_CSV_RAPORTTI_DETAILS,
  SEARCH_MITTAUS_COUNT,
} from 'shared/graphql/queries/csv';
import { CsvDownload } from 'components/csv-download';
import {
  SelectorSupportedType,
  FieldDict,
} from 'components/filters-graphql/selector';

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
  csvGenerationsSettings: {
    mittausCombinationLogic: MittausCombinationLogic.GeoviiteRataosoiteRounded,
  },
  extraRaporttiQueryVariables: {},
  mittausCountIsFresh: false,
  hideSearchResults: true,
};

/**
 * Fields that should not be shown in extra fields dropdown
 */
const disabledExtraFields = [
  // These have dedicated inputs:
  'file_name',
  'inspection_date',
  'inspection_datetime',
  'system',
  'track_part',
  'tilirataosanumero',
  'file_type',
  // these are not relevant for csv:
  'temperature',
  'measurement_start_location',
  'measurement_end_location',
  'km_start',
  'km_end',
  'maintenance_area',
  'report_category',
  'report_type',
  'measurement_direction',
  'maintenance_level',
  'is_empty',
];

const getQueryVariables = (state: CsvState) => {
  return {
    ...state.queryVariables,
    raportti: {
      ...state.queryVariables.raportti,
      ...state.extraRaporttiQueryVariables,
    },
    mittaus: {
      ...state.queryVariables.mittaus,
      rata_kilometri: state.queryVariables.mittaus.rata_kilometri ?? null,
    },
  };
};

const getCsvGenerationVariables: (
  state: CsvState,
) => Generate_Mittaus_CsvMutationVariables = (state: CsvState) => {
  const queryVariables = getQueryVariables(state);
  return { ...queryVariables, settings: state.csvGenerationsSettings };
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

  const doSearch = async () => {
    setState(R.assocPath(['queryVariables', 'columns'], []));
    await triggerRaporttiSearch({
      variables: {
        ...getQueryVariables(state),
        page: 1,
        page_size: 1000, // TODO: we want all?
      },
    });
    setState(R.assocPath(['hideSearchResults'], false));
  };

  const resetSearch = () => {
    setState(() => JSON.parse(JSON.stringify(initialState)) as CsvState);
    setState(R.assoc('resetFilters', true));
    setState(R.assoc('hideSearchResults', true));
  };

  const setMittausCountIsFresh = (fresh: boolean) => {
    setState(R.assocPath(['mittausCountIsFresh'], fresh));
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

  const triggerCountSearch = async () => {
    await triggerMittausCountSearch({ variables: getQueryVariables(state) });
    setMittausCountIsFresh(true);
  };

  const raporttiQueryIsLoading = raporttiQuery.loading;
  const showRaporttiResults =
    !state.hideSearchResults &&
    !raporttiQueryIsLoading &&
    !!raporttiQuery.data?.search_raportti;
  const showRaporttiQueryError = !raporttiQueryIsLoading && raporttiQuery.error;

  const mittausQueryIsLoading = mittausCountQuery.loading;

  const mittausCountResponseExists =
    !mittausQueryIsLoading &&
    !!mittausCountQuery.data &&
    !!mittausCountQuery.data.search_mittaus_count;

  const showMittausCountResults =
    showRaporttiResults &&
    mittausCountResponseExists &&
    mittausCountQuery.data?.search_mittaus_count.status === 'ok';
  const showStaleMittausCountWarning =
    !state.mittausCountIsFresh && showMittausCountResults;

  const showMittausCountSizeLimit =
    showRaporttiResults &&
    mittausCountResponseExists &&
    mittausCountQuery.data?.search_mittaus_count.status === 'size_limit';

  const showMittausCountError =
    !mittausQueryIsLoading && !!mittausCountQuery.error;

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
  console.log(state.queryVariables);
  const extraFields: FieldDict = {};
  meta.data?.meta.input_fields?.forEach(fieldInfo => {
    if (!fieldInfo.name) {
      return;
    }
    if (disabledExtraFields.includes(fieldInfo.name)) {
      return;
    }
    extraFields[fieldInfo.name] = {
      type: fieldInfo.type! as SelectorSupportedType,
    };
  });
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
    )
    .concat([{ key: 'ajonopeus', value: 'ajonopeus' }]);
  console.log('MITTAUSSYSTEMS: ', mittausSystems);
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
                <FilterSelector
                  filters={[]}
                  onChange={entries => {
                    const inputVariables =
                      getInputVariablesFromEntries(entries);
                    // replace the whole
                    setState(
                      R.assocPath(
                        ['extraRaporttiQueryVariables'],
                        inputVariables,
                      ),
                    );
                    setMittausCountIsFresh(false);
                  }}
                  fields={extraFields}
                  resetFilterSelector={state.resetFilters}
                />
              </section>

              {/* Search date range */}
              <section className={clsx(css.subSection)}>
                <header>{t('common:reports_timespan')}</header>

                <DateRange
                  range={inspectionDateRangeForSelector}
                  onUpdate={range => {
                    updateDateRange(range);
                    setMittausCountIsFresh(false);
                  }}
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
                    setMittausCountIsFresh(false);
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
                    setMittausCountIsFresh(false);
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
                    setMittausCountIsFresh(false);
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
            <header className="text-3xl border-b-2 border-gray-500 mb-4 pb-2 pt-9"></header>

            {raporttiQueryIsLoading && <p>{t('common:loading')}</p>}
            {showRaporttiQueryError && <p>{t('common:error_loading')}</p>}

            {showRaporttiResults && (
              <>
                <section className={clsx(css.subSection)}>
                  <header>{t('common:csv_filter_header')}</header>
                  <FilterSelector
                    filters={[]}
                    onChange={entries => {
                      const inputVariables =
                        getInputVariablesFromEntries(entries);

                      setState(
                        R.assocPath(
                          ['queryVariables', 'mittaus'],
                          inputVariables,
                        ),
                      );
                      setMittausCountIsFresh(false);
                    }}
                    fields={{
                      rata_kilometri: { type: 'IntIntervalInput' },
                    }}
                    resetFilterSelector={state.resetFilters}
                  />
                </section>
                <section>
                  <header>
                    {t('common:csv_mittaus_combination_logic_header')}
                  </header>
                  <label className="block">
                    <input
                      type="radio"
                      value={MittausCombinationLogic.GeoviiteRataosoiteRounded}
                      checked={
                        state.csvGenerationsSettings.mittausCombinationLogic ===
                        MittausCombinationLogic.GeoviiteRataosoiteRounded
                      }
                      onChange={() =>
                        setState(
                          R.assocPath(
                            [
                              'csvGenerationsSettings',
                              'mittausCombinationLogic',
                            ],
                            MittausCombinationLogic.GeoviiteRataosoiteRounded,
                          ),
                        )
                      }
                    />
                    {t('csv_combination_logic_geoviite_rataosoite_rounded')}
                  </label>
                  <label className="block">
                    <input
                      type="radio"
                      value={MittausCombinationLogic.MeeriRataosoite}
                      checked={
                        state.csvGenerationsSettings.mittausCombinationLogic ===
                        MittausCombinationLogic.MeeriRataosoite
                      }
                      onChange={() =>
                        setState(
                          R.assocPath(
                            [
                              'csvGenerationsSettings',
                              'mittausCombinationLogic',
                            ],
                            MittausCombinationLogic.MeeriRataosoite,
                          ),
                        )
                      }
                    />
                    {t('csv_combination_logic_meeri_rataosoite')}
                  </label>
                </section>
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
                      setMittausCountIsFresh(false);
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
                      : raporttiQuery.data?.search_raportti.raportti || []
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
                      setMittausCountIsFresh(false);
                    }}
                  />
                </section>
                <Button
                  label={t('common:search_csv')}
                  onClick={triggerCountSearch}
                />
              </>
            )}
            {mittausQueryIsLoading && <p>{t('common:loading')}</p>}
            {showStaleMittausCountWarning && (
              <p>{t('common:stale_mittaus_count')}</p>
            )}
            {showMittausCountError && <p>{t('common:error_loading')}</p>}
            {showMittausCountSizeLimit && <p>{t('common:error_size_limit')}</p>}

            {showMittausCountResults && (
              <>
                <div>
                  <div className="mt-1">
                    {t('common:csv_row_count', {
                      count:
                        mittausCountQuery.data?.search_mittaus_count
                          .row_count ?? NaN,
                    })}
                  </div>
                  <div>
                    {t('common:csv_size_estimate', {
                      sizeEstimate: sizeformatter(
                        mittausCountQuery.data?.search_mittaus_count
                          .size_estimate ?? NaN,
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
                  queryVariables={getCsvGenerationVariables(state)}
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
  csvGenerationsSettings: Generate_Mittaus_CsvMutationVariables['settings'];
  /**
   * For "extra variables" that are chosen separately from the filter selectors.
   * Separate variable to simplify state management on deletions
   */
  extraRaporttiQueryVariables: RaporttiInput;
  mittausCountIsFresh: boolean;
  /**
   * Use this to hide search results when query contains old data after UI inputs are reset
   */
  hideSearchResults: boolean;
};
