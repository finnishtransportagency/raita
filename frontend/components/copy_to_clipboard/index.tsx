import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/free-regular-svg-icons';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Tooltip } from 'react-tooltip';

function CopyToClipboard(props: Props) {
  const { t } = useTranslation(['common']);
  const { textToCopy, tooltipId } = props;

  const [copied, setCopied] = useState(false);

  const title = copied
    ? `${t('common:copied')}!`
    : t('common:copy_to_clipboard');
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }}
      className="ml-1"
      data-tooltip-id={tooltipId}
      data-tooltip-content={title}
    >
      <FontAwesomeIcon icon={faCopy} />
      <Tooltip id={tooltipId} />
    </button>
  );
}

export default CopyToClipboard;

//

export type Props = {
  textToCopy: string;
  tooltipId: string;
};
