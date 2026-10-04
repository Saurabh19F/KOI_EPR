/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@radix-ui/react-dialog',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-select',
    '@radix-ui/react-tabs',
  ],
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3001/api/v1',
  },
};

module.exports = nextConfig;
