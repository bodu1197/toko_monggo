/**
 * Generate dynamic metadata for product pages
 */
export function generateProductMetadata(product) {
  const title = `${product.title} - Rp ${product.price?.toLocaleString('id-ID')} | TokoMonggo`;
  const description = `${product.condition} - ${product.description?.substring(0, 155)}... Jual beli barang bekas di ${product.city}, ${product.province}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.image ? [{ url: product.image }] : [],
      type: 'product',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product.image ? [product.image] : [],
    },
    other: {
      'product:price:amount': product.price,
      'product:price:currency': 'IDR',
      'product:condition': product.condition,
      'product:availability': product.status === 'active' ? 'in stock' : 'out of stock',
    },
  };
}

/**
 * Generate category page metadata
 */
export function generateCategoryMetadata(category, subcategory) {
  const title = subcategory
    ? `${subcategory} - ${category} | TokoMonggo`
    : `${category} - Barang Bekas | TokoMonggo`;

  const description = `Jual beli ${subcategory || category} bekas dengan harga terbaik. Temukan berbagai pilihan ${subcategory || category} berkualitas di TokoMonggo`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

/**
 * Generate location-based metadata
 */
export function generateLocationMetadata(province, city) {
  const location = city ? `${city}, ${province}` : province;
  const title = `Barang Bekas di ${location} | TokoMonggo`;
  const description = `Temukan berbagai barang bekas berkualitas di ${location}. Jual beli laptop, handphone, elektronik, furniture bekas dengan harga terbaik.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

/**
 * Generate search page metadata
 */
export function generateSearchMetadata(query) {
  const title = `Hasil Pencarian: ${query} | TokoMonggo`;
  const description = `Hasil pencarian untuk "${query}". Temukan berbagai barang bekas sesuai kebutuhan Anda di TokoMonggo`;

  return {
    title,
    description,
    robots: {
      index: false, // Don't index search results
      follow: true,
    },
  };
}