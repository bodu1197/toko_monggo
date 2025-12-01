import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cache busting for CSS updates - v2.3
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },

  // Performance optimizations
  compress: true, // Enable Gzip compression
  poweredByHeader: false, // Remove X-Powered-By header

  // Reduce server startup time
  reactStrictMode: false, // Disable strict mode in production for faster server responses

  // Optimize server responses
  output: 'standalone', // Optimize for deployment (smaller Docker images, faster cold starts)

  // Target modern browsers (reduces bundle size)
  modularizeImports: {
    lodash: {
      transform: 'lodash/{{member}}',
    },
  },

  // Transpile only for modern browsers (ES2020+)
  transpilePackages: [],

  // TTFB 최적화 - 서버 응답 시간 단축 (Next.js 15에서 experimental에서 이동)
  serverExternalPackages: ['@supabase/supabase-js', '@supabase/ssr'],

  // CSS optimization
  experimental: {
    optimizeCss: true, // Enable CSS optimization (requires critters)
    optimizePackageImports: ['react', 'react-dom'], // Tree-shake imports (Supabase는 serverExternalPackages로 이동)
    cssChunking: 'strict', // Enable CSS chunking for better caching (strict mode)

    // TTFB 최적화 - 서버 응답 시간 단축
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Production optimization
  productionBrowserSourceMaps: false, // Disable source maps in production

  // Webpack optimizations
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side optimizations
      config.optimization = {
        ...config.optimization,
        usedExports: true, // Tree shaking
        sideEffects: false, // Enable aggressive tree shaking
        minimize: true, // Ensure minification is enabled
      };

      // Minify with more aggressive settings
      if (config.optimization.minimizer) {
        config.optimization.minimizer = config.optimization.minimizer.map(plugin => {
          if (plugin.constructor.name === 'TerserPlugin') {
            return {
              ...plugin,
              options: {
                ...plugin.options,
                terserOptions: {
                  ...plugin.options?.terserOptions,
                  compress: {
                    ...plugin.options?.terserOptions?.compress,
                    dead_code: true,
                    drop_console: true,
                    drop_debugger: true,
                    pure_funcs: ['console.log', 'console.info', 'console.debug'],
                    passes: 3, // Multiple passes for better optimization
                  },
                  mangle: {
                    safari10: true,
                  },
                },
              },
            };
          }
          return plugin;
        });
      }
    }
    return config;
  },

  // Images optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/9.x/**', // Only allow v9.x API
      },
      // Add specific Supabase project URL
      {
        protocol: 'https',
        hostname: 'zthksbitvezxwhbymatz.supabase.co',
      },
      // Google user profile images
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
    formats: ['image/webp'], // WebP only for better compatibility
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    // Remove restrictive CSP and contentDispositionType that might cause issues
    // dangerouslyAllowSVG: true,
    // contentDispositionType: 'attachment',
    // contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Aggressive compression for better performance
    unoptimized: false,
    // Temporarily disable custom loader to fix broken images
    // loader: 'custom',
    // loaderFile: './image-loader.js',
  },

  // Rewrites for favicon.ico to use icon.svg
  async rewrites() {
    return [
      {
        source: '/favicon.ico',
        destination: '/icon.svg',
      },
    ];
  },

  // Headers for caching and security
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
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      // Static assets - aggressive caching
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // CSS files - aggressive caching
      {
        source: '/_next/static/css/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Image optimization - cache for 1 year
      {
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Public assets (fonts, icons, etc) - cache for 1 year
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // API routes - no caching
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
