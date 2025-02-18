const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

const getNextConfig = (phase, { defaultConfig }) => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;
  /**
   * @type {import('next').NextConfig}
   */
  const nextConfig = {
    output: isDev ? 'standalone' : 'export',
    reactStrictMode: true,
    swcMinify: false,
    compiler: {
      removeConsole: false,
    },
    basePath: process.env.NEXT_PUBLIC_RAITA_BASEURL || '',
    webpack: config => {
      config.module.rules.push({
        test: /\.md/,
        type: 'asset/source',
      });
      return config;
    },
    images: {
      unoptimized: true,
    },
    rewrites: isDev
      ? () => {
          return {
            beforeFiles: [
              {
                source: '/',
                destination: '/reports',
              },
            ],
          };
        }
      : {},
  };
  return nextConfig;
};

module.exports = getNextConfig;
