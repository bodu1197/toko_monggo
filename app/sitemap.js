import { createBrowserClient } from '@supabase/ssr';

export default async function sitemap() {
  const baseUrl = 'https://tokomonggo.com';

  // Initialize Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/products/new`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/profile`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/help`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  try {
    // Get all active products for dynamic sitemap (use slug instead of id)
    const { data: products } = await supabase
      .from('products')
      .select('slug, updated_at')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1000); // Limit to prevent huge sitemaps

    const productPages = products?.map((product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: new Date(product.updated_at),
      changeFrequency: 'weekly',
      priority: 0.9,
    })) || [];

    // Get all categories for category pages
    const { data: categories } = await supabase
      .from('categories')
      .select('name, parent_category')
      .order('name');

    const categoryPages = [];
    const uniqueParentCategories = new Set();

    categories?.forEach(cat => {
      if (cat.parent_category) {
        uniqueParentCategories.add(cat.parent_category);
        // Add subcategory pages
        categoryPages.push({
          url: `${baseUrl}/category/${encodeURIComponent(cat.parent_category)}/${encodeURIComponent(cat.name)}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    });

    // Add parent category pages
    [...uniqueParentCategories].forEach(parentCat => {
      categoryPages.push({
        url: `${baseUrl}/category/${encodeURIComponent(parentCat)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    });

    return [...staticPages, ...productPages, ...categoryPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return static pages only if database fails
    return staticPages;
  }
}
