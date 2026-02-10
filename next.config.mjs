/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // TypeScript errors should not be ignored in production
    // Fix any TypeScript errors to ensure code quality
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  // Security headers for production
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-*'],
  },
  // Mark thread-stream as external to avoid bundling its test files
  serverExternalPackages: ['thread-stream'],
  // Ignore specific warnings from thread-stream during build
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

export default nextConfig
