/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,
  compiler: {
    removeConsole: false,
  },
  basePath: process.env.RAITA_BASEURL || '',
};

module.exports = nextConfig;
