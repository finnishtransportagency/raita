import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { appWithTranslation, useTranslation } from 'next-i18next';

import { RaitaAppProps } from 'shared/types';
import nextI18nConfig from '../next-i18next.config';
import 'normalize.css';
import '../styles/globals.css';
import { Header } from 'components';
import Footer from 'components/footer';
import { useUser } from 'shared/user';
import { RaitaPages } from 'shared/pageRoutes';
import Error from 'next/error';
import LoadingOverlay from 'components/loading-overlay';

const client = new QueryClient();

function MyApp({ Component, pageProps }: RaitaAppProps) {
  const { t } = useTranslation(['common']);
  const user = useUser();

  if (user.loading) {
    return <LoadingOverlay />;
  }
  if (!user.loading && !user.user) {
    return <Error statusCode={500} title={t('error.user_info') || ''} />;
  }
  const pages = RaitaPages.filter(
    page => user.user?.roles.includes(page.requiredRole),
  );

  const requiredRole = Component.requiredRole;
  const pageContent = user.user?.roles.includes(requiredRole) ? (
    <Component {...pageProps} />
  ) : (
    <Error statusCode={403} title={t('error.403') || ''} />
  );

  return (
    <QueryClientProvider {...{ client }}>
      <div className="min-h-screen flex flex-col">
        <Header pages={pages} />
        <main className="flex-1">{pageContent}</main>
        <Footer />
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default appWithTranslation(MyApp, nextI18nConfig);
