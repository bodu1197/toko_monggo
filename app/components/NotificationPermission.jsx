'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isNotificationSupported,
  requestNotificationPermission,
  registerServiceWorker,
  subscribeToPushNotifications,
  saveSubscriptionToServer,
  checkSubscription
} from '../utils/pushNotifications';

export default function NotificationPermission({ user, supabase }) {
  const [showBanner, setShowBanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const checkNotificationStatus = useCallback(async () => {
    if (!isNotificationSupported() || !user) return;

    const isSubbed = await checkSubscription();
    setIsSubscribed(isSubbed);

    // Show banner if not subscribed and haven't dismissed before
    const dismissed = localStorage.getItem('notification-banner-dismissed');
    if (!isSubbed && !dismissed) {
      setShowBanner(true);
    }
  }, [user]);

  useEffect(() => {
    checkNotificationStatus();
  }, [checkNotificationStatus]);

  const handleEnableNotifications = async () => {
    if (!user) {
      alert('Silakan login terlebih dahulu untuk mengaktifkan notifikasi');
      return;
    }

    try {
      setLoading(true);

      // 1. Request permission
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        throw new Error('Permission not granted');
      }

      // 2. Register service worker
      const registration = await registerServiceWorker();

      // 3. Subscribe to push notifications
      // Note: You need to set up VAPID keys in your environment
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not configured');
      }

      const subscription = await subscribeToPushNotifications(registration, vapidPublicKey);

      // 4. Save subscription to Supabase
      await saveSubscriptionToServer(subscription, user.id, supabase);

      setIsSubscribed(true);
      setShowBanner(false);

      // Show success notification
      showTestNotification();

    } catch (error) {
      console.error('Failed to enable notifications:', error);
      alert('Gagal mengaktifkan notifikasi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const showTestNotification = async () => {
    const registration = await navigator.serviceWorker.ready;
    registration.showNotification('TokoMonggo', {
      body: 'Notifikasi berhasil diaktifkan! 🎉',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: 'welcome',
    });
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('notification-banner-dismissed', 'true');
  };

  if (!showBanner || !isNotificationSupported()) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-surface-secondary border border-border-primary rounded-xl shadow-lg p-4 z-50 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-info/20 rounded-full flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-info">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-semibold text-text-primary mb-1">
            Aktifkan Notifikasi
          </h3>
          <p className="text-xs text-text-secondary mb-3">
            Dapatkan pemberitahuan untuk pesan baru, komentar, dan aktivitas penting lainnya.
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleEnableNotifications}
              disabled={loading}
              className="flex-1 py-2 px-3 bg-info text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Mengaktifkan...' : 'Aktifkan'}
            </button>
            <button
              onClick={handleDismiss}
              className="py-2 px-3 bg-surface-tertiary text-text-secondary text-xs font-medium rounded-lg hover:bg-surface-primary transition-colors"
            >
              Nanti
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-text-muted hover:text-text-primary transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  );
}