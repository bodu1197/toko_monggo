/**
 * Generate SEO-friendly slug from product title
 * @param {string} title - Product title
 * @param {string} id - Product ID (optional, for uniqueness)
 * @returns {string} URL-friendly slug
 */
export function generateSlug(title, id = '') {
  if (!title) return '';

  // Convert to lowercase and remove special characters
  let slug = title
    .toLowerCase()
    .trim()
    // Replace Indonesian characters
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    // Remove special characters
    .replace(/[^a-z0-9\s-]/g, '')
    // Replace spaces and multiple hyphens with single hyphen
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');

  // Limit slug length to 60 characters
  if (slug.length > 60) {
    slug = slug.substring(0, 60).replace(/-[^-]*$/, '');
  }

  // Add short ID suffix for uniqueness (optional)
  if (id) {
    const shortId = id.substring(0, 8);
    slug = `${slug}-${shortId}`;
  }

  return slug;
}

/**
 * Ensure slug is unique by checking database
 * @param {object} supabase - Supabase client
 * @param {string} slug - Base slug
 * @param {string} excludeId - Product ID to exclude (for updates)
 * @returns {Promise<string>} Unique slug
 */
export async function ensureUniqueSlug(supabase, slug, excludeId = null) {
  let uniqueSlug = slug;
  let counter = 1;

  while (true) {
    // Check if slug exists
    const query = supabase
      .from('products')
      .select('id')
      .eq('slug', uniqueSlug);

    // Exclude current product if updating
    if (excludeId) {
      query.neq('id', excludeId);
    }

    const { data, error } = await query.single();

    // If no conflict, slug is unique
    if (error && error.code === 'PGRST116') {
      return uniqueSlug;
    }

    // If slug exists, add counter
    if (data) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    } else {
      return uniqueSlug;
    }
  }
}
