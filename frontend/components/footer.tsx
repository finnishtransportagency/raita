import { clsx } from 'clsx';
import { useTranslation } from 'next-i18next';

import css from './footer.module.css';

export function Footer() {
  const { t } = useTranslation(['common']);

  return (
    <footer className="bg-main-gray-75 text-white">
      <div className="container mx-auto px-16 py-12">
        <p className="text-lg">{t('common:ftia_name')}</p>
        <p>{t('common:iam_problem_contact_info')}</p>
      </div>
    </footer>
  );
}

export default Footer;
