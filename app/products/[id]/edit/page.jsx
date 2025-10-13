'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { createBrowserClient } from '@supabase/ssr';
import { INDONESIA_REGIONS } from '../../../data/regions';
import { CATEGORIES, getSubcategories } from '../../../data/categories';
import { compressImages, formatFileSize } from '../../../utils/imageCompression';
import '../../new/new.css';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [product, setProduct] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    condition: 'Seperti Baru',
    province: '',
    city: '',
    category1: '',
    category2: '',
    phone: '',
    whatsapp: '',
    negotiable: false,
  });

  // Dropdown states
  const [cities, setCities] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  // Existing images from database
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  // New images to upload
  const [newImages, setNewImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);

  const checkUserAndLoadProduct = useCallback(async () => {
    try {
      // Check user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        alert('Silakan login terlebih dahulu');
        router.push('/login');
        return;
      }
      setUser(user);

      // Load product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          product_images (
            id,
            image_url,
            order
          ),
          provinces (
            province_name
          ),
          regencies (
            regency_name
          ),
          categories (
            name,
            parent_category
          )
        `)
        .eq('id', params.id)
        .single();

      if (productError) throw productError;

      // Check if user owns this product or is an admin
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const isAdmin = profileData?.role === 'admin';
      const isOwner = productData.user_id === user.id;

      if (!isOwner && !isAdmin) {
        alert('Anda tidak memiliki izin untuk mengedit produk ini');
        router.push('/');
        return;
      }

      setProduct(productData);

      console.log('[Edit] 🔍 Starting category parsing...');
      console.log('[Edit] Product data:', productData);

      // Get category hierarchy
      let category1 = '';
      let category2 = '';

      console.log('[Edit] Category from DB:', {
        categoryName: productData.categories?.name,
        parentCategory: productData.categories?.parent_category,
        fullObject: productData.categories
      });

      if (productData.categories?.parent_category) {
        // parent_category가 있으면 그것이 category1 (메인 카테고리)
        category1 = productData.categories.parent_category;
        // 현재 카테고리가 category2 (서브카테고리)
        category2 = productData.categories.name;
        console.log('[Edit] ✅ Case 1: Has parent_category ->', { category1, category2 });
      } else if (productData.categories?.name) {
        // parent_category가 없고 name만 있으면, 현재 카테고리가 메인인지 서브인지 확인
        const categoryName = productData.categories.name;
        console.log('[Edit] Case 2: No parent, checking name:', categoryName);
        console.log('[Edit] Available CATEGORIES:', Object.keys(CATEGORIES));

        // CATEGORIES에서 메인 카테고리인지 확인
        if (CATEGORIES[categoryName]) {
          // 메인 카테고리인 경우
          category1 = categoryName;
          category2 = '';
          console.log('[Edit] ✅ Case 2a: Is main category ->', { category1 });
        } else {
          // 서브 카테고리인 경우 - 부모 카테고리 찾기
          console.log('[Edit] Case 2b: Searching for parent...');
          for (const [mainCat, subCats] of Object.entries(CATEGORIES)) {
            if (subCats.includes(categoryName)) {
              category1 = mainCat;
              category2 = categoryName;
              console.log('[Edit] ✅ Found parent ->', { category1, category2 });
              break;
            }
          }
          if (!category1) {
            console.error('[Edit] ❌ Could not find parent for subcategory:', categoryName);
          }
        }
      } else {
        console.error('[Edit] ❌ No category data found!');
      }

      console.log('[Edit] 📌 Final parsed categories:', { category1, category2 });

      // Set form data
      const newFormData = {
        title: productData.title || '',
        description: productData.description || '',
        price: productData.price?.toString() || '',
        condition: productData.condition || 'Seperti Baru',
        province: productData.provinces?.province_name || '',
        city: productData.regencies?.regency_name || '',
        category1: category1,
        category2: category2,
        phone: productData.phone_number || '',
        whatsapp: productData.whatsapp_number || '',
        negotiable: productData.is_negotiable || false,
      };

      console.log('[Edit] 📝 Setting form data:', newFormData);
      setFormData(newFormData);

      // Set existing images
      const sortedImages = (productData.product_images || []).sort((a, b) => a.order - b.order);
      console.log('[Edit] 🖼️ Existing images:', sortedImages.length, 'images');
      setExistingImages(sortedImages);

      // Set cities and subcategories
      if (productData.provinces?.province_name) {
        const citiesList = INDONESIA_REGIONS[productData.provinces.province_name] || [];
        console.log('[Edit] 🏙️ Setting cities for', productData.provinces.province_name, ':', citiesList.length, 'cities');
        setCities(citiesList);
      }
      if (category1) {
        const subs = getSubcategories(category1);
        console.log('[Edit] 📂 Setting subcategories for', category1, ':', subs);
        setSubcategories(subs);
      } else {
        console.warn('[Edit] ⚠️ No category1, cannot set subcategories');
      }

    } catch (error) {
      console.error('Error loading product:', error);
      alert('Gagal memuat informasi produk');
      router.push('/profile');
    } finally {
      setLoading(false);
    }
  }, [supabase, router, params.id, setUser, setProduct, setFormData, setExistingImages, setCities, setSubcategories, setLoading]);

  useEffect(() => {
    console.log('[Edit] Page loaded, product ID:', params.id);
    checkUserAndLoadProduct();
    // 수정 시에는 위치 정보를 새로 가져오지 않음 (원래 위치 유지)
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });

    if (name === 'province') {
      setCities(INDONESIA_REGIONS[value] || []);
      setFormData(prev => ({ ...prev, province: value, city: '' }));
    }

    if (name === 'category1') {
      setSubcategories(getSubcategories(value));
      setFormData(prev => ({ ...prev, category1: value, category2: '' }));
    }
  };

  const handleNewImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const totalImages = existingImages.length - imagesToDelete.length + newImageFiles.length + files.length;
    if (totalImages > 5) {
      alert('Maksimal 5 foto produk');
      return;
    }

    setSubmitting(true);

    try {
      const originalSize = files.reduce((sum, file) => sum + file.size, 0);
      console.log(`원본 크기: ${formatFileSize(originalSize)}`);

      const compressedFiles = await compressImages(files, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8,
        maxSizeMB: 1,
      });

      const compressedSize = compressedFiles.reduce((sum, file) => sum + file.size, 0);
      console.log(`압축 후 크기: ${formatFileSize(compressedSize)}`);
      console.log(`압축률: ${Math.round((1 - compressedSize / originalSize) * 100)}%`);

      const newImageUrls = compressedFiles.map(file => URL.createObjectURL(file));
      setNewImageFiles([...newImageFiles, ...compressedFiles]);
      setNewImages([...newImages, ...newImageUrls]);
    } catch (error) {
      console.error('이미지 압축 오류:', error);
      alert('Terjadi kesalahan saat memproses gambar');
    } finally {
      setSubmitting(false);
    }
  };

  const removeExistingImage = (imageId, imageUrl) => {
    setImagesToDelete([...imagesToDelete, { id: imageId, url: imageUrl }]);
    setExistingImages(existingImages.filter(img => img.id !== imageId));
  };

  const removeNewImage = (index) => {
    setNewImages(newImages.filter((_, i) => i !== index));
    setNewImageFiles(newImageFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert('Silakan login terlebih dahulu');
      router.push('/login');
      return;
    }

    if (!formData.province || !formData.city) {
      alert('Pilih provinsi dan kota!');
      return;
    }

    if (!formData.category1 || !formData.category2) {
      alert('Pilih kategori lengkap!');
      return;
    }

    const totalImages = existingImages.length + newImageFiles.length;
    if (totalImages === 0) {
      alert('Minimal 1 foto produk diperlukan!');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Get IDs
      const { data: provinceData } = await supabase
        .from('provinces')
        .select('province_id')
        .eq('province_name', formData.province)
        .single();

      const { data: regencyData } = await supabase
        .from('regencies')
        .select('regency_id')
        .eq('regency_name', formData.city)
        .eq('province_id', provinceData?.province_id)
        .single();

      const { data: categoryData } = await supabase
        .from('categories')
        .select('category_id')
        .eq('name', formData.category2)
        .single();

      // 2. Update product (위치 정보는 유지, 다른 정보만 업데이트)
      const updateData = {
        title: formData.title,
        description: formData.description,
        price: parseInt(formData.price),
        condition: formData.condition,
        is_negotiable: formData.negotiable,
        province_id: provinceData?.province_id,
        regency_id: regencyData?.regency_id,
        category_id: categoryData?.category_id,
        phone_number: formData.phone || null,
        whatsapp_number: formData.whatsapp || null,
        updated_at: new Date().toISOString(),
      };
      // 위치 정보(latitude, longitude)는 업데이트하지 않음 - 원래 등록된 위치 유지

      const { error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', params.id);

      if (updateError) throw updateError;

      // 3. Delete marked images from storage and database
      for (const img of imagesToDelete) {
        // Delete from database
        await supabase
          .from('product_images')
          .delete()
          .eq('id', img.id);

        // Delete from storage
        const urlParts = img.url.split('/product-images/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabase.storage
            .from('product-images')
            .remove([filePath]);
          console.log('Deleted image:', filePath);
        }
      }

      // 4. Upload new images
      if (newImageFiles.length > 0) {
        const uploadedImages = [];
        const currentMaxOrder = Math.max(...existingImages.map(img => img.order), -1);

        for (let i = 0; i < newImageFiles.length; i++) {
          const file = newImageFiles[i];
          const fileExt = 'jpg';
          const fileName = `${params.id}_${Date.now()}_${i}.${fileExt}`;
          const filePath = `products/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, file);

          if (uploadError) {
            console.error('Image upload error:', uploadError);
            continue;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

          uploadedImages.push({
            product_id: params.id,
            image_url: publicUrl,
            order: currentMaxOrder + i + 1,
          });
        }

        if (uploadedImages.length > 0) {
          const { error: imagesError } = await supabase
            .from('product_images')
            .insert(uploadedImages);

          if (imagesError) {
            console.error('Images record error:', imagesError);
          }
        }
      }

      const goToMain = confirm('Produk berhasil diperbarui!\n\nKlik OK untuk ke Beranda, atau Cancel untuk ke Profil Saya');
      if (goToMain) {
        router.push('/');
      } else {
        router.push('/profile');
      }
    } catch (error) {
      console.error('Product update error:', error);
      console.error('Error details:', {
        message: error.message,
        hint: error.hint,
        details: error.details,
        code: error.code
      });
      alert('Gagal memperbarui produk: ' + (error.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="new-product-page">
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Memuat informasi produk...</p>
        </div>
      </div>
    );
  }

  const allImages = [
    ...existingImages.map(img => ({ type: 'existing', data: img })),
    ...newImages.map((url, idx) => ({ type: 'new', data: { url, idx } }))
  ];

  return (
    <div className="new-product-page">
      <div className="new-product-container">
        <div className="page-header">
          <button className="back-btn" onClick={() => router.back()}>
            ← Kembali
          </button>
          <h1 className="page-title">Edit Produk</h1>
          <div></div>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          {/* Foto Produk */}
          <section className="form-section">
            <h2 className="section-title">Foto Produk</h2>
            <p className="section-description">Upload hingga 5 foto produk</p>

            <div className="image-upload-area">
              <div className="image-grid">
                {allImages.map((item, index) => (
                  <div key={index} className="image-preview">
                    <Image
                      src={item.type === 'existing' ? item.data.image_url : item.data.url}
                      alt={`Preview ${index + 1}`}
                      width={100}
                      height={100}
                    />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => {
                        if (item.type === 'existing') {
                          removeExistingImage(item.data.id, item.data.image_url);
                        } else {
                          removeNewImage(item.data.idx);
                        }
                      }}
                    >
                      ✕
                    </button>
                    {item.type === 'existing' && (
                      <span style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px'
                      }}>
                        기존
                      </span>
                    )}
                  </div>
                ))}

                {allImages.length < 5 && (
                  <label className="upload-box">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleNewImageUpload}
                      style={{ display: 'none' }}
                      disabled={submitting}
                    />
                    <div className="upload-icon">📷</div>
                    <div className="upload-text">Tambah Foto</div>
                  </label>
                )}
              </div>
            </div>
          </section>

          {/* Info Produk */}
          <section className="form-section">
            <h2 className="section-title">Informasi Produk</h2>

            <div className="form-group">
              <label htmlFor="title" className="form-label">Nama Produk *</label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="Contoh: iPhone 12 Pro 128GB"
                required
                maxLength={100}
                className="form-input"
              />
              <span className="char-count">{formData.title.length}/100</span>
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label">Deskripsi *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Jelaskan kondisi dan detail produk..."
                required
                rows={6}
                maxLength={2000}
                className="form-input"
              />
              <span className="char-count">{formData.description.length}/2000</span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category1" className="form-label">Kategori Utama *</label>
                <select
                  id="category1"
                  name="category1"
                  value={formData.category1}
                  onChange={handleChange}
                  required
                  className="form-input"
                >
                  <option value="">Pilih Kategori</option>
                  {Object.keys(CATEGORIES).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="category2" className="form-label">Sub Kategori *</label>
                <select
                  id="category2"
                  name="category2"
                  value={formData.category2}
                  onChange={handleChange}
                  required
                  disabled={!formData.category1}
                  className="form-input"
                >
                  <option value="">Pilih Sub Kategori</option>
                  {subcategories.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="condition" className="form-label">Kondisi *</label>
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                required
                className="form-input"
              >
                <option value="Baru">Baru</option>
                <option value="Seperti Baru">Seperti Baru</option>
                <option value="Sangat Bagus">Sangat Bagus</option>
                <option value="Bagus">Bagus</option>
                <option value="Cukup Bagus">Cukup Bagus</option>
              </select>
            </div>
          </section>

          {/* Harga */}
          <section className="form-section">
            <h2 className="section-title">Harga</h2>

            <div className="form-group">
              <label htmlFor="price" className="form-label">Harga (Rp) *</label>
              <input
                id="price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                placeholder="0"
                required
                min="0"
                className="form-input"
              />
            </div>

            <label className="checkbox-label">
              <input
                type="checkbox"
                name="negotiable"
                checked={formData.negotiable}
                onChange={handleChange}
              />
              <span>Harga bisa nego</span>
            </label>
          </section>

          {/* Lokasi */}
          <section className="form-section">
            <h2 className="section-title">Lokasi</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="province" className="form-label">Provinsi *</label>
                <select
                  id="province"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  required
                  className="form-input"
                >
                  <option value="">Pilih Provinsi</option>
                  {Object.keys(INDONESIA_REGIONS).map(province => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="city" className="form-label">Kota/Kabupaten *</label>
                <select
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  disabled={!formData.province}
                  className="form-input"
                >
                  <option value="">Pilih Kota</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Kontak */}
          <section className="form-section">
            <h2 className="section-title">Kontak</h2>
            <p className="section-description">Minimal isi 1 nomor kontak</p>

            <div className="form-group">
              <label htmlFor="whatsapp" className="form-label">Nomor WhatsApp</label>
              <input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                value={formData.whatsapp}
                onChange={handleChange}
                placeholder="08123456789"
                pattern="[0-9]{10,13}"
                className="form-input"
              />
              <p className="form-help">Format: 08xxxxxxxxxx (10-13 digit)</p>
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="form-label">Nomor Telepon</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="08123456789"
                pattern="[0-9]{10,13}"
                className="form-input"
              />
              <p className="form-help">Format: 08xxxxxxxxxx (10-13 digit)</p>
            </div>
          </section>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary btn-lg"
              onClick={() => router.back()}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`btn btn-primary btn-lg ${submitting ? 'loading' : ''}`}
            >
              {submitting ? (
                <>
                  <span className="spinner"></span>
                  Menyimpan...
                </>
              ) : (
                'Update Produk'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
