/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Optimize package imports
    optimizePackageImports: ['@heroicons/react', 'framer-motion'],
  },
  // External packages for server components
  serverExternalPackages: ['mongoose'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.google.com;",
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias['@'] = __dirname;
    return config;
  },
};

module.exports = nextConfig;
