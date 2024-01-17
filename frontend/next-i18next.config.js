const HttpBackend = require('i18next-http-backend/cjs');
const ChainedBackend = require('i18next-chained-backend').default;
const LocalStorageBackend = require('i18next-localstorage-backend').default;

module.exports = {
  backend: {
    backendOptions: [
      {
        expirationTime: 0, //60 * 60 * 1000,
        // version: '', use a hash of translation files here if cache is enabled
      },
      {
        loadPath: (locale, namespace) =>
          `${
            process.env.NEXT_PUBLIC_RAITA_BASEURL || ''
          }/locales/${locale}/${namespace}.json`,
      },
    ],
    backends:
      typeof window !== 'undefined' ? [LocalStorageBackend, HttpBackend] : [],
  },
  i18n: {
    defaultLocale: 'fi',
    locales: ['en', 'fi'],
  },
  reloadOnPrerender: true,
  serializeConfig: false,
  use: typeof window !== 'undefined' ? [ChainedBackend] : [],
};
