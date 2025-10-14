'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import './ProductCard.css';

/**
 * 상품 정보를 표시하는 공통 카드 컴포넌트
 * @param {object} props
 * @param {object} props.product - 상품 정보 객체
 * @param {'home' | 'profile'} [props.context='home'] - 카드가 사용되는 컨텍스트 (UI 분기용)
 * @param {function} [props.onDelete] - 삭제 버튼 클릭 시 호출될 함수 (profile 컨텍스트용)
 */
export default function ProductCard({ product, context = 'home', onDelete }) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, [supabase]);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!currentUser || !product?.id) return;

      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', currentUser.id)
          .eq('product_id', product.id)
          .maybeSingle();

        if (error) throw error;
        setIsFavorite(!!data);
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };

    checkFavoriteStatus();
  }, [currentUser, product?.id, supabase]);

  if (!product) return null;

  const handleCardClick = () => {
    router.push(`/products/${product.id}`);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    router.push(`/products/${product.id}/edit`);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(product.id);
    }
  };

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();

    if (!currentUser) {
      const goToLogin = confirm('좋아요를 하려면 로그인이 필요합니다.\n\n로그인 페이지로 이동하시겠습니까?');
      if (goToLogin) {
        router.push('/login');
      }
      return;
    }

    if (favoriteLoading) return;

    try {
      setFavoriteLoading(true);

      if (isFavorite) {
        // 좋아요 취소
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('product_id', product.id);

        if (error) throw error;
        setIsFavorite(false);
      } else {
        // 좋아요 추가
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: currentUser.id,
            product_id: product.id
          });

        if (error) throw error;
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('좋아요 처리 중 오류가 발생했습니다.');
    } finally {
      setFavoriteLoading(false);
    }
  };

  return (
    <div className="product-card" onClick={handleCardClick}>
      <div className="product-image">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="product-img"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=="
          />
        ) : (
          <div className="product-no-image">이미지 없음</div>
        )}

        {context === 'home' && (
          <button
            className={`favorite-btn ${isFavorite ? 'favorite-active' : ''}`}
            onClick={handleFavoriteClick}
            disabled={favoriteLoading}
            title={isFavorite ? '찜 취소' : '찜하기'}
          >
            <svg viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        )}

        {context === 'profile' && product.status && (
            <div className={`product-status ${product.status === 'active' ? 'active' : ''}`}>
                {product.status === 'active' ? '판매중' : '판매완료'}
            </div>
        )}
      </div>

      <div className="product-info">
        <h4 className="product-title">{product.title}</h4>
        <p className="product-price">Rp {product.price?.toLocaleString('id-ID') || 0}</p>
        <p className="product-location">📍 {product.city || ''}, {product.province || ''}</p>
        


        {context === 'profile' && (
          <div className="product-actions">
            <button className="action-btn edit-btn" onClick={handleEditClick}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              수정
            </button>
            <button className="action-btn delete-btn" onClick={handleDeleteClick}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              삭제
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
