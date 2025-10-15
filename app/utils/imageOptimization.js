/**
 * Generate a blurred placeholder for images to improve LCP
 * @param {number} width - Width of the placeholder
 * @param {number} height - Height of the placeholder
 * @returns {string} Base64 encoded SVG placeholder
 */
export function generateBlurPlaceholder(width = 4, height = 3) {
  const shimmer = `
    <svg width="${width}" height="${height}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <linearGradient id="g">
          <stop stop-color="#374151" offset="20%" />
          <stop stop-color="#4b5563" offset="50%" />
          <stop stop-color="#374151" offset="70%" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="#374151" />
      <rect id="r" width="${width}" height="${height}" fill="url(#g)" />
      <animate xlink:href="#r" attributeName="x" from="-${width}" to="${width}" dur="1s" repeatCount="indefinite" />
    </svg>
  `;

  const toBase64 = (str) =>
    typeof window === 'undefined'
      ? Buffer.from(str).toString('base64')
      : window.btoa(str);

  return `data:image/svg+xml;base64,${toBase64(shimmer)}`;
}

/**
 * Preload critical images for better performance
 * @param {string[]} imagePaths - Array of image URLs to preload
 */
export function preloadImages(imagePaths) {
  if (typeof window === 'undefined') return;

  imagePaths.forEach((src) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    link.type = 'image/webp';
    document.head.appendChild(link);
  });
}

/**
 * Get optimized Supabase image URL
 * @param {string} src - Original image URL
 * @param {number} width - Desired width
 * @param {number} quality - Image quality (1-100)
 * @returns {string} Optimized image URL
 */
export function getOptimizedImageUrl(src, width, quality = 75) {
  if (!src) return src;

  // For Supabase storage images with transform API
  if (src.includes('supabase') && src.includes('/storage/v1/object/public/')) {
    // Convert to render endpoint for transformations
    const renderUrl = src.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
    return `${renderUrl}?width=${width}&quality=${quality}&format=webp`;
  }

  // Return original URL for non-Supabase images
  return src;
}

/**
 * Generate srcset for responsive images
 * @param {string} src - Image source URL
 * @param {number[]} widths - Array of widths
 * @returns {string} srcset string
 */
export function generateSrcSet(src, widths = [640, 750, 828, 1080, 1200, 1920]) {
  return widths
    .map((width) => `${src}?w=${width} ${width}w`)
    .join(', ');
}