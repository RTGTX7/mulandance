const apiProxyTarget = process.env.API_PROXY_TARGET || 'http://localhost:8000';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/static/uploads/:path*',
        destination: `${apiProxyTarget.replace(/\/$/, '')}/static/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
