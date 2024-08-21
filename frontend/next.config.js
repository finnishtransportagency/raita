/** @type {import('next').NextConfig} */
const nextConfig = {
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
  rewrites: () => {
    const currentMetadataDatabase =
      process.env.NEXT_PUBLIC_METADATA_DATABASE || '';
    // path rewrites to only enable "reports" or "graphql_reports" page
    if (currentMetadataDatabase === 'opensearch') {
      return {
        beforeFiles: [
          {
            source: '/graphql_reports',
            destination: '/reports',
          },
          {
            source: '/',
            destination: '/reports',
          },
        ],
      };
    } else if (currentMetadataDatabase === 'postgres') {
      return {
        beforeFiles: [
          {
            source: '/reports',
            destination: '/graphql_reports',
          },
          {
            source: '/',
            destination: '/graphql_reports',
          },
        ],
      };
    }
    return [];
  },
};

module.exports = nextConfig;
