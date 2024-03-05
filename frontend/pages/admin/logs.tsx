import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { RaitaNextPage, Range } from 'shared/types';
import { subDays } from 'date-fns';
import { Button, DateRange, LogAccordion } from 'components';
import { RaitaRole } from 'shared/user';
import css from './logs.module.css';
import clsx from 'clsx';

const AdminLogs: RaitaNextPage = () => {
  const { t } = useTranslation(['common', 'admin']);

  const defaultStartDate = subDays(new Date(), 7);
  const defaultEndDate = new Date();

  const [fetching, setFetching] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<Range<Date>>({
    start: defaultStartDate,
    end: defaultEndDate,
  });
  const [activeTab, setActiveTab] = useState<'delete' | 'data-process'>(
    'data-process',
  );

  const fetchNew = () => {
    setFetching(false);
    setTimeout(() => setFetching(true));
  };

  return (
    <div className="container mx-auto px-16 py-6">
      <h1 className="text-3xl mb-4 pb-2 w-4/12 border-primary border-b-2">
        {t('admin:log_title')}
      </h1>

      <div className="w-4/12">
        <p className="mb-2">{t('admin:log_search_description')}</p>
        <DateRange
          range={dateRange}
          onUpdate={setDateRange}
          resetDateRange={false}
          className="max-w-md"
          inputId="log-daterange"
        />
        <Button label={t('common:search')} onClick={fetchNew} />
      </div>
      <div>
        <button
          onClick={() => setActiveTab('data-process')}
          className={clsx(
            css.tabButton,
            activeTab === 'data-process' ? css.active : '',
          )}
        >
          {t('admin:log_data_process_events')}
        </button>
        <button
          onClick={() => setActiveTab('delete')}
          className={clsx(
            css.tabButton,
            activeTab === 'delete' ? css.active : '',
          )}
        >
          {t('admin:log_delete_events')}
        </button>
      </div>
      <div className={activeTab === 'data-process' ? '' : 'hidden'}>
        <LogAccordion
          type="data-process"
          dateRange={dateRange}
          forceFetch={fetching}
        />
      </div>
      <div className={activeTab === 'delete' ? '' : 'hidden'}>
        <LogAccordion
          type="delete"
          dateRange={dateRange}
          forceFetch={fetching}
        />
      </div>
    </div>
  );
};

AdminLogs.requiredRole = RaitaRole.Admin;

export default AdminLogs;
