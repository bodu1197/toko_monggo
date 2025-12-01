import { createClient } from '../../utils/supabase-server';
import ProductDetail from './ProductDetail';

// Step 3: Testing Supabase + JSON-LD
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

    const supabase = await createClient();
    const { data: product, error } = await supabase
      .from('products')
      .select('title, price, description')
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
      description: product.description
        ? `${product.description.substring(0, 150)}...`
        : `Beli ${product.title || 'produk'} dengan harga ${priceFormatted}. Marketplace Barang Bekas Terpercaya.`,
    };
  } catch (err) {
    console.error('Error generating metadata:', err);
    return {
      title: 'Produk - TokoMonggo',
      description: 'Marketplace Barang Bekas Terpercaya di Indonesia.',
    };
  }
}

// Helper function to generate JSON-LD safely
function generateProductJsonLd(product, slug) {
  if (!product) return null;

  try {
    const baseUrl = 'https://tokomonggo.com';

    // Get first image safely
    let imageUrl = `${baseUrl}/og-image.jpg`;
    if (product.product_images && Array.isArray(product.product_images) && product.product_images.length > 0) {
      const sortedImages = [...product.product_images].sort((a, b) => (a.order || 0) - (b.order || 0));
      if (sortedImages[0]?.image_url) {
        imageUrl = sortedImages[0].image_url;
      }
    }

    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title || 'Produk',
      description: product.description || '',
      image: imageUrl,
      url: `${baseUrl}/products/${slug}`,
      offers: {
        '@type': 'Offer',
        price: product.price || 0,
        priceCurrency: 'IDR',
        availability: product.status === 'available'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: 'TokoMonggo',
        },
      },
    };
  } catch (e) {
    console.error('Error generating JSON-LD:', e);
    return null;
  }
}

// Server Component with JSON-LD
export default async function ProductPage({ params }) {
  let jsonLd = null;

  try {
    const resolvedParams = await params;
    const slug = resolvedParams?.slug || '';

    if (slug) {
      const supabase = await createClient();
      const { data: product } = await supabase
        .from('products')
        .select('title, description, price, status, product_images(image_url, order)')
        .eq('slug', slug)
        .maybeSingle();

      if (product) {
        jsonLd = generateProductJsonLd(product, slug);
      }
    }
  } catch (err) {
    console.error('Error fetching product for JSON-LD:', err);
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetail />
    </>
  );
}
