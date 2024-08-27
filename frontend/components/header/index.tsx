import { PropsWithChildren, useContext } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import Instructions from 'components/instructions';
import Navigation from 'components/navigation';
import { PageDescription } from 'shared/pageRoutes';
import LatestInspectionDate from 'components/latest_inspection_date';
import { assetURL } from 'shared/config';
import { zipContext } from 'pages/_app';
import { ZipDownload } from 'components/zip-download-graphql';

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
  const zipState = useContext(zipContext);
  return (
    <>
      <header className="bg-primary text-white h-16">
        <Head>
          <title>{`${t('raita_title')} - ${t(pageTitleKey)}`}</title>
        </Head>
        <div className="container mx-auto px-16 grid grid-cols-3">
          <div className="my-auto flex">
            <h1 className="flex font-semibold">
              <span className="text-2xl mr-1">{t('raita_title')}</span>
              <span className="text-l my-auto">{` – ${t(
                'raita_subtitle',
              )}`}</span>
            </h1>
            <Instructions className="ml-6 my-auto" />
          </div>
          <div>
            <Image
              className="m-auto"
              src={`${assetURL}/vayla_sivussa_fi_sv_white.png`}
              alt="logo"
              height="64"
              width="179"
            />
          </div>
          <div className="my-auto">
            <div className="flex flex-row justify-end">
              <LatestInspectionDate className="my-auto mr-4" />
            </div>
            {(zipState.state.zipUrl ||
              zipState.state.isLoading ||
              localStorage.getItem('zipUrl')) && (
              <div className="ml-2 flex justify-end">
                <ZipDownload
                  buttonType="tertiary"
                  aggregationSize={undefined}
                  resultTotalSize={undefined}
                />
              </div>
            )}
          </div>
        </div>
      </header>

      {children}
      <Navigation pages={pages} />
    </>
  );
};

export default Header;
