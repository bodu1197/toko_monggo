'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSupabaseClient } from '../../components/SupabaseClientProvider';
import { compressImages, formatFileSize } from '../../utils/imageCompression';

export default function NewProductPage() {
  const router = useRouter();
  const supabase = useSupabaseClient();
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
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);

  // Load provinces from DB
  const loadProvinces = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('provinces')
        .select('province_name')
        .order('province_name');

      if (error) throw error;

      const provinceNames = data.map(p => p.province_name);
      setProvinces(provinceNames);
      console.log('[New] 🗺️ Loaded provinces from DB:', provinceNames.length);
    } catch (error) {
      console.error('Error loading provinces:', error);
    }
  }, [supabase]);

  // Load cities for a province from DB
  const loadCities = useCallback(async (provinceName) => {
    if (!provinceName) {
      setCities([]);
      return;
    }

    try {
      const { data: provinceData } = await supabase
        .from('provinces')
        .select('province_id')
        .eq('province_name', provinceName)
        .single();

      if (!provinceData) {
        setCities([]);
        return;
      }

      const { data, error } = await supabase
        .from('regencies')
        .select('regency_name')
        .eq('province_id', provinceData.province_id)
        .order('regency_name');

      if (error) throw error;

      const cityNames = data.map(r => r.regency_name);
      setCities(cityNames);
      console.log('[New] 🏙️ Loaded cities for', provinceName, ':', cityNames.length);
    } catch (error) {
      console.error('Error loading cities:', error);
      setCities([]);
    }
  }, [supabase]);

  // Load main categories from DB
  const loadMainCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('parent_category')
        .not('parent_category', 'is', null);

      if (error) throw error;

      // Get unique parent categories
      const uniqueParents = [...new Set(data.map(cat => cat.parent_category))].sort();
      setMainCategories(uniqueParents);
      console.log('[New] 📂 Loaded main categories from DB:', uniqueParents);
    } catch (error) {
      console.error('Error loading main categories:', error);
    }
  }, [supabase]);

  // Load subcategories for a parent category from DB
  const loadSubcategories = useCallback(async (parentCategory) => {
    if (!parentCategory) {
      setSubcategories([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .eq('parent_category', parentCategory)
        .order('name');

      if (error) throw error;

      const subs = data.map(cat => cat.name);
      setSubcategories(subs);
      console.log('[New] 📂 Loaded subcategories for', parentCategory, ':', subs);
    } catch (error) {
      console.error('Error loading subcategories:', error);
      setSubcategories([]);
    }
  }, [supabase]);

  const checkUser = useCallback(async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        alert('Silakan login terlebih dahulu');
        router.push('/login');
        return;
      }
      setUser(user);
    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/login');
    }
  }, [supabase, router]);

  useEffect(() => {
    loadProvinces();
    loadMainCategories();
    checkUser();
  }, [loadProvinces, loadMainCategories, checkUser]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // 지역 1차 선택 시 2차 업데이트
    if (name === 'province') {
      loadCities(value);
      setFormData(prev => ({ ...prev, province: value, city: '' }));
      return;
    }

    // 카테고리 1차 선택 시 2차 업데이트
    if (name === 'category1') {
      loadSubcategories(value);
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
      alert('Terjadi kesalahan saat memproses gambar');
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
      alert('Silakan login terlebih dahulu');
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

      // 2. Get category_id (search by both name and parent_category)
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('category_id')
        .eq('name', formData.category2)
        .eq('parent_category', formData.category1)
        .single();

      if (categoryError) {
        console.error('[New] ❌ Category lookup failed:', categoryError);
        throw new Error(`Kategori tidak ditemukan: ${formData.category2} (${formData.category1})`);
      }

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
    <div className="min-h-screen bg-[#111827] py-6 pb-10 sm:py-10">
      <div className="max-w-[900px] mx-auto px-5">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-5 mb-8 pb-6 border-b border-[#374151]">
          <button className="flex items-center gap-2 py-2 px-0 bg-transparent border-none text-[#f9fafb] text-[15px] font-medium cursor-pointer transition-all hover:text-[#9ca3af]" onClick={() => router.back()}>
            ← Kembali
          </button>
          <h1 className="text-center text-[28px] font-bold text-[#f9fafb]">Jual Produk</h1>
          <div></div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {/* Foto Produk */}
          <section className="bg-[#1f2937] border border-[#374151] rounded-2xl p-7">
            <h2 className="text-[1.25rem] font-bold text-[#f9fafb] mb-6">Foto Produk</h2>
            <p className="text-sm text-[#9ca3af] mb-5">Upload hingga 5 foto produk</p>

            <div className="mt-5">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
                {images.map((img, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden border-2 border-[#374151]">
                    <Image src={img} alt={`Preview ${index + 1}`} width={100} height={100} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 backdrop-blur-[10px] border-none text-white text-base cursor-pointer flex items-center justify-center transition-all duration-300 hover:bg-red-600/90 hover:scale-110"
                      onClick={() => removeImage(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {images.length < 5 && (
                  <label className="aspect-square border-2 border-dashed border-[#374151] rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 bg-[#111827] hover:border-[#6366f1] hover:bg-[#1f2937]">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <div className="text-[48px] mb-2 opacity-60">📷</div>
                    <div className="text-[13px] text-[#9ca3af] font-medium">Tambah Foto</div>
                  </label>
                )}
              </div>
            </div>
          </section>

          {/* Info Produk */}
          <section className="bg-[#1f2937] border border-[#374151] rounded-2xl p-7">
            <h2 className="text-[1.25rem] font-bold text-[#f9fafb] mb-6">Informasi Produk</h2>

            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-[#9ca3af] mb-2">Nama Produk *</label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="Contoh: iPhone 12 Pro 128GB"
                required
                maxLength={100}
                className="w-full bg-[#111827] border border-[#374151] text-[#f9fafb] py-3 px-4 rounded-lg text-sm transition-all outline-none font-[inherit] focus:border-[#4b5563] focus:shadow-[0_0_0_3px_rgba(75,85,99,0.1)] placeholder:text-[#6b7280]"
              />
              <span className="text-[0.8125rem] text-[#6b7280] mt-1.5">{formData.title.length}/100</span>
            </div>

            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-[#9ca3af] mb-2">Deskripsi *</label>
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
                className="w-full bg-[#111827] border border-[#374151] text-[#f9fafb] py-3 px-4 rounded-lg text-sm transition-all outline-none font-[inherit] focus:border-[#4b5563] focus:shadow-[0_0_0_3px_rgba(75,85,99,0.1)] placeholder:text-[#6b7280] resize-y min-h-[120px]"
              />
              <span className="text-[0.8125rem] text-[#6b7280] mt-1.5">{formData.description.length}/2000 (minimal 10)</span>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="mb-6">
                <label htmlFor="category1" className="block text-sm font-medium text-[#9ca3af] mb-2">Kategori Utama *</label>
                <select
                  id="category1"
                  name="category1"
                  value={formData.category1}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#111827] border border-[#374151] text-[#f9fafb] py-3 px-4 rounded-lg text-sm transition-all outline-none font-[inherit] focus:border-[#4b5563] focus:shadow-[0_0_0_3px_rgba(75,85,99,0.1)] placeholder:text-[#6b7280] cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23a0a0a0%22%20d%3D%22M6%209L1%204h10z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_16px_center] pr-10"
                >
                  <option value="">Pilih Kategori</option>
                  {mainCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label htmlFor="category2" className="block text-sm font-medium text-[#9ca3af] mb-2">Sub Kategori *</label>
                <select
                  id="category2"
                  name="category2"
                  value={formData.category2}
                  onChange={handleChange}
                  required
                  disabled={!formData.category1}
                  className="w-full bg-[#111827] border border-[#374151] text-[#f9fafb] py-3 px-4 rounded-lg text-sm transition-all outline-none font-[inherit] focus:border-[#4b5563] focus:shadow-[0_0_0_3px_rgba(75,85,99,0.1)] placeholder:text-[#6b7280] cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23a0a0a0%22%20d%3D%22M6%209L1%204h10z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_16px_center] pr-10"
                >
                  <option value="">Pilih Sub Kategori</option>
                  {subcategories.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="condition" className="block text-sm font-medium text-[#9ca3af] mb-2">Kondisi *</label>
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                required
                className="w-full bg-[#111827] border border-[#374151] text-[#f9fafb] py-3 px-4 rounded-lg text-sm transition-all outline-none font-[inherit] focus:border-[#4b5563] focus:shadow-[0_0_0_3px_rgba(75,85,99,0.1)] placeholder:text-[#6b7280] cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23a0a0a0%22%20d%3D%22M6%209L1%204h10z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_16px_center] pr-10"
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
          <section className="bg-[#1f2937] border border-[#374151] rounded-2xl p-7">
            <h2 className="text-[1.25rem] font-bold text-[#f9fafb] mb-6">Harga</h2>

            <div className="mb-6">
              <label htmlFor="price" className="block text-sm font-medium text-[#9ca3af] mb-2">Harga (Rp) *</label>
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
                className="w-full bg-[#111827] border border-[#374151] text-[#f9fafb] py-3 px-4 rounded-lg text-sm transition-all outline-none font-[inherit] focus:border-[#4b5563] focus:shadow-[0_0_0_3px_rgba(75,85,99,0.1)] placeholder:text-[#6b7280] [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              {formData.price && (
                <p className="text-[13px] text-[#6b7280] mt-1.5">Rp {parseInt(formData.price || 0).toLocaleString('id-ID')}</p>
              )}
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer text-[15px] text-[#9ca3af] p-3 rounded-lg transition-colors duration-300 hover:bg-[#111827]">
              <input
                type="checkbox"
                name="negotiable"
                checked={formData.negotiable}
                onChange={handleChange}
                className="w-5 h-5 cursor-pointer accent-[#6366f1]"
              />
              <span>Harga bisa nego</span>
            </label>
          </section>

          {/* Lokasi */}
          <section className="bg-[#1f2937] border border-[#374151] rounded-2xl p-7">
            <h2 className="text-[1.25rem] font-bold text-[#f9fafb] mb-6">Lokasi</h2>

            <div className="grid grid-cols-2 gap-5">
              <div className="mb-6">
                <label htmlFor="province" className="block text-sm font-medium text-[#9ca3af] mb-2">Provinsi *</label>
                <select
                  id="province"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#111827] border border-[#374151] text-[#f9fafb] py-3 px-4 rounded-lg text-sm transition-all outline-none font-[inherit] focus:border-[#4b5563] focus:shadow-[0_0_0_3px_rgba(75,85,99,0.1)] placeholder:text-[#6b7280] cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23a0a0a0%22%20d%3D%22M6%209L1%204h10z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_16px_center] pr-10"
                >
                  <option value="">Pilih Provinsi</option>
                  {provinces.map(province => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label htmlFor="city" className="block text-sm font-medium text-[#9ca3af] mb-2">Kota/Kabupaten *</label>
                <select
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  disabled={!formData.province}
                  className="w-full bg-[#111827] border border-[#374151] text-[#f9fafb] py-3 px-4 rounded-lg text-sm transition-all outline-none font-[inherit] focus:border-[#4b5563] focus:shadow-[0_0_0_3px_rgba(75,85,99,0.1)] placeholder:text-[#6b7280] cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23a0a0a0%22%20d%3D%22M6%209L1%204h10z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_16px_center] pr-10"
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
          <section className="bg-[#1f2937] border border-[#374151] rounded-2xl p-7">
            <h2 className="text-[1.25rem] font-bold text-[#f9fafb] mb-6">Kontak</h2>
            <p className="text-sm text-[#9ca3af] mb-5">Minimal isi 1 nomor kontak</p>

            <div className="mb-6">
              <label htmlFor="whatsapp" className="block text-sm font-medium text-[#9ca3af] mb-2">Nomor WhatsApp</label>
              <input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                value={formData.whatsapp}
                onChange={handleChange}
                placeholder="08123456789"
                pattern="[0-9]{10,13}"
                className="w-full bg-[#111827] border border-[#374151] text-[#f9fafb] py-3 px-4 rounded-lg text-sm transition-all outline-none font-[inherit] focus:border-[#4b5563] focus:shadow-[0_0_0_3px_rgba(75,85,99,0.1)] placeholder:text-[#6b7280]"
              />
              <p className="text-[13px] text-[#6b7280] mt-1.5">Format: 08xxxxxxxxxx (10-13 digit)</p>
            </div>

            <div className="mb-6">
              <label htmlFor="phone" className="block text-sm font-medium text-[#9ca3af] mb-2">Nomor Telepon</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="08123456789"
                pattern="[0-9]{10,13}"
                className="w-full bg-[#111827] border border-[#374151] text-[#f9fafb] py-3 px-4 rounded-lg text-sm transition-all outline-none font-[inherit] focus:border-[#4b5563] focus:shadow-[0_0_0_3px_rgba(75,85,99,0.1)] placeholder:text-[#6b7280]"
              />
              <p className="text-[13px] text-[#6b7280] mt-1.5">Format: 08xxxxxxxxxx (10-13 digit)</p>
            </div>
          </section>

          {/* Submit Button */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              className="py-3 px-6 rounded-lg font-medium cursor-pointer transition-all text-sm inline-flex items-center justify-center gap-2 bg-[#374151] text-[#f9fafb] border border-[#374151] hover:bg-[#1f2937]"
              onClick={() => router.back()}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`py-3 px-6 rounded-lg font-medium cursor-pointer transition-all border-none text-sm inline-flex items-center justify-center gap-2 bg-[#4b5563] text-white hover:bg-[#374151] hover:-translate-y-px ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
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
