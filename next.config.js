/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
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
    // Allow images from localhost for development and the proxy route
    domains: ['localhost', '127.0.0.1'],
    // Support for modern image formats
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Allow all domains in development, but restrict in production
    disableStaticImages: false,
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
