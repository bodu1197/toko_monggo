'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/ssr';
import { compressImage } from '../utils/imageCompression';
import './profile.css';
import { useAuth } from '../hooks/useAuth';
import { useScreenSize } from '../hooks/useScreenSize';
import LoadingState from '../components/common/LoadingState';
import ProductCard from '../components/products/ProductCard';

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { user, profile, loading, setProfile } = useAuth();

  const [userProducts, setUserProducts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const isMobile = useScreenSize();
  const [activeTab, setActiveTab] = useState('products'); // products, sold, favorites

  const [editForm, setEditForm] = useState({
    full_name: '',
    bio: '',
  });

  useEffect(() => {
    if (user) {
      fetchUserProducts(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  const fetchUserProducts = async (userId) => {
    try {
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
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUserProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Compress avatar image (500x500, quality 0.85, max 500KB)
      const compressedFile = await compressImage(file, {
        maxWidth: 500,
        maxHeight: 500,
        quality: 0.85,
        maxSizeMB: 0.5,
      });

      console.log(`Avatar - 원본: ${(file.size / 1024).toFixed(2)}KB → 압축: ${(compressedFile.size / 1024).toFixed(2)}KB`);

      const fileName = `${user.id}_${Date.now()}.jpg`;
      const filePath = `avatars/${fileName}`;

      // Delete old avatar if exists
      if (profile?.avatar_url) {
        const oldUrlParts = profile.avatar_url.split('/avatars/');
        if (oldUrlParts.length > 1) {
          const oldFilePath = oldUrlParts[1];
          await supabase.storage
            .from('avatars')
            .remove([oldFilePath]);
          console.log('Old avatar deleted:', oldFilePath);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Re-fetch profile data to update UI
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if(fetchError) throw fetchError;
      setProfile(updatedProfile);

      alert('Avatar berhasil diperbarui!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Gagal mengunggah avatar');
    }
  };

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          bio: editForm.bio,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Re-fetch profile data to update UI
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if(fetchError) throw fetchError;
      setProfile(updatedProfile);

      setIsEditing(false);
      alert('Profil berhasil diperbarui!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Gagal memperbarui profil');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;

    try {
      // 1. Get product images first
      const { data: productImages, error: fetchError } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', productId);

      if (fetchError) {
        console.error('Error fetching product images:', fetchError);
      }

      // 2. Delete product (will cascade delete product_images due to FK)
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (deleteError) throw deleteError;

      // 3. Delete images from storage
      if (productImages && productImages.length > 0) {
        for (const img of productImages) {
          try {
            // Extract file path from URL
            // URL format: https://xxx.supabase.co/storage/v1/object/public/product-images/products/filename.jpg
            const urlParts = img.image_url.split('/product-images/');
            if (urlParts.length > 1) {
              const filePath = urlParts[1];

              const { error: storageError } = await supabase.storage
                .from('product-images')
                .remove([filePath]);

              if (storageError) {
                console.error('Error deleting image from storage:', storageError);
              } else {
                console.log('Deleted image:', filePath);
              }
            }
          } catch (error) {
            console.error('Error processing image deletion:', error);
          }
        }
      }

      await fetchUserProducts(user.id);
      alert('Produk dan semua gambar berhasil dihapus!');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Gagal menghapus produk');
    }
  };

  const handleLogout = async () => {
    if (!confirm('Yakin ingin keluar?')) return;

    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <LoadingState message="Memuat profil..." />
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Header */}
      <header className="profile-header">
        <div className="container">
          <button className="back-btn" onClick={() => router.back()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Kembali
          </button>
          <h1>Profil Saya</h1>
          <button className="logout-btn" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Keluar
          </button>
        </div>
      </header>

      <div className="profile-content container">
        {/* Profile Info Card */}
        <div className="profile-card">
          <div className="avatar-section">
            <div className="avatar-container">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt="Avatar"
                  fill
                  sizes="150px"
                  className="avatar-image"
                  priority
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzI4MjgyOCIvPjwvc3ZnPg=="
                />
              ) : (
                <div className="avatar-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
              )}
              <label className="avatar-upload-btn">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  style={{ display: 'none' }}
                />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </label>
            </div>
          </div>

          <div className="profile-info">
            {isEditing ? (
              <div className="edit-form">
                <div className="form-group">
                  <label>Nama Lengkap</label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="form-input"
                    rows="3"
                  />
                </div>
                <div className="form-actions">
                  <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                    Batal
                  </button>
                  <button className="btn btn-primary" onClick={handleSaveProfile}>
                    Simpan
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="profile-name">{profile?.full_name || 'Pengguna'}</h2>
                <p className="profile-email">{user?.email}</p>
                {profile?.bio && (
                  <p className="profile-bio">{profile.bio}</p>
                )}
                <button className="btn btn-edit" onClick={() => setIsEditing(true)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit Profil
                </button>
              </>
            )}
          </div>

          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-number">{userProducts.length}</span>
              <span className="stat-label">Iklan</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">0</span>
              <span className="stat-label">Terjual</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">0</span>
              <span className="stat-label">Favorit</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              Iklan Saya ({userProducts.length})
            </button>
            <button
              className={`tab ${activeTab === 'sold' ? 'active' : ''}`}
              onClick={() => setActiveTab('sold')}
            >
              Terjual (0)
            </button>
            <button
              className={`tab ${activeTab === 'favorites' ? 'active' : ''}`}
              onClick={() => setActiveTab('favorites')}
            >
              Favorit (0)
            </button>
          </div>
        </div>

        {/* Products Grid */}
        {activeTab === 'products' && (
          <div className="products-section">
            {userProducts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <h3>Belum ada iklan</h3>
                <p>Mulai jual barang bekas Anda sekarang</p>
                <button className="btn btn-primary" onClick={() => router.push('/products/new')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Pasang Iklan
                </button>
              </div>
            ) : (
              <div className={`products-grid ${isMobile ? 'mobile' : 'desktop'}`}>
                {userProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={{
                      id: product.id,
                      title: product.title,
                      price: product.price,
                      city: product.regencies?.regency_name,
                      image: product.product_images?.[0]?.image_url,
                      status: product.status
                    }}
                    context="profile" 
                    onDelete={handleDeleteProduct} 
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'sold' && (
          <div className="empty-state">
            <div className="empty-icon">💰</div>
            <h3>Belum ada barang terjual</h3>
            <p>Produk yang sudah terjual akan muncul di sini</p>
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="empty-state">
            <div className="empty-icon">❤️</div>
            <h3>Belum ada favorit</h3>
            <p>Simpan iklan favorit Anda di sini</p>
          </div>
        )}
      </div>
    </div>
  );
}
