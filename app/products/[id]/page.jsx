'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { createBrowserClient } from '@supabase/ssr';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();

  // Initialize Supabase client
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ));

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Comments state
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [rating, setRating] = useState(0);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Report state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);

  // Favorite state
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const fetchCurrentUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  }, [supabase]);

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images (
            image_url,
            order
          ),
          regencies (
            regency_name
          ),
          provinces (
            province_name
          ),
          categories (
            name
          )
        `)
        .eq('id', params.id)
        .single();

      if (error) throw error;

      // Fetch seller profile separately
      if (data && data.user_id) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.user_id)
          .maybeSingle();

        if (!profileError && profileData) {
          data.profiles = profileData;
        }
      }

      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, params.id]);

  const handleWhatsApp = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const goToLogin = confirm('Anda harus login untuk menghubungi penjual.\n\nApakah Anda ingin pergi ke halaman login?');
      if (goToLogin) {
        router.push('/login');
      }
      return;
    }

    const whatsappNumber = product?.whatsapp_number || product?.phone_number;
    if (whatsappNumber) {
      const message = `Halo, saya tertarik dengan produk: ${product.title}`;
      const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    } else {
      alert('Nomor WhatsApp tidak tersedia');
    }
  };

  const handleCall = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const goToLogin = confirm('Anda harus login untuk menghubungi penjual.\n\nApakah Anda ingin pergi ke halaman login?');
      if (goToLogin) {
        router.push('/login');
      }
      return;
    }

    const phoneNumber = product?.phone_number;
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      alert('Nomor telepon tidak tersedia');
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const closeShareModal = () => {
    setShowShareModal(false);
  };

  const shareToWhatsApp = () => {
    const text = `${product?.title} - Rp ${product?.price?.toLocaleString('id-ID')}\n${window.location.href}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

  const shareToX = () => {
    const text = `${product?.title} - Rp ${product?.price?.toLocaleString('id-ID')}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link berhasil disalin!');
    closeShareModal();
  };

  const fetchComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('product_comments')
        .select('*')
        .eq('product_id', params.id)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const commentsWithReplies = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', comment.user_id)
            .single();

          const { count } = await supabase
            .from('product_comments')
            .select('*', { count: 'exact', head: true })
            .eq('parent_id', comment.id);

          return {
            ...comment,
            user_name: profileData?.full_name || '사용자',
            user_avatar: profileData?.avatar_url,
            reply_count: count || 0
          };
        })
      );

      setComments(commentsWithReplies);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }, [supabase, params.id]);

  const checkFavoriteStatus = useCallback(async () => {
    if (!currentUser) {
      setIsFavorite(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('product_id', params.id)
        .maybeSingle();

      if (error) throw error;
      setIsFavorite(!!data);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  }, [supabase, currentUser, params.id]);

  const toggleFavorite = async () => {
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
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('product_id', params.id);

        if (error) throw error;
        setIsFavorite(false);
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: currentUser.id,
            product_id: params.id
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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    fetchProduct();
    fetchCurrentUser();
    fetchComments();

    return () => window.removeEventListener('resize', checkMobile);
  }, [params.id, fetchComments, fetchCurrentUser, fetchProduct]);

  useEffect(() => {
    if (currentUser) {
      checkFavoriteStatus();
    }
  }, [currentUser, checkFavoriteStatus]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      alert('Silakan login untuk memberikan komentar');
      router.push('/login');
      return;
    }

    if (!commentText.trim()) {
      alert('Komentar tidak boleh kosong');
      return;
    }

    try {
      setSubmittingComment(true);

      const isSeller = product?.user_id === currentUser?.id;

      const { error } = await supabase
        .from('product_comments')
        .insert({
          product_id: params.id,
          user_id: currentUser.id,
          parent_id: replyTo,
          comment: commentText.trim(),
          rating: replyTo ? null : rating,
          is_seller_reply: isSeller && replyTo !== null
        });

      if (error) throw error;

      await fetchComments();

      setCommentText('');
      setRating(0);
      setReplyTo(null);

      alert('Komentar berhasil ditambahkan!');
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Gagal menambahkan komentar. Silakan coba lagi.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReply = (commentId) => {
    if (!currentUser) {
      alert('Silakan login untuk membalas komentar');
      router.push('/login');
      return;
    }
    setReplyTo(commentId);
  };

  const cancelReply = () => {
    setReplyTo(null);
    setCommentText('');
  };

  const handleReport = async () => {
    if (!currentUser) {
      const goToLogin = confirm('Anda harus login untuk melaporkan produk.\n\nApakah Anda ingin pergi ke halaman login?');
      if (goToLogin) {
        router.push('/login');
      }
      return;
    }

    setShowReportModal(true);
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();

    if (!reportReason) {
      alert('Silakan pilih alasan pelaporan');
      return;
    }

    try {
      setSubmittingReport(true);

      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: currentUser.id,
          report_type: 'product',
          reported_product_id: params.id,
          reason: reportReason,
          description: reportDescription.trim() || null,
          status: 'pending'
        });

      if (error) throw error;

      alert('Laporan berhasil dikirim!\n\nTerima kasih atas laporan Anda. Tim kami akan meninjau laporan ini sesegera mungkin.');
      setShowReportModal(false);
      setReportReason('');
      setReportDescription('');
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Gagal mengirim laporan. Silakan coba lagi.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setReportReason('');
    setReportDescription('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111827] pb-[100px]">
        <div className="loading-container">
          <div className="spinner-lg"></div>
          <p>Memuat produk...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#111827] pb-[100px]">
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-10 py-10 text-center">
          <h2 className="text-2xl mb-6 text-[#f9fafb]">Produk tidak ditemukan</h2>
          <button className="btn btn-primary" onClick={() => router.push('/')}>
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  const images = product.product_images?.sort((a, b) => a.order - b.order) || [];
  const currentImage = images[selectedImageIndex]?.image_url || null;

  return (
    <div className="min-h-screen bg-[#111827] pb-[100px]">
      {/* Header */}
      <header className="bg-[#1f2937] border-b border-[#374151] py-4 sticky top-0 z-[100]">
        <div className="container flex items-center justify-between">
          <button className="back-btn" onClick={() => router.back()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Kembali
          </button>
        </div>
      </header>

      <div className="container py-8 px-5">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,900px)_minmax(0,380px)] gap-10 max-w-[1400px] mx-auto items-start justify-center">
          {/* Left Column */}
          <div className="flex flex-col gap-6 lg:contents">
            {/* Image Gallery */}
            <div className="flex flex-col gap-4 order-1 lg:order-1 w-screen -mx-3 px-3 lg:w-auto lg:mx-0 lg:px-0">
              <div className="relative w-full aspect-video bg-[#1f2937] border border-[#374151] rounded-2xl lg:rounded-2xl overflow-hidden flex items-center justify-center">
                {currentImage ? (
                  <Image
                    src={currentImage}
                    alt={product.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 70vw"
                    className="object-cover"
                    priority
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iIzI4MjgyOCIvPjwvc3ZnPg=="
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 w-full h-full text-[#6b7280]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-20 h-20">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span className="text-sm text-[#9ca3af]">Tidak ada gambar</span>
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="grid grid-cols-[repeat(auto-fill,80px)] lg:grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2 lg:gap-3">
                  {images.map((img, index) => (
                    <div
                      key={index}
                      className={`relative aspect-[4/3] bg-[#1f2937] border-2 rounded-xl overflow-hidden cursor-pointer transition-all flex items-center justify-center ${
                        index === selectedImageIndex
                          ? 'border-[#6366f1] shadow-[0_0_0_2px_rgba(99,102,241,0.2)]'
                          : 'border-[#374151] hover:border-[#6366f1]'
                      }`}
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      {img.image_url ? (
                        <Image
                          src={img.image_url}
                          alt={`Thumbnail ${index + 1}`}
                          fill
                          sizes="100px"
                          className="object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-[#6b7280]">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="p-5 lg:p-5 bg-[#1f2937] border border-[#374151] rounded-xl order-2 lg:order-3">
              <h3 className="section-title section-title-md">Detail</h3>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center pb-4 border-b border-[#374151] last:border-b-0 last:pb-0">
                  <span className="text-sm lg:text-sm text-[#9ca3af]">Kondisi</span>
                  <span className="text-sm lg:text-[15px] font-semibold text-[#f9fafb]">{product.condition}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-[#374151] last:border-b-0 last:pb-0">
                  <span className="text-sm lg:text-sm text-[#9ca3af]">Kategori</span>
                  <span className="text-sm lg:text-[15px] font-semibold text-[#f9fafb]">{product.categories?.name}</span>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="p-5 lg:p-5 bg-[#1f2937] border border-[#374151] rounded-xl order-3 lg:order-4">
              <h3 className="section-title section-title-md">Deskripsi</h3>
              <p className="text-sm lg:text-[15px] leading-relaxed text-[#9ca3af] whitespace-pre-wrap">{product.description}</p>

              {/* Share & Report Actions */}
              <div className="flex items-center gap-3 mt-6 lg:mt-6 pt-6 lg:pt-6 border-t border-[#374151]">
                <div className="flex items-center gap-2 lg:gap-2.5 flex-1">
                  <button
                    className="w-10 h-10 lg:w-11 lg:h-11 flex items-center justify-center bg-[#374151] border border-[rgba(37,211,102,0.3)] rounded-[10px] cursor-pointer transition-all hover:bg-[rgba(37,211,102,0.1)] hover:border-[#25D366] hover:-translate-y-0.5"
                    onClick={shareToWhatsApp}
                    title="Bagikan ke WhatsApp"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 lg:w-[22px] h-5 lg:h-[22px] text-[#25D366]">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </button>

                  <button
                    className="w-10 h-10 lg:w-11 lg:h-11 flex items-center justify-center bg-[#374151] border border-[rgba(24,119,242,0.3)] rounded-[10px] cursor-pointer transition-all hover:bg-[rgba(24,119,242,0.1)] hover:border-[#1877F2] hover:-translate-y-0.5"
                    onClick={shareToFacebook}
                    title="Bagikan ke Facebook"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 lg:w-[22px] h-5 lg:h-[22px] text-[#1877F2]">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </button>

                  <button
                    className="w-10 h-10 lg:w-11 lg:h-11 flex items-center justify-center bg-[#374151] border border-[rgba(0,0,0,0.3)] rounded-[10px] cursor-pointer transition-all hover:bg-[rgba(0,0,0,0.1)] hover:border-[#000000] hover:-translate-y-0.5"
                    onClick={shareToX}
                    title="Bagikan ke X"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 lg:w-[22px] h-5 lg:h-[22px] text-[#000000]">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </button>

                  <button
                    className="w-10 h-10 lg:w-11 lg:h-11 flex items-center justify-center bg-[#374151] border border-[rgba(99,102,241,0.3)] rounded-[10px] cursor-pointer transition-all hover:bg-[rgba(99,102,241,0.1)] hover:border-[#6366f1] hover:-translate-y-0.5"
                    onClick={copyLink}
                    title="Salin Link"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 lg:w-[22px] h-5 lg:h-[22px] text-[#6366f1]">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                  </button>

                  <button
                    className={`w-10 h-10 lg:w-11 lg:h-11 flex items-center justify-center rounded-[10px] cursor-pointer transition-all border ${
                      isFavorite
                        ? 'bg-[rgba(239,68,68,0.15)] border-[#ef4444]'
                        : 'bg-[#374151] border-[rgba(239,68,68,0.3)] hover:bg-[rgba(239,68,68,0.1)] hover:border-[#ef4444] hover:-translate-y-0.5'
                    } ${favoriteLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    onClick={toggleFavorite}
                    disabled={favoriteLoading}
                    title={isFavorite ? '찜 취소' : '찜하기'}
                  >
                    <svg viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-5 lg:w-[22px] h-5 lg:h-[22px] text-[#ef4444]">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                </div>

                <button
                  className="w-10 h-10 lg:w-11 lg:h-11 flex items-center justify-center bg-[#374151] border border-[#374151] rounded-[10px] cursor-pointer transition-all hover:bg-[#111827] hover:border-[#9ca3af] hover:-translate-y-0.5 flex-shrink-0"
                  onClick={handleReport}
                  title="Laporkan produk"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 lg:w-[18px] h-4 lg:h-[18px] text-[#9ca3af] hover:text-[#f9fafb]">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <div className="p-4 lg:p-8 bg-[#1f2937] border border-[#374151] rounded-xl lg:rounded-2xl order-4 lg:order-5 mt-4 lg:mt-0">
              <h3 className="section-title section-title-md">Ulasan & Komentar ({comments.length})</h3>

              {/* Comment Form */}
              {currentUser ? (
                <form className="mb-4 lg:mb-8 p-3 lg:p-6 bg-[#111827] border border-[#374151] rounded-xl" onSubmit={handleSubmitComment}>
                  {replyTo && (
                    <div className="flex items-center justify-between px-4 py-2 bg-[#374151] rounded-lg mb-4 text-sm text-[#9ca3af]">
                      <span>Membalas komentar...</span>
                      <button type="button" onClick={cancelReply} className="bg-transparent border-0 text-[#9ca3af] text-xl cursor-pointer px-2 py-0 transition-colors hover:text-[#ef4444]">
                        ✕
                      </button>
                    </div>
                  )}

                  {!replyTo && (
                    <div className="flex items-center gap-2 lg:gap-3 mb-3 lg:mb-4">
                      <span className="text-sm lg:text-sm font-semibold text-[#9ca3af]">Rating:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`bg-transparent border-0 text-2xl lg:text-[32px] cursor-pointer transition-all p-0 ${
                            star <= rating ? 'text-[#FFD700] scale-110' : 'text-[#374151]'
                          } hover:text-[#FFD700] hover:scale-110`}
                          onClick={() => setRating(star)}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  )}

                  <textarea
                    className="w-full min-h-[80px] lg:min-h-[100px] p-3 lg:p-4 bg-[#1f2937] border border-[#374151] rounded-lg text-[#f9fafb] text-sm lg:text-[15px] font-sans leading-relaxed resize-vertical outline-none transition-colors focus:border-[#6366f1]"
                    placeholder={replyTo ? "Tulis balasan..." : "Tulis komentar Anda..."}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={3}
                    maxLength={1000}
                  />

                  <div className="flex items-center justify-between mt-3 lg:mt-4">
                    <span className="char-count">{commentText.length}/1000</span>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submittingComment || !commentText.trim()}
                    >
                      {submittingComment ? 'Mengirim...' : replyTo ? 'Kirim Balasan' : 'Kirim Komentar'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-6 lg:py-10 px-4 lg:px-5 bg-[#111827] border border-[#374151] rounded-xl mb-4 lg:mb-8">
                  <p className="text-sm lg:text-[15px] text-[#9ca3af] mb-3 lg:mb-4">Silakan login untuk memberikan komentar</p>
                  <button className="btn btn-primary" onClick={() => router.push('/login')}>
                    Login
                  </button>
                </div>
              )}

              {/* Comments List */}
              <div className="flex flex-col gap-3 lg:gap-5">
                {comments.length === 0 ? (
                  <div className="text-center py-2.5 lg:py-[60px] px-2.5 lg:px-5 text-[#9ca3af] text-sm lg:text-[15px]">
                    <p>Belum ada komentar. Jadilah yang pertama!</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="p-3 lg:p-6 bg-[#111827] border border-[#374151] rounded-xl transition-all hover:border-[#6366f1]">
                      <div className="flex items-start justify-between mb-3 lg:mb-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-9 h-9 lg:w-12 lg:h-12 bg-[#374151] border border-[#374151] rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {comment.user_avatar ? (
                              <Image src={comment.user_avatar} alt={comment.user_name} fill />
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] lg:w-6 h-[18px] lg:h-6 text-[#9ca3af]">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                              </svg>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm lg:text-[15px] font-semibold text-[#f9fafb] flex items-center gap-2">
                              {comment.user_name}
                              {comment.is_seller_reply && (
                                <span className="px-2 py-0.5 bg-[#6366f1] text-white text-[10px] lg:text-[11px] font-semibold rounded-xl">Penjual</span>
                              )}
                            </span>
                            <span className="text-xs lg:text-[13px] text-[#6b7280]">
                              {new Date(comment.created_at).toLocaleDateString('id-ID', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                        {comment.rating && (
                          <div className="flex gap-1">
                            {[...Array(comment.rating)].map((_, i) => (
                              <span key={i} className="text-base lg:text-lg text-[#FFD700]">★</span>
                            ))}
                            {[...Array(5 - comment.rating)].map((_, i) => (
                              <span key={i} className="text-base lg:text-lg text-[#374151]">★</span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mb-3 lg:mb-4">
                        <p className="text-sm lg:text-[15px] leading-normal lg:leading-relaxed text-[#9ca3af] whitespace-pre-wrap">{comment.comment}</p>
                      </div>

                      <div className="flex gap-4">
                        <button
                          className="flex items-center gap-1.5 bg-transparent border-0 text-[#9ca3af] text-sm lg:text-sm font-medium cursor-pointer py-1 px-3 rounded-md transition-all hover:bg-[#374151] hover:text-[#f9fafb]"
                          onClick={() => handleReply(comment.id)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 lg:w-4 h-3.5 lg:h-4">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                          </svg>
                          Balas ({comment.reply_count})
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="sticky top-[90px] flex flex-col gap-5 order-5 lg:order-2">
            {/* Price & Title */}
            <div className="pb-4 lg:pb-6 border-b border-[#374151]">
              <h1 className="text-[15px] lg:text-[22px] font-semibold lg:font-bold text-[#f9fafb] mb-2.5 lg:mb-4 leading-normal lg:leading-snug break-words">
                {product.title}
              </h1>
              <div className="flex items-center gap-3">
                <span className="text-lg lg:text-[26px] font-bold text-[#6366f1]">
                  Rp {product.price?.toLocaleString('id-ID')}
                </span>
                {product.is_negotiable && (
                  <span className="px-2.5 lg:px-3 py-1 lg:py-1.5 bg-[rgba(99,102,241,0.1)] border border-[#6366f1] rounded-[20px] text-[11px] lg:text-[13px] font-semibold text-[#6366f1]">
                    Bisa Nego
                  </span>
                )}
              </div>
            </div>

            {/* Location & Date */}
            <div className="flex flex-col gap-2.5 lg:gap-3 pb-4 lg:pb-6 border-b border-[#374151]">
              <div className="flex items-center gap-2.5 text-[#9ca3af] text-sm lg:text-[15px]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 lg:w-[18px] h-4 lg:h-[18px] text-[#6366f1]">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span>
                  {
                    [product.regencies?.regency_name, product.provinces?.province_name]
                      .filter(Boolean)
                      .join(', ')
                      || 'Lokasi tidak tersedia'
                  }
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-[#9ca3af] text-sm lg:text-[15px]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 lg:w-[18px] h-4 lg:h-[18px] text-[#6366f1]">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>{new Date(product.created_at).toLocaleDateString('id-ID')}</span>
              </div>
            </div>

            {/* Seller Info */}
            <div className="p-5 bg-[#1f2937] border border-[#374151] rounded-xl hidden lg:block">
              <h3 className="section-title section-title-md">Penjual</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#374151] border border-[#374151] rounded-full flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-[#9ca3af]">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-base font-semibold text-[#f9fafb]">{product.profiles?.full_name || 'Penjual'}</span>
                  <span className="text-[13px] text-[#10b981]">Aktif</span>
                </div>
              </div>
            </div>

            {/* Contact Buttons - Desktop */}
            {!isMobile && (product?.whatsapp_number || product?.phone_number) && (() => {
              const hasPhone = !!product?.phone_number;
              const hasWhatsApp = !!product?.whatsapp_number;

              return (
                <div className="flex flex-col gap-3">
                  {hasWhatsApp && (
                    <button
                      className="flex items-center justify-center gap-2.5 px-6 py-4 rounded-[10px] text-base font-semibold cursor-pointer transition-all border-0 bg-[#25D366] text-white hover:bg-[#22c55e] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(37,211,102,0.3)]"
                      onClick={handleWhatsApp}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Chat via WhatsApp
                    </button>
                  )}
                  {hasPhone && (
                    <button
                      className="flex items-center justify-center gap-2.5 px-6 py-4 rounded-[10px] text-base font-semibold cursor-pointer transition-all bg-[#374151] text-[#f9fafb] border border-[#374151] hover:bg-[#1f2937] hover:border-[#6366f1]"
                      onClick={handleCall}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      Telepon
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Actions */}
      {isMobile && (product?.whatsapp_number || product?.phone_number) && (() => {
        const hasPhone = !!product?.phone_number;
        const hasWhatsApp = !!product?.whatsapp_number;

        return (
          <div className="fixed bottom-0 left-0 right-0 bg-[#1f2937] border-t border-[#374151] p-3 grid gap-3 z-[1000]" style={{ gridTemplateColumns: hasPhone && hasWhatsApp ? '1fr 2fr' : '1fr' }}>
            {hasPhone && (
              <button
                className="flex items-center justify-center gap-2 py-2.5 px-2.5 rounded-[10px] text-[15px] font-semibold cursor-pointer transition-all border-0 bg-[#374151] text-[#f9fafb] border border-[#374151]"
                onClick={handleCall}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px]">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                Telepon
              </button>
            )}
            {hasWhatsApp && (
              <button
                className="flex items-center justify-center gap-2 py-2.5 px-2.5 rounded-[10px] text-[15px] font-semibold cursor-pointer transition-all border-0 bg-[#25D366] text-white"
                onClick={handleWhatsApp}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Chat via WhatsApp
              </button>
            )}
          </div>
        );
      })()}

      {/* SNS Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex items-center justify-center z-[10000] p-5 backdrop-blur-sm" onClick={closeShareModal}>
          <div className="bg-[#1f2937] border border-[#374151] rounded-2xl w-full max-w-[420px] max-h-[90vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-[modalSlideIn_0.3s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 lg:p-6 border-b border-[#374151]">
              <h3 className="text-lg lg:text-xl font-bold text-[#f9fafb]">Bagikan Produk</h3>
              <button className="w-9 h-9 flex items-center justify-center bg-[#374151] border border-[#374151] rounded-full cursor-pointer transition-all hover:bg-[#111827] hover:border-[#ef4444]" onClick={closeShareModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] text-[#9ca3af]">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="p-5 lg:p-6">
              <div className="grid grid-cols-2 gap-3 lg:gap-4">
                <button className="flex flex-col items-center justify-center gap-3 py-5 lg:py-6 px-3 lg:px-4 bg-[#374151] border border-[rgba(37,211,102,0.3)] rounded-xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.3)] hover:bg-[rgba(37,211,102,0.1)] hover:border-[#25D366]" onClick={shareToWhatsApp}>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 lg:w-10 h-8 lg:h-10 text-[#25D366]">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span className="text-sm lg:text-sm font-semibold text-[#f9fafb]">WhatsApp</span>
                </button>

                <button className="flex flex-col items-center justify-center gap-3 py-5 lg:py-6 px-3 lg:px-4 bg-[#374151] border border-[rgba(24,119,242,0.3)] rounded-xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.3)] hover:bg-[rgba(24,119,242,0.1)] hover:border-[#1877F2]" onClick={shareToFacebook}>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 lg:w-10 h-8 lg:h-10 text-[#1877F2]">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="text-sm lg:text-sm font-semibold text-[#f9fafb]">Facebook</span>
                </button>

                <button className="flex flex-col items-center justify-center gap-3 py-5 lg:py-6 px-3 lg:px-4 bg-[#374151] border border-[rgba(0,0,0,0.3)] rounded-xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.3)] hover:bg-[rgba(0,0,0,0.1)] hover:border-[#000000]" onClick={shareToX}>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 lg:w-10 h-8 lg:h-10 text-[#000000]">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span className="text-sm lg:text-sm font-semibold text-[#f9fafb]">X</span>
                </button>

                <button className="flex flex-col items-center justify-center gap-3 py-5 lg:py-6 px-3 lg:px-4 bg-[#374151] border border-[rgba(99,102,241,0.3)] rounded-xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.3)] hover:bg-[rgba(99,102,241,0.1)] hover:border-[#6366f1]" onClick={copyLink}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 lg:w-10 h-8 lg:h-10 text-[#6366f1]">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                  <span className="text-sm lg:text-sm font-semibold text-[#f9fafb]">Salin Link</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex items-center justify-center z-[10000] p-5 backdrop-blur-sm" onClick={closeReportModal}>
          <div className="bg-[#1f2937] border border-[#374151] rounded-2xl w-full max-w-[calc(100%-32px)] lg:max-w-[500px] max-h-[90vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-[modalSlideIn_0.3s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 lg:p-6 border-b border-[#374151]">
              <h3 className="text-lg lg:text-xl font-bold text-[#f9fafb]">Laporkan Produk</h3>
              <button className="w-9 h-9 flex items-center justify-center bg-[#374151] border border-[#374151] rounded-full cursor-pointer transition-all hover:bg-[#111827] hover:border-[#ef4444]" onClick={closeReportModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] text-[#9ca3af]">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitReport}>
              <div className="p-5 lg:p-6">
                <p className="text-sm lg:text-sm leading-relaxed text-[#9ca3af] mb-5 lg:mb-6 p-3 lg:p-4 bg-[rgba(99,102,241,0.05)] border-l-[3px] border-l-[#6366f1] rounded-lg">
                  Jika Anda menemukan masalah dengan produk ini, silakan laporkan kepada kami.
                  Laporan Anda akan membantu kami menjaga keamanan marketplace.
                </p>

                <div className="form-group">
                  <label className="form-label">Alasan Pelaporan *</label>
                  <select
                    className="form-input"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    required
                  >
                    <option value="">Pilih alasan...</option>
                    <option value="fraud">Penipuan / Scam</option>
                    <option value="fake">Produk Palsu</option>
                    <option value="spam">Spam</option>
                    <option value="inappropriate">Konten Tidak Pantas</option>
                    <option value="duplicate">Duplikat</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Keterangan (Opsional)</label>
                  <textarea
                    className="form-input"
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Jelaskan masalah yang Anda temukan..."
                    rows={4}
                    maxLength={500}
                  />
                  <span className="char-count">{reportDescription.length}/500</span>
                </div>
              </div>

              <div className="flex gap-2.5 lg:gap-3 p-4 lg:p-5 border-t border-[#374151] bg-[#374151] rounded-b-2xl">
                <button
                  type="button"
                  className="flex-1 py-3 lg:py-3.5 px-5 lg:px-6 bg-[#1f2937] border border-[#374151] rounded-[10px] text-[#f9fafb] text-sm lg:text-[15px] font-semibold cursor-pointer transition-all hover:bg-[#111827] hover:border-[#9ca3af] disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={closeReportModal}
                  disabled={submittingReport}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 lg:py-3.5 px-5 lg:px-6 bg-[#ef4444] border border-[#ef4444] rounded-[10px] text-white text-sm lg:text-[15px] font-semibold cursor-pointer transition-all hover:bg-[#dc2626] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(239,68,68,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submittingReport || !reportReason}
                >
                  {submittingReport ? 'Mengirim...' : 'Kirim Laporan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
