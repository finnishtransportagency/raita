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
    return {
      beforeFiles: [
        {
          source: '/',
          destination: '/reports',
        },
      ],
    };
  },
};

module.exports = nextConfig;
