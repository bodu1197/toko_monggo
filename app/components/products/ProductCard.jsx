'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseClient } from '../SupabaseClientProvider';
import OptimizedImage from '../common/OptimizedImage';

/**
 * 상품 정보를 표시하는 공통 카드 컴포넌트 - Tailwind CSS v4
 * @param {object} props
 * @param {object} props.product - 상품 정보 객체
 * @param {'home' | 'profile'} [props.context='home'] - 카드가 사용되는 컨텍스트 (UI 분기용)
 * @param {function} [props.onDelete] - 삭제 버튼 클릭 시 호출될 함수 (profile 컨텍스트용)
 * @param {function} [props.onStatusChange] - 상태 변경 버튼 클릭 시 호출될 함수 (profile 컨텍스트용)
 * @param {function} [props.onRenew] - 갱신 버튼 클릭 시 호출될 함수 (profile 컨텍스트용)
 * @param {boolean} [props.priority=false] - LCP 이미지 우선 로딩 (첫 번째 카드용)
 */
export default function ProductCard({ product, context = 'home', onDelete, onStatusChange, onRenew, priority = false, index = 0 }) {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, [supabase]);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!currentUser || !product?.slug) return;

      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', currentUser.id)
          .eq('product_slug', product.slug)
          .maybeSingle();

        if (error) throw error;
        setIsFavorite(!!data);
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };

    checkFavoriteStatus();
  }, [currentUser, product?.slug, supabase]);

  if (!product) return null;

  const handleCardClick = () => {
    router.push(`/products/${product.slug}`);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    router.push(`/products/${product.slug}/edit`);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(product.slug);
    }
  };

  const handleStatusChange = (e) => {
    e.stopPropagation();
    if (onStatusChange) {
      onStatusChange(product.slug, product.status);
    }
  };

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();

    if (!currentUser) {
      const goToLogin = confirm('Anda harus login untuk menyukai produk.\n\nApakah Anda ingin pergi ke halaman login?');
      if (goToLogin) {
        router.push('/login');
      }
      return;
    }

    if (favoriteLoading) return;

    try {
      setFavoriteLoading(true);

      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('product_slug', product.slug);

        if (error) throw error;
        setIsFavorite(false);
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: currentUser.id,
            product_slug: product.slug
          });

        if (error) throw error;
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Terjadi kesalahan saat memproses favorit.');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleRenewClick = (e) => {
    e.stopPropagation();
    if (onRenew) {
      onRenew(product.slug);
    }
  };

  // Calculate expiry status
  const getExpiryInfo = () => {
    if (!product.expires_at) return null;

    const now = new Date();
    const expiresAt = new Date(product.expires_at);
    const daysRemaining = Math.floor((expiresAt - now) / (1000 * 60 * 60 * 24));

    const isExpired = daysRemaining < 0;
    const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7;

    return {
      daysRemaining,
      isExpired,
      isExpiringSoon,
      message: isExpired ? 'Iklan berakhir' : isExpiringSoon ? `Berakhir ${daysRemaining} hari lagi` : null
    };
  };

  const expiryInfo = getExpiryInfo();

  return (
    <div
      className="bg-white rounded-xl overflow-hidden shadow-[0_4px_6px_rgba(0,0,0,0.05)] transition-all duration-200 cursor-pointer flex flex-col hover:-translate-y-[5px] hover:shadow-[0_10px_15px_rgba(0,0,0,0.1)]"
      onClick={handleCardClick}
    >
      <div className="relative w-full h-[180px] md:h-[160px] bg-gray-100">
        {product.image ? (
          <OptimizedImage
            src={product.image}
            alt={product.title}
            fill
            context="product-card"
            index={index}
            className="object-cover"
          />
        ) : (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-gray-400 text-sm">
            Tidak ada gambar
          </div>
        )}

        {context === 'home' && (
          <button
            className={`absolute top-3 right-3 w-9 h-9 flex items-center justify-center border-none rounded-full cursor-pointer transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
              isFavorite
                ? 'bg-[rgba(239,68,68,0.9)] hover:bg-[rgba(239,68,68,1)]'
                : 'bg-white/80 hover:bg-white'
            }`}
            onClick={handleFavoriteClick}
            disabled={favoriteLoading}
            title={isFavorite ? 'Hapus favorit' : 'Tambah ke favorit'}
            aria-label={isFavorite ? 'Hapus dari favorit' : 'Tambah ke favorit'}
          >
            <svg
              viewBox="0 0 24 24"
              fill={isFavorite ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              className={`w-5 h-5 ${isFavorite ? 'text-white' : 'text-gray-400'}`}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        )}

        {context === 'profile' && product.status && (
          <div className={`absolute top-2.5 left-2.5 text-white px-2 py-1 rounded-md text-xs font-medium ${
            product.status === 'active' ? 'bg-emerald-500' :
            product.status === 'paused' ? 'bg-amber-500' :
            'bg-black/60'
          }`}>
            {product.status === 'active' ? 'Dijual' : product.status === 'paused' ? 'Dijeda' : 'Terjual'}
          </div>
        )}
      </div>

      <div className="p-4 md:p-3.5 flex flex-col bg-gray-800 min-h-[120px] md:min-h-[110px]">
        <div className="text-base md:text-[15px] font-semibold text-white m-0 mb-auto pb-2.5 h-12 md:h-[45px] leading-[1.5] overflow-hidden text-ellipsis [-webkit-line-clamp:2] [-webkit-box-orient:vertical] [display:-webkit-box]">
          {product.title}
        </div>
        <p className="text-lg md:text-[17px] font-bold text-emerald-500 my-2 md:my-1.5 mb-1">
          Rp {product.price?.toLocaleString('id-ID') || 0}
        </p>
        <p className="text-[13px] text-gray-300 m-0">
          📍 {product.city || ''}, {product.province || ''}
        </p>

        {context === 'profile' && (
          <>
            {/* Expiry Warning */}
            {expiryInfo && (expiryInfo.isExpired || expiryInfo.isExpiringSoon) && (
              <div className={`px-2.5 py-1.5 rounded-md text-xs font-medium mt-2 text-center ${
                expiryInfo.isExpired ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {expiryInfo.message}
              </div>
            )}

            <div className="mt-auto flex gap-2">
              {/* Renew button for expired or expiring products */}
              {expiryInfo && (expiryInfo.isExpired || expiryInfo.isExpiringSoon) && onRenew && (
                <button
                  className="flex-1 px-2 py-2 rounded-lg border border-emerald-500 bg-emerald-500 text-white cursor-pointer text-sm font-medium flex items-center justify-center gap-1.5 transition-colors duration-200 hover:bg-emerald-600"
                  onClick={handleRenewClick}
                  title="Perpanjang iklan 30 hari"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <path d="M23 4v6h-6M1 20v-6h6"/>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  </svg>
                  Perpanjang
                </button>
              )}

              <button
                className={`flex-1 px-2 py-2 rounded-lg border border-gray-300 bg-white cursor-pointer text-sm font-medium flex items-center justify-center gap-1.5 transition-colors duration-200 hover:bg-gray-50 ${
                  product.status === 'paused' ? 'text-emerald-500' : 'text-amber-500'
                }`}
                onClick={handleStatusChange}
                title={product.status === 'paused' ? 'Lanjutkan penjualan' : 'Jeda penjualan'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  {product.status === 'paused' ? (
                    <polygon points="5 3 19 12 5 21 5 3" />
                  ) : (
                    <>
                      <rect x="6" y="4" width="4" height="16"/>
                      <rect x="14" y="4" width="4" height="16"/>
                    </>
                  )}
                </svg>
                {product.status === 'paused' ? 'Lanjutkan' : 'Jeda'}
              </button>
              <button
                className="flex-1 px-2 py-2 rounded-lg border border-gray-300 bg-white cursor-pointer text-sm font-medium flex items-center justify-center gap-1.5 transition-colors duration-200 hover:bg-gray-50 text-blue-500"
                onClick={handleEditClick}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </button>
              <button
                className="flex-1 px-2 py-2 rounded-lg border border-gray-300 bg-white cursor-pointer text-sm font-medium flex items-center justify-center gap-1.5 transition-colors duration-200 hover:bg-gray-50 text-red-500"
                onClick={handleDeleteClick}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Hapus
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
