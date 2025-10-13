'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { INDONESIA_REGIONS } from '../../data/regions';
import { CATEGORIES, getSubcategories } from '../../data/categories';
import { compressImages, formatFileSize } from '../../utils/imageCompression';
import './new.css';

export default function NewProductPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

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
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);

  const checkUser = useCallback(async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        alert('로그인이 필요합니다.');
        router.push('/login');
        return;
      }
      setUser(user);
    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/login');
    }
  }, [supabase, router, setUser]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // 지역 1차 선택 시 2차 업데이트
    if (name === 'province') {
      setCities(INDONESIA_REGIONS[value] || []);
      setFormData(prev => ({ ...prev, province: value, city: '' }));
      return;
    }

    // 카테고리 1차 선택 시 2차 업데이트
    if (name === 'category1') {
      setSubcategories(getSubcategories(value));
      setFormData(prev => ({ ...prev, category1: value, category2: '' }));
      return;
    }

    // 일반 입력
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    // 이미지 압축 시작
    setLoading(true);

    try {
      // 원본 크기 계산
      const originalSize = files.reduce((sum, file) => sum + file.size, 0);
      console.log(`원본 크기: ${formatFileSize(originalSize)}`);

      // 이미지 압축 (최대 1200x1200, 품질 0.8, 최대 1MB)
      const compressedFiles = await compressImages(files, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8,
        maxSizeMB: 1,
      });

      // 압축된 크기 계산
      const compressedSize = compressedFiles.reduce((sum, file) => sum + file.size, 0);
      console.log(`압축 후 크기: ${formatFileSize(compressedSize)}`);
      console.log(`압축률: ${Math.round((1 - compressedSize / originalSize) * 100)}%`);

      // 기존 이미지와 합치기 (최대 5개)
      const newImageFiles = [...imageFiles, ...compressedFiles].slice(0, 5);
      const newImages = newImageFiles.map(file => URL.createObjectURL(file));

      setImageFiles(newImageFiles);
      setImages(newImages);
    } catch (error) {
      console.error('이미지 압축 오류:', error);
      alert('이미지 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert('로그인이 필요합니다.');
      router.push('/login');
      return;
    }

    // Validasi
    if (formData.description.length < 10) {
      alert('Deskripsi harus minimal 10 karakter!');
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

    if (imageFiles.length === 0) {
      alert('Minimal upload 1 foto produk!');
      return;
    }

    if (!formData.phone && !formData.whatsapp) {
      alert('Minimal isi 1 nomor kontak (Telepon atau WhatsApp)!');
      return;
    }

    setLoading(true);

    try {
      // 1. Get province_id and regency_id
      const { data: provinceData } = await supabase
        .from('provinces')
        .select('province_id')
        .ilike('province_name', formData.province)
        .single();

      const { data: regencyData } = await supabase
        .from('regencies')
        .select('regency_id')
        .ilike('regency_name', formData.city)
        .eq('province_id', provinceData?.province_id)
        .single();

      // 2. Get category_id
      const { data: categoryData } = await supabase
        .from('categories')
        .select('category_id')
        .eq('name', formData.category2)
        .single();

      // 3. Create product (위치 정보 및 연락처 포함)
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert([
          {
            user_id: user.id,
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
            status: 'active',
          },
        ])
        .select()
        .single();

      if (productError) throw productError;

      // 5. Upload images
      const uploadedImages = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${product.id}_${i}_${Date.now()}.${fileExt}`;
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
          product_id: product.id,
          image_url: publicUrl,
          order: i,
        });
      }

      // 5. Insert image records
      if (uploadedImages.length > 0) {
        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(uploadedImages);

        if (imagesError) {
          console.error('Images record error:', imagesError);
        }
      }

      alert('Produk berhasil ditambahkan!');
      router.push(`/products/${product.id}`);
    } catch (error) {
      console.error('Product creation error:', error);
      alert('Terjadi kesalahan saat menambahkan produk: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-product-page">
      <div className="new-product-container">
        <div className="page-header">
          <button className="back-btn" onClick={() => router.back()}>
            ← Kembali
          </button>
          <h1 className="page-title">Jual Produk</h1>
          <div></div>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          {/* Foto Produk */}
          <section className="form-section">
            <h2 className="section-title">Foto Produk</h2>
            <p className="section-description">Upload hingga 5 foto produk</p>

            <div className="image-upload-area">
              <div className="image-grid">
                {images.map((img, index) => (
                  <div key={index} className="image-preview">
                    <Image src={img} alt={`Preview ${index + 1}`} width={100} height={100} />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => removeImage(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {images.length < 5 && (
                  <label className="upload-box">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
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
                placeholder="Jelaskan kondisi dan detail produk... (minimal 10 karakter)"
                required
                rows={6}
                minLength={10}
                maxLength={2000}
                className="form-input"
              />
              <span className="char-count">{formData.description.length}/2000 (minimal 10)</span>
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
                type="text"
                inputMode="numeric"
                value={formData.price}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setFormData(prev => ({ ...prev, price: value }));
                }}
                placeholder="0"
                required
                className="form-input"
              />
              {formData.price && (
                <p className="form-help">Rp {parseInt(formData.price || 0).toLocaleString('id-ID')}</p>
              )}
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
              disabled={loading}
              className={`btn btn-primary btn-lg ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Menyimpan...
                </>
              ) : (
                'Posting Produk'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
