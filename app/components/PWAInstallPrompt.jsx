'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // PWA 설치 프롬프트 이벤트 리스너
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // 이미 설치 프롬프트를 본 경우 체크
      const hasSeenPrompt = localStorage.getItem('pwa-prompt-seen');
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

      if (!hasSeenPrompt && !isStandalone) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS Safari 체크
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone);

    if (isIOS && !isInStandaloneMode) {
      const hasSeenIOSPrompt = localStorage.getItem('ios-pwa-prompt-seen');
      if (!hasSeenIOSPrompt) {
        setShowPrompt(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('PWA installed');
      }

      setDeferredPrompt(null);
    }

    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-seen', 'true');
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-seen', 'true');

    // iOS의 경우
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      localStorage.setItem('ios-pwa-prompt-seen', 'true');
    }
  };

  if (!showPrompt) return null;

  // iOS용 특별 안내
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  if (isIOS && !deferredPrompt) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-slideUp">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Pasang aplikasi SEKARANG JUGA!
            </h2>

            <p className="text-sm text-gray-600 mb-4">
              Hanya 1 detik! Langsung muncul di layar utama HP Anda
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 mb-3">Cara pasang di iPhone:</p>
              <ol className="text-left text-xs text-gray-600 space-y-2">
                <li className="flex items-start">
                  <span className="mr-2">1.</span>
                  <span>Tap tombol Share <span className="inline-block w-5 h-5 align-middle">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M8 10L12 6L16 10M12 6V18M5 20H19" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </span> di bawah</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2.</span>
                  <span>Pilih "Add to Home Screen"</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">3.</span>
                  <span>Tap "Add"</span>
                </li>
              </ol>
            </div>

            <button
              onClick={handleDismiss}
              className="w-full bg-green-500 text-white py-3 rounded-full font-medium hover:bg-green-600 transition-colors"
            >
              OK, Saya Mengerti
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-slideUp">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="w-20 h-20 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Pasang aplikasi SEKARANG JUGA!
          </h2>

          <p className="text-sm text-gray-600 mb-6">
            Hanya 1 detik! Langsung muncul di layar utama HP Anda
          </p>

          <div className="space-y-2 text-left mb-6">
            <div className="flex items-center text-sm text-gray-700">
              <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Tanpa ke Play Store/App Store
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Langsung ada di layar HP
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Akses lebih cepat & hemat data
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleInstallClick}
              className="w-full bg-green-500 text-white py-3 rounded-full font-medium hover:bg-green-600 transition-colors"
            >
              Pasang Sekarang
            </button>

            <button
              onClick={handleDismiss}
              className="w-full text-gray-500 py-2 text-sm hover:text-gray-700 transition-colors"
            >
              Nanti Saja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}