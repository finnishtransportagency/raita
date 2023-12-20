import { PropsWithChildren } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import Instructions from 'components/instructions';
import Navigation from 'components/navigation';
import { PageDescription } from 'shared/pageRoutes';
import LatestInspectionDate from 'components/latest_inspection_date';

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
      <header className="bg-primary text-white h-16">
        <Head>
          <title>{`${t('raita_title')} - ${t(pageTitleKey)}`}</title>
        </Head>
        <div className="container mx-auto px-16 grid grid-cols-3">
          <div className="my-auto">
            <h1 className="flex font-semibold">
              <span className="text-2xl mr-1">{t('raita_title')}</span>
              <span className="text-l my-auto">{` – ${t(
                'raita_subtitle',
              )}`}</span>
            </h1>
          </div>
          <div>
            <Image
              className="m-auto"
              src="/vayla_sivussa_fi_sv_white.png"
              alt="logo"
              height="64"
              width="179"
            />
          </div>
          <div className="flex flex-row justify-end">
            <LatestInspectionDate className="my-auto mr-4" />
            <Instructions className="my-auto" />
          </div>
        </div>
      </header>

      {children}
      <Navigation pages={pages} />
    </>
  );
};

export default Header;
