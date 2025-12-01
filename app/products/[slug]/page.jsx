import ProductDetail from './ProductDetail';

const BASE_URL = 'https://tokomonggo.com';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.jpg`;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Fetch product using REST API (no cookies/SSR client)
async function fetchProductForMetadata(slug) {
  if (!slug || !SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/products?slug=eq.${encodeURIComponent(slug)}&select=title,price,description,product_images(image_url,order)`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: 60 }, // Cache for 60 seconds
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data?.[0] || null;
  } catch (error) {
    console.error('Error fetching product for metadata:', error);
    return null;
  }
}

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

    const product = await fetchProductForMetadata(slug);

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

// Simple Server Component - no data fetching
// JSON-LD is rendered client-side in ProductDetail
export default function ProductPage() {
  return <ProductDetail />;
}
