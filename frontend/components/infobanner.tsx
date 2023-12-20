import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfo, faXmark } from '@fortawesome/free-solid-svg-icons';

import { BannerType } from 'shared/types';

export function InfoBanner(
  props: Props & React.HTMLAttributes<HTMLDivElement>,
) {
  const { bannerType, text } = props;
  const { t } = useTranslation(['common']);
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }
  const colors =
    bannerType === BannerType.INFO
      ? 'bg-secondary text-black'
      : 'bg-warn text-black';
  return (
    <div
      className={`flex items-center px-4 py-3 relative ${colors} ${
        props.className ?? ''
      }`}
      role="alert"
    >
      <FontAwesomeIcon className="h-4 w-4 mr-3" icon={faInfo} />
      <p>{text}</p>
      <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
        <button onClick={handleDismiss}>
          <FontAwesomeIcon
            className="h-5 w-5"
            icon={faXmark}
            title={t('common:close') || ''}
          />
        </button>
      </span>
    </div>
  );
}

export default InfoBanner;

export type Props = {
  bannerType: BannerType;
  text: String;
};
