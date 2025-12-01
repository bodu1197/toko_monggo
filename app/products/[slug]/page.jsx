import ProductDetail from './ProductDetail';

// Simplified metadata - no server-side data fetching to isolate the issue
export async function generateMetadata({ params }) {
  try {
    const resolvedParams = await params;
    const slug = resolvedParams?.slug || '';

    return {
      title: slug ? `Produk - TokoMonggo` : 'Produk - TokoMonggo',
      description: 'Marketplace Barang Bekas Terpercaya di Indonesia.',
    };
  } catch (err) {
    console.error('Error generating metadata:', err);
    return {
      title: 'Produk - TokoMonggo',
      description: 'Marketplace Barang Bekas Terpercaya di Indonesia.',
    };
  }
}

// Simplified Server Component - no server-side data fetching to isolate the issue
// ProductDetail handles its own data fetching on the client
export default async function ProductPage() {
  // Just return the client component - it will handle everything
  return <ProductDetail />;
}
