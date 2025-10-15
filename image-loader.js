// Custom image loader for Next.js
export default function myImageLoader({ src, width, quality = 75 }) {
  // For Supabase storage images with transform API
  if (src.includes('supabase')) {
    const url = new URL(src);

    // Use Supabase's image transformation API if available
    if (url.pathname.includes('/storage/v1/object/public/')) {
      // Convert to render endpoint for transformations
      const renderUrl = src.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
      return `${renderUrl}?width=${width}&quality=${quality}&format=webp`;
    }

    return `${src}?width=${width}&quality=${quality}`;
  }

  // For external images (picsum, dicebear, etc)
  return src;
}