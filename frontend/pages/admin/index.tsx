/**
 * @todo Handle empty search queries
 * @todo Handle form data validation
 */
import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import { useTranslation } from 'next-i18next';
import { clsx } from 'clsx';
import {
  Accordion,
  AccordionItem,
  AccordionItemHeading,
  AccordionItemButton,
  AccordionItemPanel,
} from 'react-accessible-accordion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

import { AdminLogsResponse, Range } from 'shared/types';
import { getAdminLogs } from 'shared/rest';
import { subDays } from 'date-fns';
import format from 'date-fns/format';
import { Button, DateRange } from 'components';
import Head from 'next/head';
import css from './admin.module.css';

const AdminIndex: NextPage = () => {
  const { t } = useTranslation(['common', 'admin']);

  const defaultStartDate = subDays(new Date(), 7);
  const defaultEndDate = new Date();

  const [logs, setLogs] = useState<AdminLogsResponse['logs']>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<Range<Date>>({
    start: defaultStartDate,
    end: defaultEndDate,
  });
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    if (!dateRange.start) {
      // TODO show some error
      return;
    }
    if (!dateRange.end) {
      return;
    }
    setIsLoading(true);
    const startDate = format(dateRange.start, 'yyyy-MM-dd');
    const endDate = format(dateRange.end, 'yyyy-MM-dd');
    try {
      await getAdminLogs(startDate, endDate).then(receivedLogs => {
        setLogs(receivedLogs);
        setIsLoading(false);
        setErrorMessage('');
      });
    } catch (error) {
      const message = t('common:error_loading');
      setErrorMessage(message);
    }
  };

  // use both date part of timestamp and invocationId to group log rows
  const groupedLogs: {
    [constructedId: string]: AdminLogsResponse['logs'];
  } = {};
  logs.forEach(logRow => {
    const date = format(new Date(logRow.log_timestamp), 'yyyy-MM-dd');
    const constructedId = `${date}-${logRow.invocation_id}`;
    if (groupedLogs[constructedId]) {
      groupedLogs[constructedId].push(logRow);
    } else {
      groupedLogs[constructedId] = [logRow];
    }
  });
  // sort by timestamp
  Object.keys(groupedLogs).forEach(id => {
    groupedLogs[id].sort((a, b) =>
      a.log_timestamp.localeCompare(b.log_timestamp),
    );
  });
  const logGroupIds = Object.keys(groupedLogs);
  // sort by full timestamp of first log message
  logGroupIds.sort((a, b) =>
    groupedLogs[a][0].log_timestamp.localeCompare(
      groupedLogs[b][0].log_timestamp,
    ),
  );
  return (
    <div>
      {/* TODO: refactor header, footer into separate component and use here*/}
      <Head>
        <title>{t('admin:log_title')}</title>
      </Head>
      <div className="bg-primary text-white">
        <div className="container mx-auto px-16 py-6">
          <header>
            <h1 className="text-4xl">{t('admin:log_title')}</h1>{' '}
          </header>
        </div>
      </div>

      <div>
        <p>{t('admin:log_search_description')}</p>
        <DateRange
          range={dateRange}
          onUpdate={setDateRange}
          resetDateRange={false}
        />
        <Button label={t('common:search')} onClick={fetchLogs} />
      </div>
      {errorMessage && <p>{errorMessage}</p>}
      {!errorMessage && isLoading && <p>{t('common:loading')}</p>}
      {!isLoading && !errorMessage && (
        <div>
          {logs.length === 0 ? (
            <div>Ei dataa</div>
          ) : (
            <Accordion allowMultipleExpanded allowZeroExpanded>
              {logGroupIds.map(id => {
                const logRows = groupedLogs[id];
                const date = format(
                  new Date(logRows[0].log_timestamp),
                  'dd.MM.yyyy',
                );
                const containsErrors = logRows.find(
                  row => row.log_level === 'error',
                );
                const containsWarnings = logRows.find(
                  row => row.log_level === 'warn',
                );
                // should be exactly one row per file
                const fileRows = logRows.filter(
                  row => row.source === 'data-inspection',
                );
                const filesTotal = fileRows.length;
                const successCount = fileRows.filter(
                  row => row.log_level === 'info',
                ).length;
                const errorCount = fileRows.filter(
                  row => row.log_level === 'error',
                ).length;

                let statsMessage = '';
                if (
                  ['data-inspection', 'data-reception'].includes(
                    logRows[0].source,
                  )
                ) {
                  statsMessage = `Tiedostoja yhteensä: ${filesTotal}. Parsinta onnistui: ${successCount} tiedostoa. Parsinta epäonnistui: ${errorCount} tiedostoa.`;
                }
                let titleKey = '';
                switch (logRows[0].source) {
                  case 'data-inspection':
                  case 'data-reception':
                    titleKey = 'admin:log_header_data_process';
                    break;
                  case 'delete-process':
                    titleKey = 'admin:log_header_delete_process';
                  default:
                    break;
                }
                return (
                  <AccordionItem
                    className="border border-gray-300 rounded-lg p-2 my-2"
                    key={`${logRows[0].log_timestamp}${id}`}
                  >
                    <AccordionItemHeading>
                      <AccordionItemButton
                        className={clsx(css.accordionButton)}
                      >
                        <FontAwesomeIcon
                          className={`${clsx(css.downArrow)} mx-3`}
                          icon={faChevronDown}
                        />
                        {`${date} ${t(titleKey)}: ${logRows[0].invocation_id}`}
                        {containsErrors && (
                          <span className="px-1 py-1 m-1 rounded-xl bg-error font-bold">
                            {t('admin:log_contains_errors')}
                          </span>
                        )}
                        {containsWarnings && (
                          <span className="px-1 py-1 m-1 rounded-xl bg-warn font-bold">
                            {t('admin:log_contains_warnings')}
                          </span>
                        )}
                      </AccordionItemButton>
                    </AccordionItemHeading>
                    <AccordionItemPanel
                      className={`${clsx(css.logContainer)} bg-slate-100`}
                    >
                      <div className={clsx(css.logBox)}>
                        {logRows.map(row => (
                          <pre
                            className={`${clsx(css.logRow)} bg-${
                              row.log_level
                            }`}
                            key={`${row.log_message}${row.log_timestamp}`}
                          >
                            {`[${format(
                              new Date(row.log_timestamp),
                              'dd.MM.yyyy HH:mm:ss.SSS',
                            )}] ${row.log_message}`}
                          </pre>
                        ))}
                        {statsMessage && (
                          <pre className={clsx(css.logRows)}>
                            {statsMessage}
                          </pre>
                        )}
                      </div>
                    </AccordionItemPanel>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminIndex;
