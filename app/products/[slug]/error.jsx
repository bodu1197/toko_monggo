'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Error({ error, reset }) {
  const router = useRouter();

  useEffect(() => {
    console.error('Product page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-4">
          Terjadi Kesalahan
        </h2>
        <p className="text-text-secondary mb-6">
          Maaf, terjadi kesalahan saat memuat halaman produk.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Coba Lagi
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-surface-secondary text-text-primary rounded-lg hover:bg-surface-tertiary transition-colors"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
}
