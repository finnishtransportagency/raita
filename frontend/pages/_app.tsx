import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { appWithTranslation, useTranslation } from 'next-i18next';
import { ApolloProvider } from '@apollo/client';

import { RaitaAppProps } from 'shared/types';
import nextI18nConfig from '../next-i18next.config';
import 'normalize.css';
import '../styles/globals.css';
import 'react-tooltip/dist/react-tooltip.css';
import { Header } from 'components';
import Footer from 'components/footer';
import { useUser } from 'shared/user';
import { getRaitaPages } from 'shared/pageRoutes';
import Error from 'next/error';
import LoadingOverlay from 'components/loading-overlay';
import { apolloClient } from 'shared/graphql/client';
import { useState } from 'react';
import { initialState, FileDownloadState } from 'shared/fileDownloadContext';
import { fileDownloadContext } from 'shared/fileDownloadContext';

const client = new QueryClient();

const raitaPages = getRaitaPages();

function RaitaApp({ Component, pageProps }: RaitaAppProps) {
  const { t } = useTranslation(['common']);
  const user = useUser();
  const [state, setState] = useState<FileDownloadState>(initialState);
  if (user.loading) {
    return <LoadingOverlay />;
  }
  if (!user.loading && !user.user) {
    return <Error statusCode={500} title={t('error.user_info') || ''} />;
  }
  const pages = raitaPages.filter(
    page => user.user?.roles.includes(page.requiredRole),
  );

  const requiredRole = Component.requiredRole;
  const pageContent = user.user?.roles.includes(requiredRole) ? (
    <Component {...pageProps} />
  ) : (
    <Error statusCode={403} title={t('error.403') || ''} />
  );

  return (
    <div className="min-h-screen flex flex-col">
      <fileDownloadContext.Provider value={{ state, setState }}>
        <Header pages={pages} />
        <main className="flex-1">{pageContent}</main>
        <Footer />
      </fileDownloadContext.Provider>
    </div>
  );
}

const RaitaAppWithQuery = (props: RaitaAppProps) => (
  <QueryClientProvider {...{ client }}>
    <ApolloProvider client={apolloClient}>
      <RaitaApp {...props} />
    </ApolloProvider>
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
);

export default appWithTranslation(RaitaAppWithQuery, nextI18nConfig);
