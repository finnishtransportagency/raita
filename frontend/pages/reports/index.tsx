/**
 * @todo Handle empty search queries
 * @todo Handle form data validation
 */
import { useState, useMemo, Fragment, useEffect } from 'react';
import { useRouter } from 'next/router';
import * as R from 'rambda';
import { i18n, useTranslation } from 'next-i18next';
import { clsx } from 'clsx';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

// TODO: this could be loaded dynamically using filename from config
import * as cfg from 'shared/config';
import { App, BannerType, ImageKeys, RaitaNextPage, Range } from 'shared/types';
import { sizeformatter, takeOptionValues } from 'shared/util';

import { makeFromMulti, makeQuery } from 'shared/query-builder';
import { Button, TextInput, CopyToClipboard } from 'components';
import { DateRange } from 'components';
import FilterSelector from 'components/filters';
import { Entry } from 'components/filters/selector';
import MultiChoice from 'components/filters/multi-choice';
import ResultsPager from 'components/results-pager';
import LoadingOverlay from 'components/loading-overlay';
import InfoBanner from 'components/infobanner';

import { useMetadataQuery, useSearch, useFileQuery } from '../../shared/hooks';
import css from './reports.module.css';
import { getFile, getImageKeysForFileKey } from 'shared/rest';
import { ZipDownload } from 'components/zip-download';

import { RaitaRole, useUser } from 'shared/user';
import { Tooltip } from 'react-tooltip';
import { gql, useLazyQuery } from '@apollo/client';

//

const initialState: ReportsState = {
  text: '',
  filters: {},
  filter: [],
  resetFilters: false,
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
    page: 1,
  },
  debug: false,
  waitingToUpdateMutation: false,
};

//
const SEARCH = gql`
  query search($file_name: String) {
    search_raportti(file_name: $file_name) {
      id
      file_name
      key
    }
  }
`;
const HELLO_WORLD = gql`
  query hello {
    hello
  }
`;

const ReportsIndex: RaitaNextPage = () => {
  const { t } = useTranslation(['common', 'metadata']);
  const meta = useMetadataQuery();
  const router = useRouter();

  const user = useUser();
  const [
    getSearch,
    { loading: searchLoading, error: searchError, data: searchData },
  ] = useLazyQuery(SEARCH);
  const isDebug = !!(router.query['debug'] === '1');

  const [state, setState] = useState<ReportsState>(initialState);
  const [imageKeys, setImageKeys] = useState<ImageKeys[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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
          paging: { curPage: state.paging.page, size: cfg.paging.pageSize },
        },
        Object.values(state.subQueries).filter(x => !R.isEmpty(x)),
        state.text,
      ),
    [
      newFilters,
      reportTypeFilter,
      state.subQueries,
      state.paging.page,
      state.text,
    ],
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

  const doSearch = () => {
    setState(R.assocPath(['paging', 'page'], 1));
    setState(R.assocPath(['waitingToUpdateMutation'], true));
    getSearch({ variables: { file_name: state.text } });
  };

  const resetSearch = () => {
    setState(() => JSON.parse(JSON.stringify(initialState)) as ReportsState);
    setState(R.assoc('resetFilters', true));
    mutation.reset();
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

  const resultsData = mutation.data;

  useEffect(() => {
    const fileKeys = resultsData?.hits.map(x => x.source.key);
    if (fileKeys?.length) {
      fileKeys.map(async fileKey => {
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
    if (state.waitingToUpdateMutation) {
      mutation.mutate(query);
      setState(R.assoc('waitingToUpdateMutation', false));
    }
  }, [state.waitingToUpdateMutation]);

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

  const setPage = (n: number) => {
    setState(R.assocPath(['paging', 'page'], n));
    setState(R.assocPath(['waitingToUpdateMutation'], true));
  };

  /**
   * Check whether any of our queries/mutations are loading,
   * so that we can do things like disable UI controls.
   */
  const isLoading = [meta.isLoading, mutation.isLoading].some(R.identity);

  if (meta.isLoading || !meta.data) return <LoadingOverlay />;

  if (meta.isError) return <div>Error</div>;

  const showAdminFields =
    user.user && user.user.roles.includes(RaitaRole.Admin);
  const zipFileNameIndex = cfg.zipFileNameIndex;

  // some fields are hidden on non-admin users
  const adminOnlyMetadataFields = ['parser_version'];

  return (
    <div className={clsx(css.root, isLoading && css.isLoading)}>
      <InfoBanner
        bannerType={BannerType.INFO}
        text={t('common:rights_restriction_info')}
      />

      <ul>
        {searchData &&
          searchData.search_raportti &&
          searchData.search_raportti.map(
            (
              raportti: any, // TODO: typing?
            ) => <li key={raportti.id}>{raportti.key}</li>,
          )}
      </ul>

      <div className="container mx-auto px-16 py-6">
        {resultsData?.total && resultsData.total >= 10000 && (
          <InfoBanner
            bannerType={BannerType.WARNING}
            text={t('common:too_many_results')}
            className="object-right w-4/6 ml-auto rounded"
          />
        )}

        <div className="grid grid-cols-3 gap-12">
          <section className="space-y-4">
            <header className="text-3xl border-primary border-b-2 mb-4 pb-2">
              {t('common:reports_search')}
            </header>

            <TextInput
              onUpdate={updateSearchText}
              value={state.text}
              placeholder={t('common:search_by_filename')}
              resetSearchText={state.resetFilters}
            />

            <div className="space-y-4 divide-y-2 divide-main-gray-10">
              <section className={clsx(css.subSection)}>
                <header>{t('common:reports_metadata')}</header>

                <FilterSelector
                  filters={[]}
                  onChange={updateFilterList}
                  fields={meta.data?.fields!}
                  resetFilterSelector={state.resetFilters}
                />
              </section>

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
                  label={t('common:reports_report_types')}
                  inputId="report-type"
                  items={(meta.data?.reportTypes || []).map(it => ({
                    key: it.reportType,
                    value: it.reportType,
                  }))}
                  resetFilters={state.resetFilters}
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
                    setState(R.assoc('resetFilters', false));
                  }}
                />
              </section>

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

              {/* Search file types */}
              <section className={clsx(css.subSection)}>
                <header></header>

                <MultiChoice
                  label={t('common:reports_file_types')}
                  inputId="report-file-type"
                  items={(meta.data?.fileTypes || []).map(x => ({
                    key: x.fileType,
                    value: x.fileType,
                  }))}
                  resetFilters={state.resetFilters}
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
              {!mutation.data && t('no_search_results')}

              {mutation.data && (
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
              )}
            </header>

            <section>
              {!resultsData && <div>{t('common:no_results')}</div>}

              {mutation.isSuccess && mutation.data && (
                <div>
                  <ul className="space-y-2 divide-y-2">
                    {resultsData?.hits.map((it, ix) => {
                      const { source: doc } = it;
                      const zipPath = doc.key
                        .split('/')
                        .slice(0, zipFileNameIndex)
                        .join('/');

                      // Bail out if we have nothing
                      if (!doc) return null;

                      return (
                        <li key={`result-${ix}`}>
                          <article className="py-2 space-y-2">
                            <header>{doc.file_name}</header>

                            <div className="text-xs">
                              {showAdminFields && (
                                <dl className={clsx(css.keyMetadataContainer)}>
                                  <dt>
                                    {t('common:zip_path_label')}
                                    <CopyToClipboard
                                      tooltipId={`${doc.key}-zip-label`}
                                      textToCopy={zipPath}
                                    />
                                  </dt>
                                  <dd
                                    className="truncate"
                                    data-tooltip-id={`${ix}-zip-name`}
                                    data-tooltip-content={zipPath}
                                  >
                                    {zipPath}
                                    <Tooltip id={`${ix}-zip-name`} />
                                  </dd>
                                </dl>
                              )}
                              <dl className={clsx(css.metadataGrid)}>
                                {Object.entries(doc.metadata)
                                  .filter(
                                    ([k, v]) =>
                                      !adminOnlyMetadataFields.includes(k) ||
                                      showAdminFields,
                                  )
                                  .map(([k, v], index) => (
                                    <Fragment key={index}>
                                      <dt className="truncate">
                                        {t(`metadata:label_${k}`)}
                                      </dt>
                                      <dd className="truncate">
                                        <span
                                          data-tooltip-id={`${doc.key}_val_${k}`}
                                          data-tooltip-content={v}
                                        >
                                          {`${v}`}
                                        </span>
                                      </dd>
                                      <Tooltip id={`${doc.key}_val_${k}`} />
                                    </Fragment>
                                  ))}
                                {doc.size && (
                                  <Fragment>
                                    <dt
                                      className="truncate"
                                      title={t('metadata:label_size')}
                                    >
                                      {t('metadata:label_size')}
                                    </dt>
                                    <dd
                                      className="truncate"
                                      title={`${sizeformatter(doc.size)}`}
                                    >
                                      <span
                                        data-tooltip-id={`${doc.key}_val_size`}
                                        data-tooltip-content={`${sizeformatter(
                                          doc.size,
                                        )}`}
                                      >
                                        {`${sizeformatter(doc.size)}`}
                                      </span>
                                      <Tooltip id={`${doc.key}_val_size`} />
                                    </dd>
                                  </Fragment>
                                )}
                              </dl>
                            </div>

                            <footer className="text-right space-x-2">
                              {imageKeys.find(
                                imageKey => imageKey.fileKey === doc.key,
                              ) && (
                                <Button
                                  size="sm"
                                  label={t('common:show_images')}
                                  onClick={() => handleLightBox(doc.key)}
                                />
                              )}

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

              <footer className="space-y-2 flex justify-center mt-2">
                {mutation.isSuccess && (
                  <ResultsPager
                    currentPage={state.paging.page}
                    itemCount={mutation.data?.total || 0}
                    pageSize={state.paging.size}
                    onGotoPage={setPage}
                  />
                )}
              </footer>
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

      {isDebug && (
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
      )}
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
  text: string;
  filters: Record<string, string>;
  filter: Entry[];
  resetFilters: boolean;
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
  waitingToUpdateMutation: boolean;
};

type ReportFilters = Record<string, string>;
