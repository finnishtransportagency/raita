import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import clsx from 'clsx';
import css from './log_view.module.css';
import { SingleEventAdminLogsResponse } from 'shared/types';

type Props = {
  eventLogs: { [eventId: string]: SingleEventAdminLogsResponse };
  eventId: string;
};

const LogView = ({ eventLogs, eventId }: Props): JSX.Element => {
  const { t } = useTranslation(['common', 'admin']);
  const [showErroredFilesOnly, setShowErroredFilesOnly] = useState(false);
  const [showWarnedFilesOnly, setShowWarnedFilesOnly] = useState(false);

  return (
    <>
      <div className="block pb-4 flex flex-col">
        <label>
          <input
            className="mx-1"
            type="checkbox"
            checked={showErroredFilesOnly}
            onChange={e => setShowErroredFilesOnly(e.currentTarget.checked)}
          />
          {t('admin:log_show_only_errored_logrows')}
        </label>
        <label>
          <input
            className="mx-1"
            type="checkbox"
            checked={showWarnedFilesOnly}
            onChange={e => setShowWarnedFilesOnly(e.currentTarget.checked)}
          />
          {t('admin:log_show_only_warned_logrows')}
        </label>
      </div>
      <p>
        {t('admin:log_row_counts', {
          current: eventLogs[eventId].logs
            .filter(row => !showErroredFilesOnly || row.log_level === 'error')
            .filter(row => !showWarnedFilesOnly || row.log_level === 'warn')
            .length,
          total: eventLogs[eventId]?.totalSize,
        })}
      </p>
      <div className={clsx(css.logBox)}>
        {eventLogs[eventId].logs
          .filter(row => !showErroredFilesOnly || row.log_level === 'error')
          .filter(row => !showWarnedFilesOnly || row.log_level === 'warn')
          .map(row => (
            <pre
              className={`${clsx(css.logRow)} bg-${row.log_level}`}
              key={`${row.log_message}${row.log_timestamp}`}
            >
              {`[${format(
                new Date(row.log_timestamp),
                'dd.MM.yyyy HH:mm:ss.SSS',
              )}] ${row.log_message}`}
            </pre>
          ))}
      </div>
    </>
  );
};
export default LogView;
