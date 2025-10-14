'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { createBrowserClient } from '@supabase/ssr';
import './detail.css';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // 댓글 상태
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [rating, setRating] = useState(0);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // 신고 상태
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // SNS 공유 모달 상태
  const [showShareModal, setShowShareModal] = useState(false);

  const fetchCurrentUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  }, [supabase, setCurrentUser]);

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

      console.log('📍 Product regency_id:', data?.regency_id);
      console.log('📍 Product regencies object:', data?.regencies);
      console.log('📍 Product provinces object:', data?.provinces);
      console.log('📍 Regency name:', data?.regencies?.regency_name);
      console.log('📍 Province name:', data?.provinces?.province_name);

      // Fetch seller profile separately (only name)
      if (data && data.user_id) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.user_id)
          .maybeSingle();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
        } else {
          console.log('✅ Seller profile loaded:', profileData);
        }

        data.profiles = profileData;
      }

      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, setLoading, setProduct, params.id]);

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

  const shareToTwitter = () => {
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
  }, [supabase, params.id, setComments]);

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
      <div className="detail-page">
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Memuat produk...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="detail-page">
        <div className="error-container">
          <h2>Produk tidak ditemukan</h2>
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
    <div className="detail-page">
      {/* Header */}
      <header className="detail-header">
        <div className="container">
          <button className="back-btn" onClick={() => router.back()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Kembali
          </button>
          <div className="header-actions">
            <button className="icon-btn" onClick={handleShare}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </button>
            <button className="icon-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="detail-content container">
        <div className="detail-layout">
          {/* Left Column: Image + Detail + Description + Comments */}
          <div className="left-column">
            {/* Image Gallery */}
            <div className="image-section">
              <div className="main-image">
                {currentImage ? (
                  <Image
                    src={currentImage}
                    alt={product.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 70vw"
                    className="detail-img"
                    priority
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iIzI4MjgyOCIvPjwvc3ZnPg=="
                  />
                ) : (
                  <div className="image-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span>Tidak ada gambar</span>
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="image-thumbnails">
                  {images.map((img, index) => (
                    <div
                      key={index}
                      className={`thumbnail ${index === selectedImageIndex ? 'active' : ''}`}
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      {img.image_url ? (
                        <Image
                          src={img.image_url}
                          alt={`Thumbnail ${index + 1}`}
                          fill
                          sizes="100px"
                          className="thumbnail-img"
                          loading="lazy"
                        />
                      ) : (
                        <div className="thumbnail-placeholder">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="details-section">
              <h3 className="section-title">Detail</h3>
              <div className="detail-list">
                <div className="detail-item">
                  <span className="detail-label">Kondisi</span>
                  <span className="detail-value">{product.condition}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Kategori</span>
                  <span className="detail-value">{product.categories?.name}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="description-section">
              <h3 className="section-title">Deskripsi</h3>
              <p className="product-description">{product.description}</p>

              {/* Share & Report Actions */}
              <div className="product-actions">
                <button className="action-btn share-btn" onClick={handleShare}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3"/>
                    <circle cx="6" cy="12" r="3"/>
                    <circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                  Bagikan
                </button>
                <button className="icon-report-btn" onClick={handleReport} title="Laporkan produk">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Comments/Reviews Section */}
            <div className="comments-section">
              <h3 className="section-title">Ulasan & Komentar ({comments.length})</h3>

              {/* Comment Form */}
              {currentUser ? (
                <form className="comment-form" onSubmit={handleSubmitComment}>
                  {replyTo && (
                    <div className="reply-indicator">
                      <span>Membalas komentar...</span>
                      <button type="button" onClick={cancelReply} className="cancel-reply-btn">
                        ✕
                      </button>
                    </div>
                  )}

                  {!replyTo && (
                    <div className="rating-input">
                      <span>Rating:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`star-btn ${star <= rating ? 'active' : ''}`}
                          onClick={() => setRating(star)}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  )}

                  <textarea
                    className="comment-input"
                    placeholder={replyTo ? "Tulis balasan..." : "Tulis komentar Anda..."}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={3}
                    maxLength={1000}
                  />

                  <div className="comment-form-actions">
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
                <div className="login-prompt">
                  <p>Silakan login untuk memberikan komentar</p>
                  <button className="btn btn-primary" onClick={() => router.push('/login')}>
                    Login
                  </button>
                </div>
              )}

              {/* Comments List */}
              <div className="comments-list">
                {comments.length === 0 ? (
                  <div className="empty-comments">
                    <p>Belum ada komentar. Jadilah yang pertama!</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="comment-item">
                      <div className="comment-header">
                        <div className="comment-user">
                          <div className="user-avatar">
                            {comment.user_avatar ? (
                              <Image src={comment.user_avatar} alt={comment.user_name} fill />
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                              </svg>
                            )}
                          </div>
                          <div className="user-info">
                            <span className="user-name">
                              {comment.user_name}
                              {comment.is_seller_reply && (
                                <span className="seller-badge">Penjual</span>
                              )}
                            </span>
                            <span className="comment-date">
                              {new Date(comment.created_at).toLocaleDateString('id-ID', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                        {comment.rating && (
                          <div className="comment-rating">
                            {[...Array(comment.rating)].map((_, i) => (
                              <span key={i} className="star filled">★</span>
                            ))}
                            {[...Array(5 - comment.rating)].map((_, i) => (
                              <span key={i} className="star">★</span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="comment-body">
                        <p>{comment.comment}</p>
                      </div>

                      <div className="comment-actions">
                        <button className="reply-btn" onClick={() => handleReply(comment.id)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

          {/* Right Sidebar: Price & Seller Info */}
          <div className="right-sidebar">
            {/* Price & Title */}
            <div className="product-header">
              <h1 className="product-title">{product.title}</h1>
              <div className="price-section">
                <span className="product-price">
                  Rp {product.price?.toLocaleString('id-ID')}
                </span>
                {product.is_negotiable && (
                  <span className="negotiable-badge">Bisa Nego</span>
                )}
              </div>
            </div>

            {/* Location & Date */}
            <div className="product-meta">
              <div className="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              <div className="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>{new Date(product.created_at).toLocaleDateString('id-ID')}</span>
              </div>
            </div>

            {/* Seller Info */}
            <div className="seller-section">
              <h3 className="section-title">Penjual</h3>
              <div className="seller-info">
                <div className="seller-avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div className="seller-details">
                  <span className="seller-name">{product.profiles?.full_name || 'Penjual'}</span>
                  <span className="seller-status">Aktif</span>
                </div>
              </div>
            </div>

            {/* Contact Buttons - Desktop */}
            {!isMobile && (product?.whatsapp_number || product?.phone_number) && (() => {
              const hasPhone = !!product?.phone_number;
              const hasWhatsApp = !!product?.whatsapp_number;

              return (
                <div className="contact-actions">
                  {hasWhatsApp && (
                    <button className="btn btn-whatsapp" onClick={handleWhatsApp}>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Chat via WhatsApp
                    </button>
                  )}
                  {hasPhone && (
                    <button className="btn btn-call" onClick={handleCall}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          <div className="mobile-bottom-actions">
            {hasPhone && (
              <button
                className={`btn ${hasWhatsApp ? 'btn-call-mobile' : 'btn-call-mobile-full'}`}
                onClick={handleCall}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                Telepon
              </button>
            )}
            {hasWhatsApp && (
              <button
                className={`btn ${hasPhone ? 'btn-whatsapp-mobile' : 'btn-whatsapp-mobile-full'}`}
                onClick={handleWhatsApp}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
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
        <div className="modal-overlay" onClick={closeShareModal}>
          <div className="modal-content share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bagikan Produk</h3>
              <button className="close-btn" onClick={closeShareModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="share-buttons">
                <button className="share-option whatsapp" onClick={shareToWhatsApp}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span>WhatsApp</span>
                </button>

                <button className="share-option facebook" onClick={shareToFacebook}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Facebook</span>
                </button>

                <button className="share-option twitter" onClick={shareToTwitter}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                  <span>Twitter</span>
                </button>

                <button className="share-option copy-link" onClick={copyLink}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                  <span>Salin Link</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="modal-overlay" onClick={closeReportModal}>
          <div className="modal-content report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Laporkan Produk</h3>
              <button className="close-btn" onClick={closeReportModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitReport}>
              <div className="modal-body">
                <p className="report-info">
                  Jika Anda menemukan masalah dengan produk ini, silakan laporkan kepada kami.
                  Laporan Anda akan membantu kami menjaga keamanan marketplace.
                </p>

                <div className="form-group">
                  <label>Alasan Pelaporan *</label>
                  <select
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
                  <label>Keterangan (Opsional)</label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Jelaskan masalah yang Anda temukan..."
                    rows={4}
                    maxLength={500}
                  />
                  <span className="char-count">{reportDescription.length}/500</span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeReportModal}
                  disabled={submittingReport}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
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
