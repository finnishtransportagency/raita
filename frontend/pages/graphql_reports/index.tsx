import {
  useState,
  Fragment,
  useEffect,
  SyntheticEvent,
  useContext,
} from 'react';
import * as R from 'rambda';
import { i18n, useTranslation } from 'next-i18next';
import { clsx } from 'clsx';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

import * as cfg from 'shared/config';
import { App, BannerType, ImageKeys, RaitaNextPage, Range } from 'shared/types';
import { sizeformatter, takeOptionValues } from 'shared/util';

import { Button, TextInput, CopyToClipboard, Dropdown } from 'components';
import { DateRange } from 'components';
import FilterSelector from 'components/filters-graphql';
import MultiChoice from 'components/filters-graphql/multi-choice';
import ResultsPager from 'components/results-pager';
import LoadingOverlay from 'components/loading-overlay';
import InfoBanner from 'components/infobanner';

import { useFileQuery } from '../../shared/hooks';
import css from '../reports/reports.module.css';

import { getFile, getImageKeysForFileKey } from 'shared/rest';
import { ZipDownload } from 'components/zip-download-graphql';

import { RaitaRole, useUser } from 'shared/user';
import { Tooltip } from 'react-tooltip';
import { useLazyQuery, useQuery } from '@apollo/client';
import { META, SEARCH_RAPORTTI } from 'shared/graphql/queries/reports';
import {
  DateTimeIntervalInput,
  RaporttiInput,
  Search_RaporttiQueryVariables,
} from 'shared/graphql/__generated__/graphql';
import {
  FieldDict,
  SelectorSupportedType,
} from 'components/filters-graphql/selector';
import { getInputVariablesFromEntries } from 'components/filters-graphql/utils';
import { zipContext } from 'shared/zipContext';
import { PollingHandler } from 'components/pollingHandler';

//

const initialState: ReportsState = {
  resetFilters: false,
  debug: false,
  waitingToUpdateSearchQuery: false,
  queryVariables: { page: 1, page_size: cfg.paging.pageSize, raportti: {} },
  extraRaporttiQueryVariables: {},
};

/**
 * Fields that should not be shown in extra fields dropdown
 */
const disabledExtraFields = [
  'file_name',
  'inspection_date',
  'inspection_datetime',
  'system',
  'track_part',
  'tilirataosanumero',
  'file_type',
];

const getQueryVariables = (state: ReportsState) => {
  return {
    ...state.queryVariables,
    raportti: {
      ...state.queryVariables.raportti,
      ...state.extraRaporttiQueryVariables,
    },
  };
};

const ReportsIndex: RaitaNextPage = () => {
  const { t } = useTranslation(['common', 'metadata']);
  const meta = useQuery(META);
  const [triggerInitialSearch, searchQuery] = useLazyQuery(SEARCH_RAPORTTI);

  const user = useUser();
  const zipState = useContext(zipContext);
  const [state, setState] = useState<ReportsState>(initialState);
  const [imageKeys, setImageKeys] = useState<ImageKeys[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // S3 file URL endpoint mutation
  const getFileUrl = useFileQuery();

  // #endregion

  const doSearch = () => {
    setState(R.assocPath(['queryVariables', 'page'], 1));
    setState(R.assocPath(['waitingToUpdateSearchQuery'], true));
    triggerInitialSearch({
      variables: getQueryVariables(state),
    });
  };

  const resetSearch = () => {
    setState(() => JSON.parse(JSON.stringify(initialState)) as ReportsState);
    setState(R.assoc('resetFilters', true));
  };

  const handleImageUrlFetch = async (key: string) => {
    const keys = imageKeys.find(ik => ik.fileKey === key)?.imageKeys;
    if (!keys) return;
    return await Promise.all(keys.map(key => getFile(key).then(x => x.url)));
  };

  const handleLightBox = async (key: string) => {
    const imageUrls = await handleImageUrlFetch(key);
    if (imageUrls?.length) {
      setImageUrls(imageUrls);
      setLightboxOpen(true);
    }
  };

  const resultsData = searchQuery.data?.search_raportti;

  useEffect(() => {
    const fileKeys = resultsData?.raportti?.map(document => document.key) ?? [];
    if (fileKeys?.length) {
      fileKeys.forEach(async fileKey => {
        if (!fileKey) {
          return;
        }
        const fileImageKeys = await getImageKeysForFileKey(fileKey);
        if (!fileImageKeys.length) return;
        setImageKeys(prevImageKeys => [
          ...prevImageKeys,
          { fileKey, imageKeys: fileImageKeys },
        ]);
      });
    }
  }, [resultsData]);

  // make sure mutation is updated only after query object is changed
  useEffect(() => {
    if (state.waitingToUpdateSearchQuery) {
      searchQuery.refetch(getQueryVariables(state));
      setState(R.assoc('waitingToUpdateSearchQuery', false));
    }
  }, [state.waitingToUpdateSearchQuery]);

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
    // TODO: typing for setState is lost with R.assocPath
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

  const setPage = (n: number) => {
    setState(R.assocPath(['queryVariables', 'page'], n));
    setState(R.assocPath(['waitingToUpdateSearchQuery'], true));
  };
  const updateSort = (event: SyntheticEvent<HTMLSelectElement, Event>) => {
    setState(
      R.assocPath(
        ['queryVariables', 'order_by_variable'],
        event.currentTarget.value,
      ),
    );
    setState(R.assocPath(['waitingToUpdateSearchQuery'], true));
  };

  const handleChangePageSize = (newSize: number) => {
    setState(R.assocPath(['queryVariables', 'page_size'], newSize));
    setState(R.assocPath(['waitingToUpdateSearchQuery'], true));
  };

  /**
   * Check whether any of our queries/mutations are loading,
   * so that we can do things like disable UI controls.
   */
  const isLoading = [meta.loading, searchQuery.loading].some(R.identity);

  if (meta.loading || !meta.data) return <LoadingOverlay />;

  if (meta.error) return <div>Error</div>;

  const showAdminFields =
    user.user && user.user.roles.includes(RaitaRole.Admin);
  const zipFileNameIndex = cfg.zipFileNameIndex;

  // some fields are hidden on non-admin users
  const adminOnlyMetadataFields = ['parser_version'];
  const hiddenMetadataFields = ['__typename', 'key', 'file_name', 'status'];

  const inspectionDateRangeForSelector: Range<Date> = {
    // TODO: mapping function
    start: state.queryVariables.raportti.inspection_datetime?.start
      ? new Date(state.queryVariables.raportti.inspection_datetime.start)
      : undefined,
    end: state.queryVariables.raportti.inspection_datetime?.end
      ? new Date(state.queryVariables.raportti.inspection_datetime.end)
      : undefined,
  };

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
              {t('common:reports_search')}
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
                  onUpdate={updateDateRange}
                  resetDateRange={state.resetFilters}
                  inputId="reports-daterange"
                />
              </section>

              <section className={clsx(css.subSection)}>
                <MultiChoice
                  label={t('common:reports_report_types')}
                  inputId="report-type"
                  items={(meta.data.meta.report_type || []).map(it => ({
                    key: it.value,
                    value: it.value,
                  }))}
                  resetFilters={state.resetFilters}
                  onChange={e => {
                    setState(
                      R.assocPath(
                        ['queryVariables', 'raportti', 'report_type'],
                        takeOptionValues(e.target.selectedOptions),
                      ),
                    );
                    setState(R.assoc('resetFilters', false));
                  }}
                />
              </section>

              <section className={clsx(css.subSection)}>
                <MultiChoice
                  label={t('common:reports_systems')}
                  inputId="report-system"
                  items={(meta.data.meta.system || []).map(x => ({
                    key: i18n?.exists(`metadata:${x.value}`)
                      ? `${x.value} / ${t(`metadata:${x.value}`)}`
                      : x.value,
                    value: x.value,
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

              {/* Search file types */}
              <section className={clsx(css.subSection)}>
                <header></header>

                <MultiChoice
                  label={t('common:reports_file_types')}
                  inputId="report-file-type"
                  items={(meta.data?.meta.file_type || []).map(x => ({
                    key: x.value,
                    value: x.value,
                  }))}
                  resetFilters={state.resetFilters}
                  onChange={e => {
                    setState(
                      R.assocPath(
                        ['queryVariables', 'raportti', 'file_type'],
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
            <header className="text-3xl border-b-2 border-gray-500 mb-4 pb-2">
              {searchQuery.data &&
              resultsData?.total_size &&
              resultsData?.total_size > 0 ? (
                <div className="flex items-end">
                  <div className="mt-1">
                    {t('search_result_count', {
                      count: resultsData?.count,
                    })}
                  </div>

                  <div className="ml-2 flex">
                    {!localStorage.getItem('zipUrl') ? (
                      <ZipDownload
                        aggregationSize={resultsData?.count}
                        usedQueryVariables={getQueryVariables(state)}
                        resultTotalSize={resultsData?.total_size}
                      />
                    ) : (
                      <PollingHandler />
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-end">
                    <div className="mt-1">{t('common:no_results')}</div>
                    {localStorage.getItem('zipUrl') ||
                    zipState.state.isLoading ? (
                      <PollingHandler />
                    ) : null}
                  </div>
                </>
              )}

              <div>
                {resultsData && !(resultsData.count >= 0) && (
                  <div className="flex justify-between items-end">
                    <div className={css.headerRow + ' text-base'}>
                      <Dropdown
                        label={t('common:sort')}
                        items={[
                          {
                            key: t('metadata:label_inspection_datetime'),
                            value: 'inspection_datetime',
                          },
                          {
                            key: t('metadata:label_km_start'),
                            value: 'km_start',
                          },
                        ]}
                        onChange={updateSort}
                      />
                    </div>
                    <div className={css.headerRow}>
                      <div className="text-base my-2">
                        {t('common:show_results')}
                      </div>
                      <ul className={css.itemList}>
                        <li className={css.item}>
                          <Button
                            label={10}
                            onClick={() => handleChangePageSize(PageSize.Ten)}
                            type={
                              state.queryVariables.page_size == PageSize.Ten
                                ? 'primary'
                                : 'secondary'
                            }
                            size="sm"
                          />
                        </li>
                        <li className={css.item}>
                          <Button
                            label={25}
                            onClick={() =>
                              handleChangePageSize(PageSize.TwentyFive)
                            }
                            type={
                              state.queryVariables.page_size ==
                              PageSize.TwentyFive
                                ? 'primary'
                                : 'secondary'
                            }
                            size="sm"
                          />
                        </li>
                        <li className={css.item}>
                          <Button
                            label={50}
                            onClick={() => handleChangePageSize(PageSize.Fifty)}
                            type={
                              state.queryVariables.page_size == PageSize.Fifty
                                ? 'primary'
                                : 'secondary'
                            }
                            size="sm"
                          />
                        </li>
                      </ul>
                    </div>
                    <ResultsPager
                      currentPage={state.queryVariables.page}
                      itemCount={resultsData.count || 0}
                      pageSize={state.queryVariables.page_size}
                      onGotoPage={setPage}
                    />
                  </div>
                )}
              </div>
            </header>

            <section>
              {!resultsData && <div>{t('common:no_results')}</div>}

              {!searchQuery.error && searchQuery.data && (
                <div>
                  <ul className="space-y-2 divide-y-2">
                    {resultsData?.raportti?.map((document, index: number) => {
                      const zipPath =
                        document.key
                          ?.split('/')
                          .slice(0, zipFileNameIndex)
                          .join('/') ?? '';

                      // Bail out if we have nothing
                      if (!document) return null;

                      return (
                        <li key={`result-${index}`}>
                          <article className="py-2 space-y-2">
                            <header>{document.file_name}</header>

                            <div className="text-xs">
                              {showAdminFields && (
                                <dl className={clsx(css.keyMetadataContainer)}>
                                  <dt>
                                    {t('common:zip_path_label')}
                                    <CopyToClipboard
                                      tooltipId={`${document.key}-zip-label`}
                                      textToCopy={zipPath}
                                    />
                                  </dt>
                                  <dd
                                    className="truncate"
                                    data-tooltip-id={`${index}-zip-name`}
                                    data-tooltip-content={zipPath}
                                  >
                                    {zipPath}
                                    <Tooltip id={`${index}-zip-name`} />
                                  </dd>
                                </dl>
                              )}
                              <dl className={clsx(css.metadataGrid)}>
                                {Object.entries(document)
                                  .filter(
                                    ([k, v]) =>
                                      (!adminOnlyMetadataFields.includes(k) ||
                                        showAdminFields) &&
                                      !hiddenMetadataFields.includes(k) &&
                                      v != null,
                                  )
                                  .map(([k, v], index) => (
                                    <Fragment key={index}>
                                      <dt className="truncate">
                                        {t(`metadata:label_${k}`)}
                                      </dt>
                                      <dd className="truncate">
                                        <span
                                          data-tooltip-id={`${document.key}_val_${k}`}
                                          data-tooltip-content={`${v}`}
                                        >
                                          {`${v}`}
                                        </span>
                                      </dd>
                                      <Tooltip
                                        id={`${document.key}_val_${k}`}
                                      />
                                    </Fragment>
                                  ))}
                                {document.size && (
                                  <>
                                    <dt
                                      className="truncate"
                                      title={t('metadata:label_size')}
                                    >
                                      {t('metadata:label_size')}
                                    </dt>
                                    <dd
                                      className="truncate"
                                      title={`${sizeformatter(document.size)}`}
                                    >
                                      <span
                                        data-tooltip-id={`${document.key}_val_size`}
                                        data-tooltip-content={`${sizeformatter(
                                          document.size,
                                        )}`}
                                      >
                                        {`${sizeformatter(document.size)}`}
                                      </span>
                                      <Tooltip
                                        id={`${document.key}_val_size`}
                                      />
                                    </dd>
                                  </>
                                )}
                              </dl>
                            </div>

                            <footer className="text-right space-x-2">
                              {imageKeys.find(
                                imageKey => imageKey.fileKey === document.key,
                              ) && (
                                <Button
                                  size="sm"
                                  label={t('common:show_images')}
                                  onClick={() =>
                                    document.key && handleLightBox(document.key)
                                  }
                                />
                              )}

                              <Button
                                size="sm"
                                label={t('common:download')}
                                onClick={() => {
                                  if (!document.key || !document.file_name) {
                                    return;
                                  }
                                  const opts = {
                                    key: document.key,
                                    fileName: document.file_name,
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
            </section>
          </section>
        </div>
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={imageUrls.map((imageUrl, idx) => {
          return {
            src: imageUrl,
            alt: `Image(${idx + 1})`,
          };
        })}
      />
    </div>
  );
};

ReportsIndex.requiredRole = RaitaRole.Read;

export default ReportsIndex;

//

export type StaticProps = {
  locale: App.Locales;
};

type ReportsState = {
  resetFilters: boolean;
  debug?: boolean;
  waitingToUpdateSearchQuery: boolean;
  queryVariables: Search_RaporttiQueryVariables;
  /**
   * For "extra variables" that are chosen separately from the filter selectors.
   * Separate variable to simplify state management on deletions
   */
  extraRaporttiQueryVariables: RaporttiInput;
};

export enum PageSize {
  Ten = 10,
  TwentyFive = 25,
  Fifty = 50,
}

type ReportFilters = Record<string, string>;
