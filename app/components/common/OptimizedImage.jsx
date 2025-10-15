'use client';

import Image from 'next/image';
import { generateBlurPlaceholder, getOptimizedImageUrl } from '../../utils/imageOptimization';

/**
 * Optimized Image Component with automatic LCP detection
 *
 * This component automatically applies performance optimizations based on:
 * - Whether it's likely to be an LCP element (hero images, product main images)
 * - Image position and viewport visibility
 * - Context (home page, product detail, etc.)
 *
 * @param {Object} props - Component props
 * @param {string} props.src - Image source URL
 * @param {string} props.alt - Alt text for accessibility
 * @param {boolean} [props.isLCP=false] - Explicitly mark as LCP element
 * @param {boolean} [props.isAboveFold=false] - Image is above the fold
 * @param {'home' | 'product-detail' | 'product-card' | 'thumbnail'} [props.context='home'] - Usage context
 * @param {number} [props.index=0] - Index in a list (for determining priority)
 * @param {Object} props...rest - Other Next.js Image props
 */
export default function OptimizedImage({
  src,
  alt,
  isLCP = false,
  isAboveFold = false,
  context = 'home',
  index = 0,
  sizes,
  className,
  fill,
  width,
  height,
  ...rest
}) {
  // Determine if this image should be prioritized
  const shouldPrioritize = () => {
    // Explicit LCP marking
    if (isLCP) return true;

    // Context-based priority
    switch (context) {
      case 'product-detail':
        // Main product image is always LCP
        return index === 0;

      case 'product-card':
        // First 2 product cards on home page are likely LCP (mobile) or first 4 (desktop)
        return index < 2;

      case 'home':
        // Above fold images on home page
        return isAboveFold || index < 4;

      case 'thumbnail':
        // Thumbnails are never LCP
        return false;

      default:
        return false;
    }
  };

  const isPriority = shouldPrioritize();

  // Determine sizes if not provided
  const imageSizes = sizes || (() => {
    switch (context) {
      case 'product-detail':
        return "(max-width: 768px) 100vw, 70vw";
      case 'product-card':
        // More precise sizing for product cards to reduce bandwidth
        return "(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 220px";
      case 'thumbnail':
        return "100px";
      default:
        return "(max-width: 768px) 100vw, 50vw";
    }
  })();

  // Generate blur placeholder dimensions based on context
  const getPlaceholderDimensions = () => {
    switch (context) {
      case 'product-detail':
        return { width: 8, height: 6 }; // 4:3 aspect ratio
      case 'product-card':
        return { width: 4, height: 3 }; // 4:3 aspect ratio
      case 'thumbnail':
        return { width: 2, height: 2 }; // 1:1 aspect ratio
      default:
        return { width: 4, height: 3 };
    }
  };

  const { width: placeholderWidth, height: placeholderHeight } = getPlaceholderDimensions();

  // Optimize Supabase images if needed
  const optimizedSrc = src.includes('supabase')
    ? getOptimizedImageUrl(src, width || 800, isPriority ? 80 : 65)
    : src;

  return (
    <Image
      src={optimizedSrc}
      alt={alt}
      sizes={imageSizes}
      className={className}
      fill={fill}
      width={width}
      height={height}
      // Performance optimizations
      priority={isPriority}
      loading={isPriority ? undefined : "lazy"}
      fetchPriority={isPriority ? "high" : undefined}
      quality={isPriority ? 80 : 65}
      placeholder="blur"
      blurDataURL={generateBlurPlaceholder(placeholderWidth, placeholderHeight)}
      // Error handling
      onLoadingComplete={(result) => {
        if (typeof window !== 'undefined' && result.naturalWidth === 0) {
          console.error('Broken image detected:', src);
        }
      }}
      {...rest}
    />
  );
}