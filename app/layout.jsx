import localFont from 'next/font/local';
import LocationTracker from './components/LocationTracker';
import { SupabaseClientProvider } from './components/SupabaseClientProvider';
import CSSLoader from './components/CSSLoader';

const inter = localFont({
  src: '../public/fonts/inter.woff2',
  display: 'swap', // 폰트 로딩 중에도 텍스트 표시 (FOUT 방지)
  preload: true,   // 폰트 미리 로드
  variable: '--font-inter', // CSS 변수로 사용 가능
  adjustFontFallback: true, // Reduce layout shift
  fallback: ['system-ui', 'arial'], // System font fallback
});

export const metadata = {
  title: 'TokoMonggo - Marketplace Barang Bekas Terpercaya',
  description: 'Platform jual beli barang bekas terpercaya di Indonesia. Jual beli laptop bekas, handphone bekas, elektronik bekas, furniture bekas dengan harga terbaik. Marketplace online Indonesia.',
  manifest: '/manifest.json', // PWA support
  keywords: [
    'jual beli barang bekas',
    'marketplace barang bekas',
    'jual laptop bekas',
    'beli handphone bekas',
    'elektronik bekas',
    'furniture bekas',
    'barang second',
    'toko online Indonesia',
    'marketplace Indonesia',
    'jual beli online',
    'barang bekas murah',
    'second hand Indonesia',
    'preloved Indonesia',
    'marketplace terpercaya'
  ],
  authors: [{ name: 'TokoMonggo' }],
  creator: 'TokoMonggo',
  publisher: 'TokoMonggo',
  metadataBase: new URL('https://tokomonggo.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://tokomonggo.com',
    siteName: 'TokoMonggo',
    title: 'TokoMonggo - Marketplace Barang Bekas Terpercaya',
    description: 'Platform jual beli barang bekas terpercaya di Indonesia. Jual beli laptop bekas, handphone bekas, elektronik bekas, furniture bekas dengan harga terbaik.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'TokoMonggo - Marketplace Barang Bekas',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TokoMonggo - Marketplace Barang Bekas Terpercaya',
    description: 'Platform jual beli barang bekas terpercaya di Indonesia. Jual beli laptop bekas, handphone bekas, elektronik bekas, furniture bekas.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code', // Google Search Console 인증 코드 추가 필요
  },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TokoMonggo',
    url: 'https://tokomonggo.com',
    description: 'Platform jual beli barang bekas terpercaya di Indonesia',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://tokomonggo.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'TokoMonggo',
      url: 'https://tokomonggo.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://tokomonggo.com/logo.png',
      },
    },
  };

  return (
    <html lang="id">
      <head>
        {/* Critical performance optimizations */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#111827" />

        {/* Critical CSS - Inline for immediate render */}
        <style dangerouslySetInnerHTML={{ __html: `
          /* Critical CSS for above-the-fold content */
          :root {
            --color-primary-50: #f9fafb;
            --color-primary-100: #f3f4f6;
            --color-primary-200: #e5e7eb;
            --color-primary-300: #d1d5db;
            --color-primary-400: #9ca3af;
            --color-primary-500: #6b7280;
            --color-primary-600: #4b5563;
            --color-primary-700: #374151;
            --color-primary-800: #1f2937;
            --color-primary-900: #111827;
            --color-surface-primary: #111827;
            --color-surface-secondary: #1f2937;
            --color-text-primary: #f9fafb;
            --color-text-secondary: #d1d5db;
            --color-border-primary: #374151;
          }

          body {
            background-color: #111827;
            color: #f9fafb;
            min-height: 100vh;
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          * {
            box-sizing: border-box;
          }

          /* Prevent FOUC */
          .hidden-until-loaded {
            visibility: hidden;
          }
        `}} />


        {/* Preconnect to critical domains for faster resource loading */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        <link rel="preconnect" href="https://api.dicebear.com" />
        <link rel="preconnect" href="https://picsum.photos" />

        {/* Resource hints for better performance */}
        <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />

        {/* Service Worker Registration */}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js')
                .then(registration => console.log('SW registered:', registration))
                .catch(error => console.log('SW registration failed:', error));
            });
          }
        `}} />

        {/* JSON-LD for Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Register Service Worker for PWA and Push Notifications */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(err => {
                    console.log('Service Worker registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <SupabaseClientProvider>
          <CSSLoader />
          <LocationTracker />
          {children}
        </SupabaseClientProvider>
      </body>
    </html>
  );
}
