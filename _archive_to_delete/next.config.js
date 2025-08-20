/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow connection to Python backend
  async rewrites() {
    return [
      {
        source: '/api/voice/:path*',
        destination: 'http://localhost:8000/api/voice/:path*',
      },
      {
        source: '/api/python/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;