import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Accordion,
  AccordionItem,
  AccordionItemButton,
  AccordionItemHeading,
  AccordionItemPanel,
} from 'react-accessible-accordion';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import css from './log_accordion.module.css';
import {
  AdminLogSummaryRow,
  AdminLogsSummaryResponse,
  Range,
  SingleEventAdminLogsResponse,
} from 'shared/types';
import clsx from 'clsx';
import format from 'date-fns/format';
import { getAdminLogsSummary, getSingleEventAdminLogs } from 'shared/rest';
import {
  ADMIN_LOG_PAGE_SIZE,
  ADMIN_LOG_SUMMARY_PAGE_SIZE,
} from 'shared/constants';
import ResultsPager from 'components/results-pager';
import LogView from 'components/log_view';

type Props = {
  type: 'delete' | 'data-process';
  dateRange: Range<Date>;
  forceFetch: boolean;
};

const EVENT_ID_SEPARATOR = '$';
/**
 * Create a unique eventId that is needed by Accordion
 */
function makeEventId(logDate: string, invocationId: string, sources: string[]) {
  const id = `${logDate}${EVENT_ID_SEPARATOR}${invocationId}${EVENT_ID_SEPARATOR}${sources.join(
    ',',
  )}`;
  return encodeURIComponent(id);
}

/**
 * Get components back from eventId
 */
function separateEventId(eventId: string) {
  const id = decodeURIComponent(eventId);
  const [logDate, invocationId, sources] = id.split(EVENT_ID_SEPARATOR, 3);
  return { logDate, invocationId, sources: sources.split(',') };
}

function rowContainsErrors(
  row: AdminLogSummaryRow,
  type: 'delete' | 'data-process',
) {
  if (type === 'delete') {
    return row.counts['delete-process']?.error > 0;
  }
  return (
    row.counts['data-reception']?.error > 0 ||
    row.counts['data-inspection']?.error > 0
  );
}

function rowContainsWarnings(
  row: AdminLogSummaryRow,
  type: 'delete' | 'data-process',
) {
  if (type === 'delete') {
    return row.counts['delete-process']?.warn > 0;
  }
  return (
    row.counts['data-reception']?.warn > 0 ||
    row.counts['data-inspection']?.warn > 0
  );
}
function rowIsEmpty(row: AdminLogSummaryRow, type: 'delete' | 'data-process') {
  if (row.counts['data-inspection']) {
    return (
      row.counts['data-inspection'].info === 0 &&
      row.counts['data-inspection'].warn === 0 &&
      row.counts['data-inspection'].error === 0
    );
  } else return type === 'data-process' && !!row.counts['data-inspection'];
}

/**
 * Fetch and show log rows for one event in an accordion item
 */
const LogAccordion = ({ type, dateRange, forceFetch }: Props) => {
  const { t } = useTranslation(['common', 'admin']);

  const [logSummary, setLogSummary] = useState<AdminLogsSummaryResponse>({
    totalSize: 0,
    pageSize: 0,
    pageIndex: 0,
    stats: [],
    summaryRows: [],
  });
  const [summaryPageIndex, setSummaryPageIndex] = useState(0);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // keep track of which events are active/open
  // detailed logs are fetched only for active events
  const [activeEvents, setActiveEvents] = useState<
    { eventId: string; pageIndex: number }[]
  >([]);
  const [eventLogs, setEventLogs] = useState<{
    [eventId: string]: SingleEventAdminLogsResponse;
  }>({});

  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [showWarningsOnly, setShowWarningsOnly] = useState(false);
  const [showEmptyOnly, setShowEmptyOnly] = useState(false);
  const [showWarnedFilesOnly, setShowWarnedFilesOnly] = useState(false);
  const [showErroredFilesOnly, setShowErroredFilesOnly] = useState(false);

  useEffect(() => {
    if (forceFetch) {
      fetchLogSummary();
    }
  }, [forceFetch, summaryPageIndex]);

  const fetchLogSummary = async () => {
    if (!dateRange.start || !dateRange.end) {
      setErrorMessage(t('common:error.date_range_missing'));
      return;
    }
    setSummaryLoading(true);
    const startDate = format(dateRange.start, 'yyyy-MM-dd');
    const endDate = format(dateRange.end, 'yyyy-MM-dd');
    try {
      await getAdminLogsSummary(
        startDate,
        endDate,
        sources,
        ADMIN_LOG_SUMMARY_PAGE_SIZE,
        summaryPageIndex,
      ).then(receivedLogs => {
        setLogSummary(receivedLogs);
        setSummaryLoading(false);
        setErrorMessage('');
      });
    } catch (error) {
      const message = t('common:error_loading');
      setErrorMessage(message);
    }
  };

  const sources =
    type === 'delete'
      ? ['delete-process']
      : ['data-inspection', 'data-reception'];

  useEffect(() => {
    const changed = activeEvents.filter(({ eventId, pageIndex }) => {
      if (!eventLogs[eventId]) {
        return true;
      }
      return eventLogs[eventId].pageIndex !== pageIndex;
    });
    const fetches = changed.map(async ({ eventId, pageIndex }) => {
      const { logDate, invocationId, sources } = separateEventId(eventId);
      const response = await getSingleEventAdminLogs(
        logDate,
        invocationId,
        sources,
        ADMIN_LOG_PAGE_SIZE,
        pageIndex,
      );
      return { eventId, logs: response };
    });
    const newEventLogs = { ...eventLogs };
    Promise.all(fetches).then(responses => {
      responses.forEach(res => (newEventLogs[res.eventId] = res.logs));
      setEventLogs(newEventLogs);
    });
  }, [activeEvents]);

  const onOpenStateChange = (eventIds: string[]) => {
    const newlyOpenedIds = eventIds.filter(
      newId =>
        activeEvents.find(active => active.eventId === newId) === undefined,
    );
    const newElements = newlyOpenedIds.map(eventId => ({
      eventId,
      pageIndex: 0,
    }));
    setActiveEvents([...activeEvents, ...newElements]);
  };

  const summaryRowsToShow = logSummary.summaryRows.filter(row => {
    const containsErrors = rowContainsErrors(row, type);
    const containsWarnings = rowContainsWarnings(row, type);
    const isEmpty = rowIsEmpty(row, type);

    return (
      (!showErrorsOnly || containsErrors) &&
      (!showWarningsOnly || containsWarnings) &&
      (!showEmptyOnly || isEmpty)
    );
  });

  return (
    <>
      {errorMessage && <p>{errorMessage}</p>}
      {!errorMessage && summaryLoading && <p>{t('common:loading')}</p>}
      {logSummary.summaryRows.length === 0 && (
        <div>{t('common:no_results')}</div>
      )}
      {!summaryLoading &&
        !errorMessage &&
        logSummary.summaryRows.length > 0 && (
          <>
            <div className="block py-4 flex flex-col">
              <label>
                <input
                  className="mx-1"
                  type="checkbox"
                  checked={showErrorsOnly}
                  onChange={e => setShowErrorsOnly(e.currentTarget.checked)}
                />
                {t('admin:log_show_only_errors')}
              </label>
              <label>
                <input
                  className="mx-1"
                  type="checkbox"
                  checked={showWarningsOnly}
                  onChange={e => setShowWarningsOnly(e.currentTarget.checked)}
                />
                {t('admin:log_show_only_warnings')}
              </label>
              <label>
                <input
                  className="mx-1"
                  type="checkbox"
                  checked={showEmptyOnly}
                  onChange={e => setShowEmptyOnly(e.currentTarget.checked)}
                />
                {t('admin:log_show_only_empty')}
              </label>
            </div>
            <p>{`${t('admin:log_total_events')}: ${logSummary.totalSize}`}</p>
            <p>{`${t('admin:log_error_events')}: ${
              logSummary.stats.find(row => row.log_level === 'error')
                ?.event_count ?? 0
            }`}</p>
            <p>{`${t('admin:log_summary_current_page_count')}: ${
              summaryRowsToShow.length
            }`}</p>
            <ResultsPager
              currentPage={summaryPageIndex + 1}
              itemCount={logSummary.totalSize}
              pageSize={ADMIN_LOG_SUMMARY_PAGE_SIZE}
              onGotoPage={i => setSummaryPageIndex(i - 1)}
            />
            <Accordion
              allowMultipleExpanded
              allowZeroExpanded
              onChange={eventIds => onOpenStateChange(eventIds as string[])}
            >
              {summaryRowsToShow.map(logSummary => {
                const headerDateTime = format(
                  new Date(logSummary.start_timestamp),
                  'dd.MM.yyyy HH:mm',
                );
                const eventId = makeEventId(
                  logSummary.log_date,
                  logSummary.invocation_id,
                  sources,
                );
                const containsErrors = rowContainsErrors(logSummary, type);
                const containsWarnings = rowContainsWarnings(logSummary, type);
                const titleKey =
                  type === 'delete'
                    ? 'admin:log_header_delete_process'
                    : 'admin:log_header_data_process';
                const noFilesHandled =
                  type === 'data-process' &&
                  (!logSummary.counts['data-inspection'] ||
                    (logSummary.counts['data-inspection'].info === 0 &&
                      logSummary.counts['data-inspection'].warn === 0 &&
                      logSummary.counts['data-inspection'].error === 0));
                return (
                  <AccordionItem
                    className="border border-gray-300 rounded-lg p-2 my-2"
                    key={eventId}
                    uuid={eventId}
                  >
                    <AccordionItemHeading>
                      <AccordionItemButton
                        className={clsx(css.accordionButton)}
                      >
                        <FontAwesomeIcon
                          className={`${clsx(css.downArrow)} mx-3`}
                          icon={faChevronDown}
                        />
                        {`${headerDateTime} ${t(titleKey)}: ${
                          logSummary.invocation_id
                        }`}
                        {containsErrors && (
                          <span className="nowrap px-1 py-1 m-1 rounded-xl bg-error font-bold">
                            {t('admin:log_contains_errors')}
                          </span>
                        )}
                        {containsWarnings && (
                          <span className="px-1 py-1 m-1 rounded-xl bg-warn font-bold">
                            {t('admin:log_contains_warnings')}
                          </span>
                        )}
                        {noFilesHandled && (
                          <span className="px-1 py-1 m-1 rounded-xl bg-error font-bold">
                            {t('admin:log_no_files_handled')}
                          </span>
                        )}
                      </AccordionItemButton>
                    </AccordionItemHeading>
                    <AccordionItemPanel
                      className={`${clsx(css.logContainer)} bg-slate-100`}
                    >
                      {!eventLogs[eventId] ? (
                        <p>{t('common:loading')}</p>
                      ) : (
                        <>
                          <ResultsPager
                            currentPage={
                              (eventLogs[eventId]?.pageIndex ?? 0) + 1
                            }
                            itemCount={eventLogs[eventId]?.totalSize}
                            pageSize={ADMIN_LOG_PAGE_SIZE}
                            onGotoPage={i =>
                              setActiveEvents(
                                activeEvents.map(event => {
                                  if (event.eventId === eventId) {
                                    return { eventId, pageIndex: i - 1 };
                                  }
                                  return event;
                                }),
                              )
                            }
                          />
                          <LogView eventLogs={eventLogs} eventId={eventId} />
                        </>
                      )}
                    </AccordionItemPanel>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </>
        )}
    </>
  );
};

export default LogAccordion;
