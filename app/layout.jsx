import localFont from 'next/font/local';
import './globals.css';
import LocationTracker from './components/LocationTracker';
import { SupabaseClientProvider } from './components/SupabaseClientProvider';

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
  description: 'Platform jual beli barang bekas terpercaya di Indonesia',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        {/* Inline critical CSS to prevent render blocking */}
        <style dangerouslySetInnerHTML={{__html: `
          body{background-color:#111827;color:#f9fafb;min-height:100vh;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
          *{box-sizing:border-box;margin:0;padding:0}
        `}} />

        {/* Preconnect to Supabase for faster API calls */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
      </head>
      <body className={inter.className}>
        <SupabaseClientProvider>
          <LocationTracker />
          {children}
        </SupabaseClientProvider>
      </body>
    </html>
  );
}
