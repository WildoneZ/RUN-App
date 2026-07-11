/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The service worker must be served from the origin root scope.
  // public/sw.js is copied verbatim by Next; these headers stop stale SWs.
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};

export default nextConfig;
