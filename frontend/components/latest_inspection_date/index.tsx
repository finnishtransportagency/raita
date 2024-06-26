import { useTranslation } from 'react-i18next';
import { DATE_FMT_LATEST_MEASUREMENT } from 'shared/constants';

import { format as formatDate } from 'date-fns/fp';
import { useQuery } from '@apollo/client';
import { META } from 'shared/graphql/queries/reports';

/**
 * Show latest inspection date
 */
const LatestInspectionDate = (props: React.HTMLAttributes<HTMLDivElement>) => {
  const { t } = useTranslation(['common']);

  const meta = useQuery(META);
  const latest_inspection = meta.data?.meta.latest_inspection;

  let latestInspectionFormattedDate = '';
  if (latest_inspection) {
    try {
      const latestInspectionParsedDate = Date.parse(latest_inspection);
      latestInspectionFormattedDate = formatDate(
        DATE_FMT_LATEST_MEASUREMENT,
        latestInspectionParsedDate,
      );
    } catch (e) {
      console.warn(
        'Error parsing or formatting latest inspection date ' +
          latest_inspection +
          ' ' +
          e,
      );
    }
  } else {
    console.warn('Latest inspection date missing');
  }
  return (
    <div {...props}>
      {t('common:latest_inspection')}
      {latestInspectionFormattedDate}
    </div>
  );
};

export default LatestInspectionDate;
