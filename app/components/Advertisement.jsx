'use client';

import { useState, useEffect } from 'react';
import { useSupabaseClient } from './SupabaseClientProvider';

/**
 * Advertisement component - displays ads based on position
 * @param {object} props
 * @param {'header' | 'sidebar' | 'footer' | 'between_products' | 'product_detail'} props.position - Where the ad should be displayed
 * @param {string} [props.className] - Additional CSS classes
 */
export default function Advertisement({ position, className = '' }) {
  const supabase = useSupabaseClient();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const { data, error } = await supabase
          .from('advertisements')
          .select('*')
          .eq('position', position)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAds(data || []);
      } catch (error) {
        console.error('Error fetching advertisements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [supabase, position]);

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
