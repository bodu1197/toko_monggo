module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
    // Optimize CSS for production
    ...(process.env.NODE_ENV === 'production' ? {
      cssnano: {
        preset: ['default', {
          discardComments: {
            removeAll: true,
          },
          minifyFontValues: true,
          minifySelectors: true,
          normalizeWhitespace: true,
          colormin: true,
          convertValues: true,
        }],
      },
    } : {})
  },
};
