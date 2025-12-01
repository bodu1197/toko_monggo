import { createClient } from '../../utils/supabase-server';
import ProductDetail from './ProductDetail';

// Generate dynamic metadata for SEO/GEO
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from('products')
    .select(`
      title,
      description,
      price,
      condition,
      regencies (regency_name),
      provinces (province_name),
      categories (name, parent_category),
      product_images (image_url, order)
    `)
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('Error fetching product metadata:', error);
  }

  if (!product) {
    return {
      title: 'Produk Tidak Ditemukan - TokoMonggo',
      description: 'Produk yang Anda cari tidak ditemukan di TokoMonggo.',
    };
  }

  const mainImage = product.product_images?.sort((a, b) => a.order - b.order)[0]?.image_url;
  const location = `${product.regencies?.regency_name || ''}, ${product.provinces?.province_name || ''}`;
  const priceFormatted = `Rp ${product.price?.toLocaleString('id-ID')}`;

  return {
    title: `${product.title} - ${priceFormatted} | TokoMonggo`,
    description: `Beli ${product.title} dengan harga ${priceFormatted} di ${location}. Kondisi: ${product.condition}. ${product.description?.substring(0, 150)}...`,
    keywords: [
      product.title,
      product.categories?.name,
      product.categories?.parent_category,
      'barang bekas',
      'secondhand',
      product.regencies?.regency_name,
      product.provinces?.province_name,
    ].filter(Boolean),
    openGraph: {
      title: `${product.title} - ${priceFormatted}`,
      description: `${product.condition} | ${location} | TokoMonggo - Marketplace Barang Bekas Gratis`,
      type: 'product',
      url: `https://tokomonggo.com/products/${slug}`,
      images: mainImage ? [
        {
          url: mainImage,
          width: 800,
          height: 600,
          alt: product.title,
        },
      ] : [],
      siteName: 'TokoMonggo',
      locale: 'id_ID',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.title} - ${priceFormatted}`,
      description: `${product.condition} | ${location}`,
      images: mainImage ? [mainImage] : [],
    },
    alternates: {
      canonical: `https://tokomonggo.com/products/${slug}`,
    },
  };
}

// Server component wrapper for JSON-LD schema
export default async function ProductPage({ params }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from('products')
    .select(`
      slug,
      title,
      description,
      price,
      condition,
      created_at,
      regencies (regency_name),
      provinces (province_name),
      categories (name, parent_category),
      product_images (image_url, order),
      profiles (full_name)
    `)
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('Error fetching product:', error);
  }

  // Product JSON-LD Schema for GEO/AIO
  const productSchema = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `https://tokomonggo.com/products/${slug}`,
    name: product.title,
    description: product.description,
    image: product.product_images?.sort((a, b) => a.order - b.order).map(img => img.image_url) || [],
    category: product.categories?.parent_category || product.categories?.name,
    itemCondition: product.condition === 'Baru'
      ? 'https://schema.org/NewCondition'
      : 'https://schema.org/UsedCondition',
    offers: {
      '@type': 'Offer',
      url: `https://tokomonggo.com/products/${slug}`,
      priceCurrency: 'IDR',
      price: product.price,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: 'https://schema.org/InStock',
      itemCondition: product.condition === 'Baru'
        ? 'https://schema.org/NewCondition'
        : 'https://schema.org/UsedCondition',
      seller: {
        '@type': 'Person',
        name: product.profiles?.full_name || 'Penjual TokoMonggo',
      },
      areaServed: {
        '@type': 'Place',
        name: `${product.regencies?.regency_name}, ${product.provinces?.province_name}`,
        address: {
          '@type': 'PostalAddress',
          addressLocality: product.regencies?.regency_name,
          addressRegion: product.provinces?.province_name,
          addressCountry: 'ID',
        },
      },
    },
    brand: {
      '@type': 'Brand',
      name: 'Barang Bekas',
    },
  } : null;

  // BreadcrumbList Schema
  const breadcrumbSchema = product ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Beranda',
        item: 'https://tokomonggo.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: product.categories?.parent_category || 'Produk',
        item: `https://tokomonggo.com/category/${encodeURIComponent(product.categories?.parent_category || 'all')}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.categories?.name || 'Kategori',
        item: `https://tokomonggo.com/category/${encodeURIComponent(product.categories?.parent_category || 'all')}/${encodeURIComponent(product.categories?.name || '')}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: product.title,
        item: `https://tokomonggo.com/products/${slug}`,
      },
    ],
  } : null;

  return (
    <>
      {/* JSON-LD Structured Data for GEO/AIO */}
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}

      <ProductDetail />
    </>
  );
}
