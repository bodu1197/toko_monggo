import localFont from 'next/font/local';
import './globals.css';
import LocationTracker from './components/LocationTracker';
import { SupabaseClientProvider } from './components/SupabaseClientProvider';
import PWAInstallPrompt from './components/PWAInstallPrompt';

const inter = localFont({
  src: '../public/fonts/inter.woff2',
  display: 'swap', // 폰트 로딩 중에도 텍스트 표시 (FOUT 방지)
  variable: '--font-inter', // CSS 변수로 사용 가능
  adjustFontFallback: true, // Reduce layout shift
  fallback: ['system-ui', 'arial'], // System font fallback
});

export const metadata = {
  title: 'TokoMonggo - Marketplace Barang Bekas Terpercaya',
  description: 'Platform jual beli barang bekas terpercaya di Indonesia. Jual beli laptop bekas, handphone bekas, elektronik bekas, furniture bekas dengan harga terbaik. Marketplace online Indonesia.',
  manifest: '/manifest.json', // PWA support
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: '/icon-192.png',
  },
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

        {/* Critical CSS for immediate render */}
        <style dangerouslySetInnerHTML={{ __html: `
          :root{--color-primary-900:#111827;--color-primary-50:#f9fafb;--color-primary-300:#d1d5db;--color-primary-400:#9ca3af}
          html{overflow-y:scroll;scrollbar-gutter:stable}
          body{background-color:#111827;color:#f9fafb;margin:0;min-height:100vh}
          .antialiased{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}

          /* PWA Install Prompt Animation */
          @keyframes slideUp {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          .animate-slideUp {
            animation: slideUp 0.3s ease-out;
          }
        `}} />



        {/* Preconnect to critical domains for faster resource loading */}
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <>
            <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
          </>
        )}
        <link rel="preconnect" href="https://api.dicebear.com" />
        <link rel="preconnect" href="https://picsum.photos" />

        {/* JSON-LD for Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Service Worker Registration for PWA */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then(registration => console.log('SW registered:', registration))
                    .catch(error => console.log('SW registration failed:', error));
                });
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-surface-primary text-text-primary min-h-screen antialiased`}>
        <SupabaseClientProvider>
          <LocationTracker />
          <PWAInstallPrompt />
          {children}
        </SupabaseClientProvider>
      </body>
    </html>
  );
}