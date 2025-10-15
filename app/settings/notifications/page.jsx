'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  isNotificationSupported,
  requestNotificationPermission,
  registerServiceWorker,
  subscribeToPushNotifications,
  saveSubscriptionToServer,
  unsubscribeFromPushNotifications,
  removeSubscriptionFromServer,
  checkSubscription,
  showLocalNotification
} from '../../utils/pushNotifications';

export default function NotificationSettingsPage() {
  const router = useRouter();
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ));

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [preferences, setPreferences] = useState({
    new_message: true,
    new_comment: true,
    price_drop: true,
    new_follower: true,
    product_sold: true,
    product_expired: true,
    email_enabled: true
  });

  const checkAuth = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUser(user);
  }, [supabase, router]);

  const checkNotificationStatus = useCallback(async () => {
    if (!isNotificationSupported()) return;

    const subscribed = await checkSubscription();
    setIsSubscribed(subscribed);
    setPushEnabled(subscribed);
  }, []);

  const loadPreferences = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setPreferences({
          new_message: data.new_message ?? true,
          new_comment: data.new_comment ?? true,
          price_drop: data.price_drop ?? true,
          new_follower: data.new_follower ?? true,
          product_sold: data.product_sold ?? true,
          product_expired: data.product_expired ?? true,
          email_enabled: data.email_enabled ?? true
        });
        setPushEnabled(data.push_enabled ?? false);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    checkAuth();
    checkNotificationStatus();
    loadPreferences();
  }, [checkAuth, checkNotificationStatus, loadPreferences]);

  const handleTogglePush = async () => {
    if (!user) return;

    try {
      setSaving(true);

      if (!isSubscribed && !pushEnabled) {
        // Enable push notifications
        const permission = await requestNotificationPermission();
        if (permission !== 'granted') {
          alert('Anda perlu memberikan izin notifikasi untuk mengaktifkan fitur ini');
          return;
        }

        const registration = await registerServiceWorker();
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BKagOny0KF_2pCJQ3m....'; // You need to generate VAPID keys
        const subscription = await subscribeToPushNotifications(registration, vapidPublicKey);
        await saveSubscriptionToServer(subscription, user.id, supabase);

        setPushEnabled(true);
        setIsSubscribed(true);

        // Test notification
        showLocalNotification('Notifikasi Aktif!', {
          body: 'Anda akan menerima notifikasi TokoMonggo',
        });

      } else {
        // Disable push notifications
        await unsubscribeFromPushNotifications();
        await removeSubscriptionFromServer(user.id, supabase);

        setPushEnabled(false);
        setIsSubscribed(false);
      }

      // Update preferences in database
      await savePreferences({ push_enabled: !pushEnabled });

    } catch (error) {
      console.error('Error toggling push notifications:', error);
      alert('Gagal mengubah pengaturan notifikasi');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePreference = async (key) => {
    const newValue = !preferences[key];
    setPreferences(prev => ({ ...prev, [key]: newValue }));
    await savePreferences({ [key]: newValue });
  };

  const savePreferences = async (updates) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Gagal menyimpan pengaturan');
    }
  };

  const testNotification = () => {
    showLocalNotification('Test Notifikasi', {
      body: 'Ini adalah contoh notifikasi dari TokoMonggo',
      data: { url: '/settings/notifications' }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-surface-tertiary border-t-info"></div>
      </div>
    );
  }

  const notificationTypes = [
    {
      key: 'new_message',
      title: 'Pesan Baru',
      description: 'Notifikasi saat ada pesan baru dari pembeli atau penjual',
      icon: '💬'
    },
    {
      key: 'new_comment',
      title: 'Komentar Baru',
      description: 'Notifikasi saat ada komentar baru di produk Anda',
      icon: '💭'
    },
    {
      key: 'price_drop',
      title: 'Penurunan Harga',
      description: 'Notifikasi saat produk favorit Anda turun harga',
      icon: '🏷️'
    },
    {
      key: 'new_follower',
      title: 'Pengikut Baru',
      description: 'Notifikasi saat ada yang mengikuti toko Anda',
      icon: '👥'
    },
    {
      key: 'product_sold',
      title: 'Produk Terjual',
      description: 'Notifikasi saat produk Anda terjual',
      icon: '🎉'
    },
    {
      key: 'product_expired',
      title: 'Produk Kedaluwarsa',
      description: 'Notifikasi saat produk Anda akan kedaluwarsa',
      icon: '⏰'
    }
  ];

  return (
    <div className="min-h-screen bg-surface-primary pb-[100px]">
      {/* Header */}
      <header className="bg-surface-secondary border-b border-border-primary py-3 sticky top-0 z-50">
        <div className="w-full max-w-[600px] mx-auto px-5 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-tertiary transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-text-primary">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-text-primary">Pengaturan Notifikasi</h1>
        </div>
      </header>

      <div className="w-full max-w-[600px] mx-auto px-5 py-6">
        {/* Push Notifications Toggle */}
        <div className="bg-surface-secondary border border-border-primary rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-text-primary mb-2 flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-info">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                Push Notifications
              </h2>
              <p className="text-sm text-text-secondary">
                Terima notifikasi langsung di perangkat Anda
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={pushEnabled}
                onChange={handleTogglePush}
                disabled={saving || !isNotificationSupported()}
              />
              <div className="w-11 h-6 bg-surface-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-info"></div>
            </label>
          </div>

          {!isNotificationSupported() && (
            <p className="text-xs text-warning bg-warning/10 px-3 py-2 rounded-lg">
              Browser Anda tidak mendukung push notifications
            </p>
          )}

          {pushEnabled && (
            <button
              onClick={testNotification}
              className="text-sm text-info hover:text-blue-400 transition-colors"
            >
              Test Notifikasi
            </button>
          )}
        </div>

        {/* Email Notifications Toggle */}
        <div className="bg-surface-secondary border border-border-primary rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-text-primary mb-2 flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-info">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Email Notifications
              </h2>
              <p className="text-sm text-text-secondary">
                Terima notifikasi melalui email
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={preferences.email_enabled}
                onChange={() => handleTogglePreference('email_enabled')}
              />
              <div className="w-11 h-6 bg-surface-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-info"></div>
            </label>
          </div>
        </div>

        {/* Notification Types */}
        <div className="bg-surface-secondary border border-border-primary rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border-primary">
            <h2 className="text-lg font-semibold text-text-primary">Jenis Notifikasi</h2>
            <p className="text-sm text-text-secondary mt-1">
              Pilih notifikasi yang ingin Anda terima
            </p>
          </div>

          {notificationTypes.map((type, index) => (
            <div
              key={type.key}
              className={`p-4 flex items-start justify-between ${
                index < notificationTypes.length - 1 ? 'border-b border-border-primary' : ''
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <span className="text-2xl">{type.icon}</span>
                <div>
                  <h3 className="font-medium text-text-primary">{type.title}</h3>
                  <p className="text-sm text-text-secondary mt-0.5">{type.description}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={preferences[type.key]}
                  onChange={() => handleTogglePreference(type.key)}
                  disabled={!pushEnabled && !preferences.email_enabled}
                />
                <div className="w-11 h-6 bg-surface-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success disabled:opacity-50"></div>
              </label>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-info/10 border border-info/30 rounded-lg">
          <p className="text-sm text-info">
            <strong>Tips:</strong> Aktifkan notifikasi untuk produk terjual dan pesan baru agar tidak ketinggalan transaksi penting.
          </p>
        </div>
      </div>
    </div>
  );
}