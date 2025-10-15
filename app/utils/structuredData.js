/**
 * Generate Product structured data for SEO
 */
export function generateProductSchema(product, seller) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.images?.map(img => img.image_url) || [],
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Unknown',
    },
    offers: {
      '@type': 'Offer',
      url: `https://tokomonggo.com/products/${product.id}`,
      priceCurrency: 'IDR',
      price: product.price,
      priceValidUntil: product.expires_at,
      itemCondition: mapConditionToSchema(product.condition),
      availability: product.status === 'active'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Person',
        name: seller?.full_name || 'Penjual',
      },
    },
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.review_count || 0,
    } : undefined,
  };
}

/**
 * Map product condition to schema.org ItemCondition
 */
function mapConditionToSchema(condition) {
  const conditionMap = {
    'Baru': 'https://schema.org/NewCondition',
    'Seperti Baru': 'https://schema.org/RefurbishedCondition',
    'Sangat Bagus': 'https://schema.org/UsedCondition',
    'Bagus': 'https://schema.org/UsedCondition',
    'Cukup Bagus': 'https://schema.org/UsedCondition',
  };
  return conditionMap[condition] || 'https://schema.org/UsedCondition';
}

/**
 * Generate BreadcrumbList structured data
 */
export function generateBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate WebSite structured data with SearchAction
 */
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TokoMonggo',
    url: 'https://tokomonggo.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://tokomonggo.com/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate Organization structured data
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TokoMonggo',
    url: 'https://tokomonggo.com',
    logo: 'https://tokomonggo.com/logo.png',
    description: 'Platform jual beli barang bekas terpercaya di Indonesia',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'ID',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@tokomonggo.com',
    },
  };
}