import Link from 'next/link';
import { PageDescription } from 'shared/pageRoutes';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';

type Props = {
  pages: PageDescription[];
};
/**
 * Navigation bar element
 */
const Navigation = ({ pages }: Props) => {
  const { t } = useTranslation(['common']);
  const router = useRouter();
  // no need for navigationbar if only one page (non admins)
  if (pages.length === 1) {
    return null;
  }
  const currentPage = router.pathname;
  return (
    <nav className="bg-primary  border-white text-white">
      <ul className="container flex mx-auto px-16 flex-row">
        {pages.map(page => {
          const active = currentPage === page.href;
          const classes = active ? 'text-primary bg-white' : '';
          return (
            <li className={`px-2 py-1 ${classes}`} key={page.href}>
              <Link href={page.href}>{t(page.labelTranslationKey)}</Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Navigation;
