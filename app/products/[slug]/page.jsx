import ProductDetail from './ProductDetail';

const BASE_URL = 'https://tokomonggo.com';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.jpg`;

// Static metadata - no server-side data fetching to isolate the issue
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || '';

  return {
    title: 'Produk - TokoMonggo',
    description: 'Marketplace Barang Bekas Terpercaya di Indonesia.',
    openGraph: {
      title: 'Produk - TokoMonggo',
      description: 'Marketplace Barang Bekas Terpercaya di Indonesia.',
      url: `${BASE_URL}/products/${slug}`,
      siteName: 'TokoMonggo',
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630 }],
      locale: 'id_ID',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Produk - TokoMonggo',
      description: 'Marketplace Barang Bekas Terpercaya di Indonesia.',
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

// Simple Server Component - no data fetching
// JSON-LD is rendered client-side in ProductDetail
export default function ProductPage() {
  return <ProductDetail />;
}
