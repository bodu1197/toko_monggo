/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cache busting for CSS updates - v2.3
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },

  // Performance optimizations
  compress: true, // Enable Gzip compression
  poweredByHeader: false, // Remove X-Powered-By header

  // Target modern browsers (reduces bundle size)
  modularizeImports: {
    lodash: {
      transform: 'lodash/{{member}}',
    },
  },

  // Transpile only for modern browsers (ES2020+)
  transpilePackages: [],

  // CSS optimization
  experimental: {
    optimizeCss: true, // Enable CSS optimization (requires critters)
    optimizePackageImports: ['react', 'react-dom'], // Tree-shake React imports
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
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
    formats: ['image/avif', 'image/webp'], // AVIF first (better compression)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Aggressive compression for better performance
    unoptimized: false,
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
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
