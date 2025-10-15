'use client';

import { useState, useEffect } from 'react';
import { useSupabaseClient } from './SupabaseClientProvider';

/**
 * Advertisement component - displays ads based on position and device type
 * @param {object} props
 * @param {'header' | 'sidebar' | 'footer' | 'between_products' | 'product_detail'} props.position - Where the ad should be displayed
 * @param {string} [props.className] - Additional CSS classes
 */
export default function Advertisement({ position, className = '' }) {
  const supabase = useSupabaseClient();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect device type
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const deviceType = isMobile ? 'mobile' : 'pc';

        const { data, error } = await supabase
          .from('advertisements')
          .select('*')
          .eq('position', position)
          .eq('is_active', true)
          .in('device_type', [deviceType, 'both'])
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Randomly select one ad if multiple ads exist
        if (data && data.length > 0) {
          const randomIndex = Math.floor(Math.random() * data.length);
          setAds([data[randomIndex]]);
        } else {
          setAds([]);
        }
      } catch (error) {
        console.error('Error fetching advertisements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [supabase, position, isMobile]);

  if (loading || ads.length === 0) {
    return null;
  }

  return (
    <div className={`advertisement-container ${className}`}>
      {ads.map((ad) => (
        <div
          key={ad.id}
          className="advertisement-item"
          dangerouslySetInnerHTML={{ __html: ad.ad_code }}
        />
      ))}
    </div>
  );
}
