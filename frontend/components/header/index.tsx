import Navigation from 'components/navigation';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import { PageDescription } from 'shared/pageRoutes';

type Props = {
  pages: PageDescription[];
};
/**
 * Header to display on all pages
 */
const Header = ({ pages, children }: PropsWithChildren<Props>) => {
  const { t } = useTranslation(['common']);
  const router = useRouter();
  const pathSplit = router.pathname.split('/');
  const pageTitleKey = `page_labels${pathSplit.join('.')}`;
  return (
    <>
      <header className="bg-primary text-white">
        <Head>
          <title>{`${t('raita_title')} - ${t(pageTitleKey)}`}</title>
        </Head>
        <div className="container mx-auto px-16 py-6">
          <h1 className="text-4xl">{t('raita_title')}</h1> {children}
        </div>
        <Navigation pages={pages} />
      </header>
    </>
  );
};

export default Header;
