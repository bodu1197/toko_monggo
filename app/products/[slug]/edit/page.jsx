'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useSupabaseClient } from '../../../components/SupabaseClientProvider';
import { compressImages, formatFileSize } from '../../../utils/imageCompression';
import { generateSlug, ensureUniqueSlug } from '../../../utils/slugify';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = useSupabaseClient();

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
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  // Existing images from database
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  // New images to upload
  const [newImages, setNewImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);

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
      console.log('[Edit] 🗺️ Loaded provinces from DB:', provinceNames.length);
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
      console.log('[Edit] 🏙️ Loaded cities for', provinceName, ':', cityNames.length);
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
      console.log('[Edit] 📂 Loaded main categories from DB:', uniqueParents);
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
      console.log('[Edit] 📂 Loaded subcategories for', parentCategory, ':', subs);
    } catch (error) {
      console.error('Error loading subcategories:', error);
      setSubcategories([]);
    }
  }, [supabase]);

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
        .eq('slug', params.slug)
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
      console.log('[Edit] Product ID:', productData.id);
      console.log('[Edit] Product title:', productData.title);

      // Get category hierarchy from DB
      let category1 = '';
      let category2 = '';

      console.log('[Edit] Category from DB - name:', productData.categories?.name);
      console.log('[Edit] Category from DB - parent:', productData.categories?.parent_category);

      if (productData.categories?.parent_category) {
        // parent_category가 있으면 그것이 category1 (메인 카테고리)
        category1 = productData.categories.parent_category;
        // 현재 카테고리가 category2 (서브카테고리)
        category2 = productData.categories.name;
        console.log('[Edit] ✅ Parsed categories:', { category1, category2 });
      } else {
        console.error('[Edit] ❌ No category parent_category found!');
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
        await loadCities(productData.provinces.province_name);
      }
      if (category1) {
        await loadSubcategories(category1);
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
  }, [supabase, router, params.slug, loadCities, loadSubcategories]);

  useEffect(() => {
    console.log('[Edit] Page loaded, product slug:', params.slug);
    loadProvinces();
    loadMainCategories();
    checkUserAndLoadProduct();
  }, [params.slug, loadProvinces, loadMainCategories, checkUserAndLoadProduct]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });

    if (name === 'province') {
      loadCities(value);
      setFormData(prev => ({ ...prev, province: value, city: '' }));
    }

    if (name === 'category1') {
      loadSubcategories(value);
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
        .select('regency_id, latitude, longitude')
        .eq('regency_name', formData.city)
        .eq('province_id', provinceData?.province_id)
        .single();

      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('category_id')
        .eq('name', formData.category2)
        .eq('parent_category', formData.category1)
        .single();

      console.log('[Edit] 💾 Category lookup:', {
        category1: formData.category1,
        category2: formData.category2,
        foundCategoryId: categoryData?.category_id,
        error: categoryError
      });

      if (categoryError) {
        console.error('[Edit] ❌ Category lookup failed:', categoryError);
        throw new Error(`Kategori tidak ditemukan: ${formData.category2} (${formData.category1})`);
      }

      // 2. Update product (지역 변경 시 해당 regency의 위도/경도로 업데이트)
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
        latitude: regencyData?.latitude,
        longitude: regencyData?.longitude,
        updated_at: new Date().toISOString(),
      };

      console.log('[Edit] 💾 Update data:', updateData);

      const { error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('slug', params.slug);

      if (updateError) throw updateError;

      // 2.5. Check if title changed and update slug
      let newSlug = params.slug; // 기본값은 현재 slug
      if (formData.title !== product.title) {
        // slug에서 랜덤 ID 추출 또는 새로 생성
        const randomId = crypto.randomUUID().slice(0, 8);
        const baseSlug = generateSlug(formData.title, randomId);
        const uniqueSlug = await ensureUniqueSlug(supabase, baseSlug, params.slug);

        console.log('[Edit] 🔄 Updating slug from', params.slug, 'to', uniqueSlug);

        // Update product slug (CASCADE will automatically update all related tables)
        const { error: slugError } = await supabase
          .from('products')
          .update({ slug: uniqueSlug })
          .eq('slug', params.slug);

        if (slugError) {
          console.error('Product slug update error:', slugError);
          console.error('Error details:', {
            message: slugError.message,
            details: slugError.details,
            hint: slugError.hint,
            code: slugError.code
          });
          throw new Error(`Gagal memperbarui URL produk: ${slugError.message}`);
        }

        newSlug = uniqueSlug; // 새 slug 저장
        console.log('[Edit] ✅ Slug updated successfully from', params.slug, 'to', uniqueSlug);
        console.log('[Edit] ✅ All related tables updated automatically via CASCADE');
      }

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
          const fileName = `${params.slug}_${Date.now()}_${i}.${fileExt}`;
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
            product_slug: newSlug,
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

      // 제목이 변경되어 slug가 바뀐 경우, 새 상품 페이지로 이동
      if (newSlug !== params.slug) {
        alert('Produk berhasil diperbarui!\n\nURL produk telah diperbarui. Anda akan diarahkan ke halaman produk yang baru.');
        router.push(`/products/${newSlug}`);
      } else {
        const goToMain = confirm('Produk berhasil diperbarui!\n\nKlik OK untuk ke Beranda, atau Cancel untuk ke Profil Saya');
        if (goToMain) {
          router.push('/');
        } else {
          router.push('/profile');
        }
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
      <div className="min-h-screen bg-[#111827] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#374151] border-t-[#6366f1] rounded-full animate-spin"></div>
          <p className="mt-4 text-[#9ca3af]">Memuat informasi produk...</p>
        </div>
      </div>
    );
  }

  const allImages = [
    ...existingImages.map(img => ({ type: 'existing', data: img })),
    ...newImages.map((url, idx) => ({ type: 'new', data: { url, idx } }))
  ];

  return (
    <div className="min-h-screen bg-[#111827] py-6 pb-10 sm:py-10">
      <div className="max-w-[900px] mx-auto px-5">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-5 mb-8 pb-6 border-b border-[#374151]">
          <button className="flex items-center gap-2 py-2 px-0 bg-transparent border-none text-[#f9fafb] text-[15px] font-medium cursor-pointer transition-all hover:text-[#9ca3af]" onClick={() => router.back()}>
            ← Kembali
          </button>
          <h1 className="text-center text-[28px] font-bold text-[#f9fafb]">Edit Produk</h1>
          <div></div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {/* Foto Produk */}
          <section className="bg-[#1f2937] border border-[#374151] rounded-2xl p-7">
            <h2 className="text-[1.25rem] font-bold text-[#f9fafb] mb-6">Foto Produk</h2>
            <p className="text-sm text-[#9ca3af] mb-5">Upload hingga 5 foto produk</p>

            <div className="mt-5">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
                {allImages.map((item, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden border-2 border-[#374151]">
                    <Image
                      src={item.type === 'existing' ? item.data.image_url : item.data.url}
                      alt={`Preview ${index + 1}`}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 backdrop-blur-[10px] border-none text-white text-base cursor-pointer flex items-center justify-center transition-all duration-300 hover:bg-red-600/90 hover:scale-110"
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
                        Ada
                      </span>
                    )}
                  </div>
                ))}

                {allImages.length < 5 && (
                  <label className="aspect-square border-2 border-dashed border-[#374151] rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 bg-[#111827] hover:border-[#6366f1] hover:bg-[#1f2937]">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple
                      onChange={handleNewImageUpload}
                      style={{ display: 'none' }}
                      disabled={submitting}
                      aria-label="Upload additional product images"
                      title="Upload additional images"
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
                placeholder="Jelaskan kondisi dan detail produk..."
                required
                rows={6}
                maxLength={2000}
                className="w-full bg-[#111827] border border-[#374151] text-[#f9fafb] py-3 px-4 rounded-lg text-sm transition-all outline-none font-[inherit] focus:border-[#4b5563] focus:shadow-[0_0_0_3px_rgba(75,85,99,0.1)] placeholder:text-[#6b7280]"
              />
              <span className="text-[0.8125rem] text-[#6b7280] mt-1.5">{formData.description.length}/2000</span>
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
                type="number"
                value={formData.price}
                onChange={handleChange}
                placeholder="0"
                required
                min="0"
                className="w-full bg-[#111827] border border-[#374151] text-[#f9fafb] py-3 px-4 rounded-lg text-sm transition-all outline-none font-[inherit] focus:border-[#4b5563] focus:shadow-[0_0_0_3px_rgba(75,85,99,0.1)] placeholder:text-[#6b7280]"
              />
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
              disabled={submitting}
              className={`py-3 px-6 rounded-lg font-medium cursor-pointer transition-all border-none text-sm inline-flex items-center justify-center gap-2 bg-[#4b5563] text-white hover:bg-[#374151] hover:-translate-y-px ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
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
