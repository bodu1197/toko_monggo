import { Inter } from 'next/font/google';
import './globals.css';
import LocationTracker from './components/LocationTracker';
import { SupabaseClientProvider } from './components/SupabaseClientProvider';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // 폰트 로딩 중에도 텍스트 표시 (FOUT 방지)
  preload: true,   // 폰트 미리 로드
  variable: '--font-inter', // CSS 변수로 사용 가능
});

export const metadata = {
  title: 'TokoMonggo - Marketplace Barang Bekas Terpercaya',
  description: 'Platform jual beli barang bekas terpercaya di Indonesia',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="anonymous" />

        {/* DNS Prefetch for faster resource loading */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
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
