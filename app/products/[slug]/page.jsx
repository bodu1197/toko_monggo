import { createClient } from '../../utils/supabase-server';
import ProductDetail from './ProductDetail';

// Simplified metadata - testing if Supabase is the issue
export async function generateMetadata({ params }) {
  try {
    const resolvedParams = await params;
    const slug = resolvedParams?.slug || '';

    if (!slug) {
      return {
        title: 'Produk - TokoMonggo',
        description: 'Lihat produk di TokoMonggo.',
      };
    }

    // Test: Fetch product metadata from Supabase
    const supabase = await createClient();
    const { data: product, error } = await supabase
      .from('products')
      .select('title, price')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('Error fetching product metadata:', error);
      return {
        title: 'Produk - TokoMonggo',
        description: 'Marketplace Barang Bekas Terpercaya di Indonesia.',
      };
    }

    if (!product) {
      return {
        title: 'Produk Tidak Ditemukan - TokoMonggo',
        description: 'Produk yang Anda cari tidak ditemukan di TokoMonggo.',
      };
    }

    const priceFormatted = `Rp ${(product.price || 0).toLocaleString('id-ID')}`;

    return {
      title: `${product.title || 'Produk'} - ${priceFormatted} | TokoMonggo`,
      description: `Beli ${product.title || 'produk'} dengan harga ${priceFormatted}. Marketplace Barang Bekas Terpercaya.`,
    };
  } catch (err) {
    console.error('Error generating metadata:', err);
    return {
      title: 'Produk - TokoMonggo',
      description: 'Marketplace Barang Bekas Terpercaya di Indonesia.',
    };
  }
}

// Server Component - no JSON-LD yet, just testing Supabase
export default async function ProductPage() {
  // ProductDetail handles its own data fetching on the client
  return <ProductDetail />;
}
