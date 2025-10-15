'use client';

import { useState, lazy, Suspense } from 'react';
import Image from 'next/image';
import OptimizedImage from '../common/OptimizedImage';

// Lazy load heavy components
export const Advertisement = lazy(() => import('../Advertisement'));

// Loading component for comments
export const CommentsLoading = () => (
  <div className="animate-pulse">
    <div className="h-6 bg-gray-700 rounded w-48 mb-6"></div>
    {[1, 2].map(i => (
      <div key={i} className="mb-4 p-6 bg-gray-800 rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
          <div>
            <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-32"></div>
          </div>
        </div>
        <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
      </div>
    ))}
  </div>
);

// Image Gallery Component
export const ImageGallery = ({ images, selectedImageIndex, setSelectedImageIndex, productTitle }) => {
  const currentImage = images[selectedImageIndex]?.image_url || null;

  return (
    <div className="flex flex-col gap-4 w-screen -mx-3 px-3 lg:w-auto lg:mx-0 lg:px-0">
      <div className="relative w-full aspect-video bg-surface-secondary border border-border-primary rounded-2xl lg:rounded-2xl overflow-hidden flex items-center justify-center">
        {currentImage ? (
          <OptimizedImage
            src={currentImage}
            alt={productTitle}
            fill
            context="product-detail"
            index={0}
            className="object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 w-full h-full text-text-muted">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-20 h-20">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span className="text-sm text-text-secondary">Tidak ada gambar</span>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-[repeat(auto-fill,80px)] lg:grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2 lg:gap-3">
          {images.map((img, index) => (
            <div
              key={index}
              className={`relative aspect-[4/3] bg-surface-secondary border-2 rounded-xl overflow-hidden cursor-pointer transition-all flex items-center justify-center ${
                index === selectedImageIndex
                  ? 'border-info shadow-[0_0_0_2px_rgba(59,130,246,0.2)]'
                  : 'border-border-primary hover:border-info'
              }`}
              onClick={() => setSelectedImageIndex(index)}
            >
              {img.image_url ? (
                <OptimizedImage
                  src={img.image_url}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  context="thumbnail"
                  index={index}
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-text-muted">
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
  );
};

// Share Modal Component
export const ShareModal = ({ show, onClose, product }) => {
  if (!show) return null;

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
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex items-center justify-center z-[10000] p-5 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-surface-secondary border border-border-primary rounded-2xl w-full max-w-[420px] max-h-[90vh] overflow-y-auto shadow-lg animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 lg:p-6 border-b border-border-primary">
          <h3 className="text-lg lg:text-xl font-bold text-text-primary">Bagikan Produk</h3>
          <button
            className="w-9 h-9 flex items-center justify-center bg-surface-tertiary border border-border-primary rounded-full cursor-pointer transition-all hover:bg-surface-primary hover:border-error"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] text-text-secondary">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="p-5 lg:p-6">
          <div className="grid grid-cols-2 gap-3 lg:gap-4">
            <button
              className="flex flex-col items-center justify-center gap-3 py-5 lg:py-6 px-3 lg:px-4 bg-surface-tertiary border border-[rgba(37,211,102,0.3)] rounded-xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md hover:bg-[rgba(37,211,102,0.1)] hover:border-[#25D366]"
              onClick={shareToWhatsApp}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 lg:w-10 h-8 lg:h-10 text-[#25D366]">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="text-sm lg:text-sm font-semibold text-text-primary">WhatsApp</span>
            </button>

            <button
              className="flex flex-col items-center justify-center gap-3 py-5 lg:py-6 px-3 lg:px-4 bg-surface-tertiary border border-[rgba(24,119,242,0.3)] rounded-xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md hover:bg-[rgba(24,119,242,0.1)] hover:border-[#1877F2]"
              onClick={shareToFacebook}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 lg:w-10 h-8 lg:h-10 text-[#1877F2]">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-sm lg:text-sm font-semibold text-text-primary">Facebook</span>
            </button>

            <button
              className="flex flex-col items-center justify-center gap-3 py-5 lg:py-6 px-3 lg:px-4 bg-surface-tertiary border border-[rgba(0,0,0,0.3)] rounded-xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md hover:bg-[rgba(0,0,0,0.1)] hover:border-[#000000]"
              onClick={shareToX}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 lg:w-10 h-8 lg:h-10 text-[#000000]">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="text-sm lg:text-sm font-semibold text-text-primary">X</span>
            </button>

            <button
              className="flex flex-col items-center justify-center gap-3 py-5 lg:py-6 px-3 lg:px-4 bg-surface-tertiary border border-[rgba(99,102,241,0.3)] rounded-xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md hover:bg-[rgba(99,102,241,0.1)] hover:border-info"
              onClick={copyLink}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 lg:w-10 h-8 lg:h-10 text-info">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              <span className="text-sm lg:text-sm font-semibold text-text-primary">Salin Link</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Report Modal Component
export const ReportModal = ({ show, onClose, onSubmit, submitting }) => {
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(reportReason, reportDescription);
  };

  return (
    <div
      className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex items-center justify-center z-[10000] p-5 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-surface-secondary border border-border-primary rounded-2xl w-full max-w-[calc(100%-32px)] lg:max-w-[500px] max-h-[90vh] overflow-y-auto shadow-lg animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 lg:p-6 border-b border-border-primary">
          <h3 className="text-lg lg:text-xl font-bold text-text-primary">Laporkan Produk</h3>
          <button
            className="w-9 h-9 flex items-center justify-center bg-surface-tertiary border border-border-primary rounded-full cursor-pointer transition-all hover:bg-surface-primary hover:border-error"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] text-text-secondary">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5 lg:p-6">
            <p className="text-sm lg:text-sm leading-relaxed text-text-secondary mb-5 lg:mb-6 p-3 lg:p-4 bg-[rgba(99,102,241,0.05)] border-l-[3px] border-l-info rounded-lg">
              Jika Anda menemukan masalah dengan produk ini, silakan laporkan kepada kami.
              Laporan Anda akan membantu kami menjaga keamanan marketplace.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-text-secondary mb-2">Alasan Pelaporan *</label>
              <select
                className="w-full bg-surface-primary border border-border-primary text-text-primary py-3 px-4 rounded-lg text-sm transition-all outline-none font-[inherit] focus:border-accent focus:shadow-[0_0_0_3px_rgba(75,85,99,0.1)] placeholder:text-text-muted"
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

            <div className="mb-6">
              <label className="block text-sm font-medium text-text-secondary mb-2">Keterangan (Opsional)</label>
              <textarea
                className="w-full bg-surface-primary border border-border-primary text-text-primary py-3 px-4 rounded-lg text-sm transition-all outline-none font-[inherit] focus:border-accent focus:shadow-[0_0_0_3px_rgba(75,85,99,0.1)] placeholder:text-text-muted resize-y min-h-[120px]"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Jelaskan masalah yang Anda temukan..."
                rows={4}
                maxLength={500}
              />
              <span className="text-[0.8125rem] text-text-muted mt-1.5">{reportDescription.length}/500</span>
            </div>
          </div>

          <div className="flex gap-2.5 lg:gap-3 p-4 lg:p-5 border-t border-border-primary bg-surface-tertiary rounded-b-2xl">
            <button
              type="button"
              className="flex-1 py-3 lg:py-3.5 px-5 lg:px-6 bg-surface-secondary border border-border-primary rounded-[10px] text-text-primary text-sm lg:text-[15px] font-semibold cursor-pointer transition-all hover:bg-surface-primary hover:border-text-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onClose}
              disabled={submitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-3 lg:py-3.5 px-5 lg:px-6 bg-error border border-error rounded-[10px] text-white text-sm lg:text-[15px] font-semibold cursor-pointer transition-all hover:bg-[#dc2626] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(239,68,68,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting || !reportReason}
            >
              {submitting ? 'Mengirim...' : 'Kirim Laporan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};