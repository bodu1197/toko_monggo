import { createClient } from '../../utils/supabase-server';
import ProductDetail from './ProductDetail';

const BASE_URL = 'https://tokomonggo.com';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.jpg`;

// Full metadata with Open Graph and Twitter
export async function generateMetadata({ params }) {
  const defaultMeta = {
    title: 'Produk - TokoMonggo',
    description: 'Marketplace Barang Bekas Terpercaya di Indonesia.',
    openGraph: {
      title: 'Produk - TokoMonggo',
      description: 'Marketplace Barang Bekas Terpercaya di Indonesia.',
      url: BASE_URL,
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

  try {
    const resolvedParams = await params;
    const slug = resolvedParams?.slug || '';

    if (!slug) return defaultMeta;

    const supabase = await createClient();
    const { data: product, error } = await supabase
      .from('products')
      .select('title, price, description, product_images(image_url, order)')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('Error fetching product metadata:', error);
      return defaultMeta;
    }

    if (!product) {
      return {
        ...defaultMeta,
        title: 'Produk Tidak Ditemukan - TokoMonggo',
        description: 'Produk yang Anda cari tidak ditemukan di TokoMonggo.',
      };
    }

    const title = product.title || 'Produk';
    const priceFormatted = `Rp ${(product.price || 0).toLocaleString('id-ID')}`;
    const fullTitle = `${title} - ${priceFormatted} | TokoMonggo`;
    const description = product.description
      ? `${product.description.substring(0, 150)}...`
      : `Beli ${title} dengan harga ${priceFormatted}. Marketplace Barang Bekas Terpercaya.`;

    // Get product image safely
    let imageUrl = DEFAULT_OG_IMAGE;
    if (product.product_images && Array.isArray(product.product_images) && product.product_images.length > 0) {
      const sortedImages = [...product.product_images].sort((a, b) => (a.order || 0) - (b.order || 0));
      if (sortedImages[0]?.image_url) {
        imageUrl = sortedImages[0].image_url;
      }
    }

    const productUrl = `${BASE_URL}/products/${slug}`;

    return {
      title: fullTitle,
      description,
      alternates: {
        canonical: productUrl,
      },
      openGraph: {
        title: fullTitle,
        description,
        url: productUrl,
        siteName: 'TokoMonggo',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
        locale: 'id_ID',
        type: 'product',
      },
      twitter: {
        card: 'summary_large_image',
        title: fullTitle,
        description,
        images: [imageUrl],
      },
    };
  } catch (err) {
    console.error('Error generating metadata:', err);
    return defaultMeta;
  }
}

// Helper function to generate JSON-LD safely
function generateProductJsonLd(product, slug) {
  if (!product) return null;

  try {
    // Get first image safely
    let imageUrl = DEFAULT_OG_IMAGE;
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
      url: `${BASE_URL}/products/${slug}`,
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
