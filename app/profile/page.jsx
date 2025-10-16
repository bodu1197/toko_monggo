'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { compressImage } from '../utils/imageCompression';
import { useAuth } from '../hooks/useAuth';
import { useScreenSize } from '../hooks/useScreenSize';
import LoadingState from '../components/common/LoadingState';
import ProductCard from '../components/products/ProductCard';
import { useSupabaseClient } from '../components/SupabaseClientProvider';
import { isOldDiceBearUrl, migrateDiceBearUrl } from '../utils/avatarMigration';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading, setProfile } = useAuth();
  const supabaseClient = useSupabaseClient();

  const [userProducts, setUserProducts] = useState([]);
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const isMobile = useScreenSize();
  const [activeTab, setActiveTab] = useState('products');

  const [editForm, setEditForm] = useState({
    full_name: '',
    bio: '',
  });

  const fetchUserProducts = useCallback(async (userId) => {
    try {
      const { data, error } = await supabaseClient
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
  }, [supabaseClient]);

  const handleRenewProduct = useCallback(async (productId) => {
    if (!confirm('Perpanjang iklan ini 30 hari lagi?')) return;

    try {
      const { error } = await supabaseClient.rpc('renew_product', {
        product_id: productId
      });

      if (error) throw error;

      await fetchUserProducts(user.id);
      alert('Iklan berhasil diperpanjang 30 hari!');
    } catch (error) {
      console.error('Error renewing product:', error);
      alert('Gagal memperpanjang iklan');
    }
  }, [supabaseClient, user, fetchUserProducts]);

  const fetchFavoriteProducts = useCallback(async (userId) => {
    try {
      const { data, error } = await supabaseClient
        .from('favorites')
        .select(`
          product_id,
          products (
            id,
            title,
            price,
            status,
            product_images (
              image_url,
              order
            ),
            regencies (
              regency_name
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const favorites = (data || []).map(fav => fav.products).filter(Boolean);
      setFavoriteProducts(favorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  }, [supabaseClient]);

  const handleAvatarUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressedFile = await compressImage(file, {
        maxWidth: 500,
        maxHeight: 500,
        quality: 0.85,
        maxSizeMB: 0.5,
      });

      console.log(`Avatar - Asli: ${(file.size / 1024).toFixed(2)}KB → Terkompresi: ${(compressedFile.size / 1024).toFixed(2)}KB`);

      const fileName = `${user.id}_${Date.now()}.jpg`;
      const filePath = `avatars/${fileName}`;

      if (profile?.avatar_url) {
        const oldUrlParts = profile.avatar_url.split('/profile-avatars/');
        if (oldUrlParts.length > 1) {
          const oldFilePath = oldUrlParts[1];
          await supabaseClient.storage
            .from('profile-avatars')
            .remove([oldFilePath]);
          console.log('Old avatar deleted:', oldFilePath);
        }
      }

      const { error: uploadError } = await supabaseClient.storage
        .from('profile-avatars')
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabaseClient.storage
        .from('profile-avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      const { data: updatedProfile, error: fetchError } = await supabaseClient
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
  }, [supabaseClient, user, profile, setProfile]);

  const handleSaveProfile = useCallback(async () => {
    try {
      const { error } = await supabaseClient
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          bio: editForm.bio,
        })
        .eq('id', user.id);

      if (error) throw error;

      const { data: updatedProfile, error: fetchError } = await supabaseClient
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
  }, [supabaseClient, user, setProfile, editForm]);

  const handleDeleteProduct = useCallback(async (productId) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;

    try {
      const { data: productImages, error: fetchError } = await supabaseClient
        .from('product_images')
        .select('image_url')
        .eq('product_id', productId);

      if (fetchError) {
        console.error('Error fetching product images:', fetchError);
      }

      const { error: deleteError } = await supabaseClient
        .from('products')
        .delete()
        .eq('id', productId);

      if (deleteError) throw deleteError;

      if (productImages && productImages.length > 0) {
        for (const img of productImages) {
          try {
            const urlParts = img.image_url.split('/product-images/');
            if (urlParts.length > 1) {
              const filePath = urlParts[1];

              const { error: storageError } = await supabaseClient.storage
                .from('product-images')
                .remove([filePath]);

              if (storageError) {
                console.error('Error deleting image from storage:', storageError);
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
  }, [supabaseClient, user, fetchUserProducts]);

  const handleStatusChange = useCallback(async (productId, currentStatus) => {
    const newStatus = currentStatus === 'paused' ? 'active' : 'paused';
    const confirmMessage = newStatus === 'paused'
      ? 'Apakah Anda ingin menghentikan sementara penjualan produk ini?'
      : 'Apakah Anda ingin melanjutkan penjualan produk ini?';

    if (!confirm(confirmMessage)) return;

    try {
      const { error } = await supabaseClient
        .from('products')
        .update({ status: newStatus })
        .eq('id', productId);

      if (error) throw error;

      await fetchUserProducts(user.id);
      const successMessage = newStatus === 'paused'
        ? 'Produk berhasil dihentikan sementara'
        : 'Produk berhasil dilanjutkan';
      alert(successMessage);
    } catch (error) {
      console.error('Error changing product status:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      alert(`Gagal mengubah status produk: ${error.message || 'Unknown error'}`);
    }
  }, [supabaseClient, user, fetchUserProducts]);

  const handleLogout = useCallback(async () => {
    if (!confirm('Yakin ingin keluar?')) return;

    try {
      await supabaseClient.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, [supabaseClient, router]);

  useEffect(() => {
    if (user) {
      fetchUserProducts(user.id);
      fetchFavoriteProducts(user.id);
    }
  }, [user, fetchUserProducts, fetchFavoriteProducts]);

  // Auto-migrate old DiceBear avatars
  useEffect(() => {
    const migrateAvatar = async () => {
      if (profile?.avatar_url && isOldDiceBearUrl(profile.avatar_url)) {
        console.log('🔄 Migrating old DiceBear avatar...');
        const newUrl = migrateDiceBearUrl(profile.avatar_url);

        if (newUrl !== profile.avatar_url) {
          try {
            const { error } = await supabaseClient
              .from('profiles')
              .update({ avatar_url: newUrl })
              .eq('id', user.id);

            if (error) {
              console.error('Failed to migrate avatar:', error);
            } else {
              console.log('✅ Avatar migrated successfully');
              // Update local state
              setProfile({ ...profile, avatar_url: newUrl });
            }
          } catch (error) {
            console.error('Avatar migration error:', error);
          }
        }
      }
    };

    if (profile && user) {
      migrateAvatar();
    }
  }, [profile?.avatar_url, user, supabaseClient]);

  useEffect(() => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111827] pb-10">
        <LoadingState message="Memuat profil..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111827] pb-10">
      {/* Header */}
      <header className="bg-[#1f2937] border-b border-[#374151] py-4 sticky top-0 z-[100]">
        <div className="w-full max-w-[1400px] mx-auto px-5 max-md:px-4 flex items-center justify-between">
          <button className="flex items-center gap-2 py-2 px-0 bg-transparent border-none text-[#f9fafb] text-[15px] font-medium cursor-pointer transition-all hover:text-[#9ca3af]" onClick={() => router.back()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Kembali
          </button>
          <h1 className="text-xl font-semibold text-[#f9fafb]">Profil Saya</h1>
          <button className="flex items-center gap-2 bg-[#374151] border border-[#374151] text-[#f9fafb] text-sm font-medium cursor-pointer px-5 py-2.5 rounded-lg transition-all hover:bg-[#ef4444] hover:border-[#ef4444] hover:text-white" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span className="md:inline hidden">Keluar</span>
          </button>
        </div>
      </header>

      <div className="w-full max-w-[1200px] mx-auto px-5 md:px-4 py-8 md:py-5">
        {/* Profile Info Card */}
        <div className="bg-[#1f2937] border border-[#374151] rounded-2xl p-8 md:p-6 mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative w-[120px] h-[120px]">
              {profile?.avatar_url ? (
                <div className="relative w-[120px] h-[120px]">
                  {/* Use img tag for DiceBear SVGs to avoid Next.js Image issues */}
                  {profile.avatar_url.includes('dicebear.com') ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="w-[120px] h-[120px] rounded-full border-4 border-[#374151] object-cover object-center"
                      onError={(e) => {
                        console.error('Avatar failed to load, using fallback');
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <Image
                      src={profile.avatar_url}
                      alt="Avatar"
                      width={120}
                      height={120}
                      className="w-[120px] h-[120px] rounded-full border-4 border-[#374151] object-cover object-center"
                      priority
                      onError={(e) => {
                        console.error('Avatar failed to load, using fallback');
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  )}
                  {/* Fallback icon (hidden by default) */}
                  <div className="w-[120px] h-[120px] rounded-full border-4 border-[#374151] bg-[#374151] flex items-center justify-center" style={{ display: 'none' }}>
                    <svg className="w-[60px] h-[60px] text-[#6b7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="w-[120px] h-[120px] rounded-full border-4 border-[#374151] bg-[#374151] flex items-center justify-center">
                  <svg className="w-[60px] h-[60px] text-[#6b7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
              )}
              <label className="absolute bottom-[5px] right-[5px] w-9 h-9 bg-[#4b5563] border-[3px] border-[#1f2937] rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:bg-[#374151] hover:scale-110">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  aria-label="Upload avatar image"
                  title="Upload avatar image"
                />
                <svg className="w-[18px] h-[18px] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </label>
            </div>
          </div>

          <div className="text-center mb-6">
            {isEditing ? (
              <div className="max-w-[500px] mx-auto">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">Nama Lengkap</label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="w-full bg-[#111827] border border-[#374151] text-[#f9fafb] py-3 px-4 rounded-lg text-sm transition-all outline-none font-[inherit] focus:border-[#4b5563] focus:shadow-[0_0_0_3px_rgba(75,85,99,0.1)] placeholder:text-[#6b7280]"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="w-full bg-[#111827] border border-[#374151] text-[#f9fafb] py-3 px-4 rounded-lg text-sm transition-all outline-none font-[inherit] focus:border-[#4b5563] focus:shadow-[0_0_0_3px_rgba(75,85,99,0.1)] placeholder:text-[#6b7280] resize-y"
                    rows="3"
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button className="py-3 px-6 rounded-lg font-medium cursor-pointer transition-all text-sm inline-flex items-center justify-center gap-2 bg-[#374151] text-[#f9fafb] border border-[#374151] hover:bg-[#1f2937]" onClick={() => setIsEditing(false)}>
                    Batal
                  </button>
                  <button className="py-3 px-6 rounded-lg font-medium cursor-pointer transition-all border-none text-sm inline-flex items-center justify-center gap-2 bg-[#4b5563] text-white hover:bg-[#374151] hover:-translate-y-px" onClick={handleSaveProfile}>
                    Simpan
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-2xl md:text-xl font-bold text-[#f9fafb] mb-2">{profile?.full_name || 'Pengguna'}</h2>
                <p className="text-sm text-[#9ca3af] mb-1">{user?.email}</p>
                {profile?.bio && (
                  <p className="text-sm text-[#9ca3af] leading-relaxed mb-4 max-w-[500px] mx-auto">{profile.bio}</p>
                )}
                <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#374151] border border-[#4b5563] text-[#f9fafb] rounded-lg text-sm font-medium cursor-pointer transition-all duration-300 hover:bg-[#111827] hover:border-[#4b5563]" onClick={() => setIsEditing(true)}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit Profil
                </button>
              </>
            )}
          </div>

          <div className="grid grid-cols-3 gap-6 md:gap-4 pt-6 border-t border-[#374151]">
            <div className="text-center">
              <span className="block text-[2rem] font-bold text-[#f9fafb] mb-1">{userProducts.length}</span>
              <span className="block text-[0.875rem] text-[#9ca3af]">Iklan</span>
            </div>
            <div className="text-center">
              <span className="block text-[2rem] font-bold text-[#f9fafb] mb-1">0</span>
              <span className="block text-[0.875rem] text-[#9ca3af]">Terjual</span>
            </div>
            <div className="text-center">
              <span className="block text-[2rem] font-bold text-[#f9fafb] mb-1">{favoriteProducts.length}</span>
              <span className="block text-[0.875rem] text-[#9ca3af]">Favorit</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-[#374151] overflow-x-auto [-webkit-overflow-scrolling:touch]">
            <button
              className={`py-3 px-5 md:px-4 bg-transparent border-none font-medium text-[15px] md:text-sm cursor-pointer border-b-2 transition-all duration-300 whitespace-nowrap ${
                activeTab === 'products'
                  ? 'text-[#f9fafb] border-[#f9fafb]'
                  : 'text-[#9ca3af] border-transparent hover:text-[#f9fafb]'
              }`}
              onClick={() => setActiveTab('products')}
            >
              Iklan Saya ({userProducts.length})
            </button>
            <button
              className={`py-3 px-5 md:px-4 bg-transparent border-none font-medium text-[15px] md:text-sm cursor-pointer border-b-2 transition-all duration-300 whitespace-nowrap ${
                activeTab === 'sold'
                  ? 'text-[#f9fafb] border-[#f9fafb]'
                  : 'text-[#9ca3af] border-transparent hover:text-[#f9fafb]'
              }`}
              onClick={() => setActiveTab('sold')}
            >
              Terjual (0)
            </button>
            <button
              className={`py-3 px-5 md:px-4 bg-transparent border-none font-medium text-[15px] md:text-sm cursor-pointer border-b-2 transition-all duration-300 whitespace-nowrap ${
                activeTab === 'favorites'
                  ? 'text-[#f9fafb] border-[#f9fafb]'
                  : 'text-[#9ca3af] border-transparent hover:text-[#f9fafb]'
              }`}
              onClick={() => setActiveTab('favorites')}
            >
              Favorit ({favoriteProducts.length})
            </button>
          </div>
        </div>

        {/* Products Grid */}
        {activeTab === 'products' && (
          <div className="min-h-[400px]">
            {userProducts.length === 0 ? (
              <div className="text-center py-20 px-5 text-[#9ca3af]">
                <div className="text-[5rem] mb-6 opacity-50">📦</div>
                <h3>Belum ada iklan</h3>
                <p>Mulai jual barang bekas Anda sekarang</p>
                <button className="py-3 px-6 rounded-lg font-medium cursor-pointer transition-all border-none text-sm inline-flex items-center justify-center gap-2 bg-[#4b5563] text-white hover:bg-[#374151] hover:-translate-y-px" onClick={() => router.push('/products/new')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Pasang Iklan
                </button>
              </div>
            ) : (
              <div className={`grid gap-5 md:gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-4 md:grid-cols-2'}`}>
                {userProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={{
                      id: product.id,
                      title: product.title,
                      price: product.price,
                      city: product.regencies?.regency_name,
                      image: product.product_images?.[0]?.image_url,
                      status: product.status,
                      expires_at: product.expires_at
                    }}
                    context="profile"
                    onDelete={handleDeleteProduct}
                    onStatusChange={handleStatusChange}
                    onRenew={handleRenewProduct}
                  />
                ))}
              </div>            )}
          </div>
        )}

        {activeTab === 'sold' && (
          <div className="text-center py-20 px-5 text-[#9ca3af]">
            <div className="text-[5rem] mb-6 opacity-50">💰</div>
            <h3>Belum ada barang terjual</h3>
            <p>Produk yang sudah terjual akan muncul di sini</p>
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="min-h-[400px]">
            {favoriteProducts.length === 0 ? (
              <div className="text-center py-20 px-5 text-[#9ca3af]">
                <div className="text-[5rem] mb-6 opacity-50">❤️</div>
                <h3>Belum ada favorit</h3>
                <p>Simpan iklan favorit Anda di sini</p>
                <button className="py-3 px-6 rounded-lg font-medium cursor-pointer transition-all border-none text-sm inline-flex items-center justify-center gap-2 bg-[#4b5563] text-white hover:bg-[#374151] hover:-translate-y-px" onClick={() => router.push('/')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  </svg>
                  Jelajahi Produk
                </button>
              </div>
            ) : (
              <div className={`grid gap-5 md:gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-4 md:grid-cols-2'}`}>
                {favoriteProducts.map(product => (
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
                    context="home"
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
