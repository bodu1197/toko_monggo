export default function robots() {
  return {
    rules: [
      // Default rules for all crawlers
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/_next/',
          '/static/',
          '*.json',
          '/products/*/edit',
          '/profile/settings',
        ],
      },
      // Google Search Bot
      {
        userAgent: 'Googlebot',
        allow: '/',
        crawlDelay: 0,
      },
      // Google Image Bot
      {
        userAgent: 'Googlebot-Image',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      // ===== AI Crawlers (GEO/AIO Optimization) =====
      // OpenAI GPTBot - ChatGPT web browsing
      {
        userAgent: 'GPTBot',
        allow: [
          '/',
          '/about',
          '/help',
          '/products/',
          '/terms',
          '/privacy',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/profile/',
          '/settings/',
        ],
      },
      // OpenAI ChatGPT-User - ChatGPT plugins
      {
        userAgent: 'ChatGPT-User',
        allow: [
          '/',
          '/about',
          '/help',
          '/products/',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/profile/',
        ],
      },
      // Google AI (Gemini) - Google-Extended
      {
        userAgent: 'Google-Extended',
        allow: [
          '/',
          '/about',
          '/help',
          '/products/',
          '/terms',
          '/privacy',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/profile/',
        ],
      },
      // Anthropic Claude Bot
      {
        userAgent: 'ClaudeBot',
        allow: [
          '/',
          '/about',
          '/help',
          '/products/',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/profile/',
        ],
      },
      {
        userAgent: 'Claude-Web',
        allow: [
          '/',
          '/about',
          '/help',
          '/products/',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/profile/',
        ],
      },
      // Perplexity AI Bot
      {
        userAgent: 'PerplexityBot',
        allow: [
          '/',
          '/about',
          '/help',
          '/products/',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/profile/',
        ],
      },
      // Cohere AI Bot
      {
        userAgent: 'cohere-ai',
        allow: [
          '/',
          '/about',
          '/help',
          '/products/',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/profile/',
        ],
      },
      // Meta AI Bot
      {
        userAgent: 'FacebookBot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/auth/'],
      },
      {
        userAgent: 'meta-externalagent',
        allow: [
          '/',
          '/about',
          '/help',
          '/products/',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/profile/',
        ],
      },
      // Microsoft Bing AI
      {
        userAgent: 'Bingbot',
        allow: '/',
        crawlDelay: 0,
      },
      // Apple Bot (Siri, Spotlight)
      {
        userAgent: 'Applebot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/auth/'],
      },
      // Common Crawl (used by many AI training)
      {
        userAgent: 'CCBot',
        allow: [
          '/',
          '/about',
          '/help',
          '/products/',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/profile/',
        ],
      },
    ],
    sitemap: 'https://tokomonggo.com/sitemap.xml',
    host: 'https://tokomonggo.com',
  };
}
