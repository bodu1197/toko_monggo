import ProductDetail from './ProductDetail';

// Completely static metadata - no async operations
export const metadata = {
  title: 'Produk - TokoMonggo',
  description: 'Marketplace Barang Bekas Terpercaya di Indonesia.',
  openGraph: {
    title: 'Produk - TokoMonggo',
    description: 'Marketplace Barang Bekas Terpercaya di Indonesia.',
    siteName: 'TokoMonggo',
    locale: 'id_ID',
    type: 'website',
  },
};

// Pure static component - no async, no fetching
export default function ProductPage() {
  return <ProductDetail />;
}
