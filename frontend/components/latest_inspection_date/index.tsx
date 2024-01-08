import { useTranslation } from 'react-i18next';
import { DATE_FMT_LATEST_MEASUREMENT } from 'shared/constants';

import { format as formatDate } from 'date-fns/fp';
import { useMetadataQuery } from 'shared/hooks';

/**
 * Show latest inspection date
 */
const LatestInspectionDate = (props: React.HTMLAttributes<HTMLDivElement>) => {
  const { t } = useTranslation(['common']);
  const meta = useMetadataQuery();

  let latestInspectionFormattedDate = '';
  if (meta.data?.latestInspection) {
    try {
      const latestInspectionParsedDate = Date.parse(meta.data.latestInspection);
      latestInspectionFormattedDate = formatDate(
        DATE_FMT_LATEST_MEASUREMENT,
        latestInspectionParsedDate,
      );
    } catch (e) {
      console.warn(
        'Error parsing or formatting latest inspection date ' +
          meta.data.latestInspection +
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
