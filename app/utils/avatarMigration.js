/**
 * Avatar Migration Utility
 * Converts old DiceBear v7.x SVG URLs to new v9.x PNG URLs
 */

/**
 * Check if URL is an old DiceBear SVG URL
 * @param {string} url - Avatar URL
 * @returns {boolean}
 */
export function isOldDiceBearUrl(url) {
  if (!url || typeof url !== 'string') return false;

  // Check for old DiceBear URLs (v7.x or earlier with SVG)
  return url.includes('api.dicebear.com') &&
         (url.includes('/7.x/') || url.includes('/6.x/') || url.includes('/5.x/')) &&
         url.includes('/svg');
}

/**
 * Migrate old DiceBear URL to new format
 * @param {string} oldUrl - Old DiceBear URL
 * @returns {string} - New DiceBear URL
 */
export function migrateDiceBearUrl(oldUrl) {
  if (!isOldDiceBearUrl(oldUrl)) {
    return oldUrl; // Return as-is if not an old DiceBear URL
  }

  try {
    // Extract seed from old URL
    const url = new URL(oldUrl);
    const seed = url.searchParams.get('seed');

    if (!seed) {
      console.error('No seed found in DiceBear URL:', oldUrl);
      return oldUrl;
    }

    // Extract style (e.g., 'avataaars', 'bottts', etc.)
    const pathParts = url.pathname.split('/');
    const styleIndex = pathParts.findIndex(part => part.includes('.x')) + 1;
    const style = pathParts[styleIndex] || 'avataaars';

    // Generate new URL with v9.x and PNG format
    const newUrl = `https://api.dicebear.com/9.x/${style}/png?seed=${seed}&size=200`;

    console.log(`✅ Migrated avatar URL: ${style} (${seed})`);
    return newUrl;
  } catch (error) {
    console.error('Error migrating DiceBear URL:', error);
    return oldUrl;
  }
}

/**
 * Generate new DiceBear avatar URL
 * @param {string} seed - Seed for avatar generation (name, email, etc.)
 * @param {string} style - Avatar style (default: 'avataaars')
 * @returns {string} - New DiceBear URL
 */
export function generateDiceBearAvatar(seed, style = 'avataaars') {
  const encodedSeed = encodeURIComponent(seed || Math.random().toString());
  return `https://api.dicebear.com/9.x/${style}/png?seed=${encodedSeed}&size=200`;
}

/**
 * Batch migrate user profiles (for admin use)
 * @param {Object} supabaseClient - Supabase client
 * @returns {Promise<Object>} - Migration result
 */
export async function migrateAllAvatars(supabaseClient) {
  try {
    console.log('🔄 Starting avatar migration...');

    // Fetch all profiles with old DiceBear URLs
    const { data: profiles, error: fetchError } = await supabaseClient
      .from('profiles')
      .select('id, avatar_url, full_name')
      .like('avatar_url', '%api.dicebear.com%/%svg%');

    if (fetchError) throw fetchError;

    if (!profiles || profiles.length === 0) {
      console.log('✅ No profiles need migration');
      return { success: true, migrated: 0 };
    }

    console.log(`📊 Found ${profiles.length} profiles to migrate`);

    let migratedCount = 0;
    let errorCount = 0;

    // Migrate each profile
    for (const profile of profiles) {
      try {
        const newUrl = migrateDiceBearUrl(profile.avatar_url);

        // Only update if URL actually changed
        if (newUrl !== profile.avatar_url) {
          const { error: updateError } = await supabaseClient
            .from('profiles')
            .update({ avatar_url: newUrl })
            .eq('id', profile.id);

          if (updateError) {
            console.error(`❌ Failed to migrate profile ${profile.id}:`, updateError);
            errorCount++;
          } else {
            migratedCount++;
          }
        }
      } catch (error) {
        console.error(`❌ Error processing profile ${profile.id}:`, error);
        errorCount++;
      }
    }

    console.log(`✅ Migration complete: ${migratedCount} migrated, ${errorCount} errors`);

    return {
      success: true,
      migrated: migratedCount,
      errors: errorCount,
      total: profiles.length
    };
  } catch (error) {
    console.error('❌ Avatar migration failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
