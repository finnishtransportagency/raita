import Link from 'next/link';
import { PageDescription } from 'shared/pageRoutes';
import { useTranslation } from 'react-i18next';

type Props = {
  pages: PageDescription[];
};
/**
 * Navigation bar element
 */
const Navigation = ({ pages }: Props) => {
  const { t } = useTranslation(['common']);
  // no need for navigationbar if only one page (non admins)
  if (pages.length === 1) {
    return null;
  }
  return (
    <nav>
      <ul className="flex flex-row">
        {pages.map(page => (
          <li className="px-1 py-1" key={page.href}>
            <Link href={page.href}>{t(page.labelTranslationKey)}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navigation;
