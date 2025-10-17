'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

import { useSupabaseClient } from './SupabaseClientProvider';
import ProductCard from './products/ProductCard';
import LoadingState from './common/LoadingState';

// Dynamic imports for better performance
const Advertisement = dynamic(() => import('./Advertisement'), {
  loading: () => null,
  ssr: false
});

const Footer = dynamic(() => import('./Footer'), {
  ssr: true
});

const NotificationPermission = dynamic(() => import('./NotificationPermission'), {
  loading: () => null,
  ssr: false
});

export default function HomePage({ initialProducts = [], initialProvinces = [], initialCategories = [] }) {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [products, setProducts] = useState(initialProducts);
  const [filteredProducts, setFilteredProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // 초기 로드 플래그

  // 검색 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // 필터 상태
  const [filters, setFilters] = useState({
    province: '',
    city: '',
    category: '',
    subcategory: '',
  });

  // 2차 드롭다운 옵션
  const [provinces, setProvinces] = useState(initialProvinces);
  const [cities, setCities] = useState([]);
  const [mainCategories, setMainCategories] = useState(initialCategories);
  const [subcategories, setSubcategories] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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
    } catch (error) {
      console.error('Error loading cities:', error);
      setCities([]);
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
    } catch (error) {
      console.error('Error loading subcategories:', error);
      setSubcategories([]);
    }
  }, [supabase]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error} = await supabase
        .from('products')
        .select(`
          *,
          product_images (
            image_url,
            order
          ),
          regencies (
            regency_name,
            provinces (
              province_name
            )
          ),
          categories (
            name
          )
        `)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const transformedProducts = data?.map(product => ({
        id: product.slug,
        slug: product.slug,
        title: product.title,
        price: product.price,
        province: product.regencies?.provinces?.province_name || '',
        city: product.regencies?.regency_name || '',
        category: product.categories?.name || '',
        condition: product.condition || '',
        image: product.product_images?.[0]?.image_url || null,
        latitude: product.latitude,
        longitude: product.longitude,
      })) || [];

      setProducts(transformedProducts);
      setFilteredProducts(transformedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchNearbyProducts = useCallback(async (lat, lng) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('nearby_products', {
        user_lat: lat,
        user_lng: lng,
        max_distance_km: 50,
        limit_count: 50
      });

      if (error) {
        console.error('❌ nearby_products RPC error:', error);
        await fetchProducts();
        return;
      }

      if (!data || data.length === 0) {
        await fetchProducts();
        return;
      }

      const transformedProducts = data?.map(product => ({
        id: product.slug,
        slug: product.slug,
        title: product.title,
        price: product.price,
        province: product.province_name || '',
        city: product.regency_name || '',
        category: product.category_name || '',
        condition: product.condition || '',
        image: product.image_url || null,
        latitude: product.latitude,
        longitude: product.longitude,
        distance: product.distance_km,
      })) || [];

      setProducts(transformedProducts);
      setFilteredProducts(transformedProducts);

      if (transformedProducts.length > 0) {
        const firstProduct = transformedProducts[0];
        setFilters(prev => ({
          ...prev,
          province: firstProduct.province || '',
          city: firstProduct.city || '',
        }));
      }
    } catch (error) {
      console.error('Error fetching nearby products:', error);
      await fetchProducts();
    } finally {
      setLoading(false);
    }
  }, [supabase, fetchProducts]);

  const tryGetLocationAndFetch = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      fetchProducts();
      return;
    }

    setLocationStatus('loading');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        setLocationStatus('success');
        fetchNearbyProducts(latitude, longitude);
      },
      (error) => {
        console.log('위치 정보 접근 거부 또는 에러:', error.message);
        setLocationStatus('denied');
        fetchProducts();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, [fetchProducts, fetchNearbyProducts]);

  const handleNearbyClick = () => {
    if (userLocation) {
      fetchNearbyProducts(userLocation.latitude, userLocation.longitude);
    } else {
      tryGetLocationAndFetch();
    }
  };

  // 필터링 로직
  useEffect(() => {
    let result = [...products];

    if (filters.province) {
      result = result.filter(p => p.province === filters.province);
    }

    if (filters.city) {
      result = result.filter(p => p.city === filters.city);
    }

    if (filters.category) {
      result = result.filter(p => p.category === filters.category);
    }

    if (filters.subcategory) {
      result = result.filter(p => p.subcategory === filters.subcategory);
    }

    setFilteredProducts(result);
  }, [filters, products]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    if (name === 'province') {
      loadCities(value);
      setFilters(prev => ({
        ...prev,
        province: value,
        city: ''
      }));
    }
    else if (name === 'category') {
      loadSubcategories(value);
      setFilters(prev => ({
        ...prev,
        category: value,
        subcategory: ''
      }));
    }
    else {
      setFilters(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const resetFilters = () => {
    setFilters({
      province: '',
      city: '',
      category: '',
      subcategory: '',
    });
    setCities([]);
    setSubcategories([]);
    setSearchQuery('');
    setSearchSuggestions([]);
    if (userLocation) {
      fetchNearbyProducts(userLocation.latitude, userLocation.longitude);
    } else {
      fetchProducts();
    }
  };

  // 검색 함수
  const searchProducts = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      if (userLocation) {
        fetchNearbyProducts(userLocation.latitude, userLocation.longitude);
      } else {
        fetchProducts();
      }
      return;
    }

    try {
      setIsSearching(true);

      const searchTerm = `%${query.trim()}%`;

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images (
            image_url,
            order
          ),
          regencies (
            regency_name,
            provinces (
              province_name
            )
          ),
          categories (
            name
          )
        `)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data && data.length > 0) {
        const transformedProducts = data?.map(product => ({
          id: product.slug,
          slug: product.slug,
          title: product.title,
          price: product.price,
          province: product.regencies?.provinces?.province_name || '',
          city: product.regencies?.regency_name || '',
          category: product.categories?.name || '',
          condition: product.condition || '',
          image: product.product_images?.[0]?.image_url || null,
          latitude: product.latitude,
          longitude: product.longitude,
        })) || [];

        setProducts(transformedProducts);
        setFilteredProducts(transformedProducts);
      } else {
        setProducts([]);
        setFilteredProducts([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      if (userLocation) {
        fetchNearbyProducts(userLocation.latitude, userLocation.longitude);
      } else {
        fetchProducts();
      }
    } finally {
      setIsSearching(false);
    }
  }, [supabase, userLocation, fetchNearbyProducts, fetchProducts]);

  // 자동완성 함수
  const fetchAutocompleteSuggestions = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const searchTerm = `${query.trim()}%`;

      const { data, error } = await supabase
        .from('products')
        .select('title, categories(name)')
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .ilike('title', searchTerm)
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;

      const suggestions = data?.map(item => ({
        title: item.title,
        category_name: item.categories?.name || ''
      })) || [];

      setSearchSuggestions(suggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Autocomplete error:', error);
      setSearchSuggestions([]);
    }
  }, [supabase]);

  // 검색 입력 핸들러 (debouncing)
  useEffect(() => {
    // 초기 로드 시에는 fetch하지 않음 (SSR 데이터 사용)
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }

    const timer = setTimeout(() => {
      if (searchQuery) {
        fetchAutocompleteSuggestions(searchQuery);
        if (searchQuery.trim().length >= 2) {
          searchProducts(searchQuery);
        }
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
        if (userLocation) {
          fetchNearbyProducts(userLocation.latitude, userLocation.longitude);
        } else {
          fetchProducts();
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchAutocompleteSuggestions, searchProducts, userLocation, fetchNearbyProducts, fetchProducts, isInitialLoad]);

  // 검색 실행 핸들러
  const handleSearch = (e) => {
    e?.preventDefault();
    setShowSuggestions(false);
    searchProducts(searchQuery);
  };

  // 자동완성 선택 핸들러
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    searchProducts(suggestion);
  };

  useEffect(() => {
    // 인증 상태 확인
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      setCurrentUser(session?.user || null);
    };
    checkAuth();

    // 인증 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      setCurrentUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      {/* Sticky Header + Filter Wrapper */}
      <div className="sticky top-0 z-[1000] bg-[#1f2937] md:will-change-transform md:transform-gpu md:backface-hidden">
        {/* Header - CSS로 반응형 제어 */}
        <header className="bg-[#1f2937] border-b border-[#374151] relative z-[1] py-3 md:py-4">
          <div className="w-full max-w-[1400px] mx-auto px-5 max-md:px-4 flex items-center justify-between gap-8">
            <div className="flex items-center gap-12">
              <h1 className="text-xl md:text-2xl font-bold whitespace-nowrap cursor-pointer" onClick={() => router.push('/')}>🛍️ Toko Monggo</h1>
            </div>

            {/* PC 검색창 - CSS로 표시/숨김 제어 */}
            <div className="hidden md:flex flex-1 min-w-[400px]">
                <form className="flex gap-3 relative w-full" onSubmit={handleSearch}>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Cari barang bekas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      className="w-full min-w-[400px] bg-[#111827] border border-[#374151] text-[#f9fafb] py-3 px-4 rounded-lg text-sm transition-all outline-none font-[inherit] focus:border-[#4b5563] focus:shadow-[0_0_0_3px_rgba(75,85,99,0.1)] placeholder:text-[#6b7280]"
                    />
                    {showSuggestions && searchSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-[#1f2937] border border-[#374151] border-t-0 rounded-b-lg max-h-[300px] overflow-y-auto z-[1001] shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                        {searchSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 py-3 px-4 cursor-pointer transition-colors duration-200 border-b border-[#374151] last:border-b-0 hover:bg-[#374151]"
                            onClick={() => handleSuggestionClick(suggestion.title)}
                          >
                            <svg className="w-4 h-4 text-[#9ca3af] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="11" cy="11" r="8"/>
                              <path d="m21 21-4.35-4.35"/>
                            </svg>
                            <span className="text-[#f9fafb] text-sm whitespace-nowrap overflow-hidden text-ellipsis">{suggestion.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button type="submit" className="py-3 px-5 bg-[#4b5563] border-none rounded-lg cursor-pointer transition-colors duration-300 flex items-center justify-center hover:bg-[#374151]" disabled={isSearching} aria-label="Cari produk">
                    {isSearching ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                      </svg>
                    )}
                  </button>
                </form>
              </div>

            {/* PC 버튼들 - CSS로 표시/숨김 제어 */}
            <div className="hidden md:flex items-center gap-4">
                  <button className="h-10 py-2 px-4 rounded-lg font-medium cursor-pointer transition-all border-none text-sm inline-flex items-center justify-center gap-2 bg-[#4b5563] text-white hover:bg-[#374151] hover:-translate-y-0.5" onClick={() => router.push('/products/new')}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Jual
                  </button>
                  <button
                    className="flex items-center justify-center w-10 h-10 bg-[#374151] border border-[#374151] rounded-lg cursor-pointer transition-all hover:bg-[#111827] hover:border-[#4b5563] hover:-translate-y-0.5"
                    onClick={() => router.push('/profile')}
                    aria-label="Profil"
                  >
                    <svg className="w-5 h-5 text-[#f9fafb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </button>
            </div>
          </div>

        </header>

        {/* Filter Bar - PC 전용 - CSS로 표시/숨김 제어 */}
        <section className="hidden md:block bg-[#1f2937] border-b border-[#374151] py-5 relative z-[1]">
        <div className="w-full max-w-[1400px] mx-auto px-5 max-md:px-4">
          <div className="flex gap-3 items-center flex-wrap">
            <div className="flex-1 min-w-[150px]">
              <label htmlFor="filter-province-pc" className="sr-only">Filter provinsi</label>
              <select
                id="filter-province-pc"
                name="province"
                value={filters.province}
                onChange={handleFilterChange}
                className="w-full h-[42px] px-3 bg-[#111827] border border-[#374151] rounded-lg text-[#f9fafb] text-sm outline-none transition-all duration-300 cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2710%27%20height=%2710%27%20viewBox=%270%200%2010%2010%27%3E%3Cpath%20fill=%27%23a0a0a0%27%20d=%27M5%208L1%203h8z%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center] pr-8 focus:border-[#4b5563] focus:shadow-[0_0_0_2px_rgba(75,85,99,0.1)]"
              >
                <option value="">Semua Provinsi</option>
                {provinces.map(province => (
                  <option key={province} value={province}>{province}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label htmlFor="filter-city-pc" className="sr-only">Filter kota</label>
              <select
                id="filter-city-pc"
                name="city"
                value={filters.city}
                onChange={handleFilterChange}
                disabled={!filters.province}
                className="w-full h-[42px] px-3 bg-[#111827] border border-[#374151] rounded-lg text-[#f9fafb] text-sm outline-none transition-all duration-300 cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2710%27%20height=%2710%27%20viewBox=%270%200%2010%2010%27%3E%3Cpath%20fill=%27%23a0a0a0%27%20d=%27M5%208L1%203h8z%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center] pr-8 focus:border-[#4b5563] focus:shadow-[0_0_0_2px_rgba(75,85,99,0.1)]"
              >
                <option value="">Semua Kota</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label htmlFor="filter-category-pc" className="sr-only">Filter kategori</label>
              <select
                id="filter-category-pc"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-full h-[42px] px-3 bg-[#111827] border border-[#374151] rounded-lg text-[#f9fafb] text-sm outline-none transition-all duration-300 cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2710%27%20height=%2710%27%20viewBox=%270%200%2010%2010%27%3E%3Cpath%20fill=%27%23a0a0a0%27%20d=%27M5%208L1%203h8z%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center] pr-8 focus:border-[#4b5563] focus:shadow-[0_0_0_2px_rgba(75,85,99,0.1)]"
              >
                <option value="">Semua Kategori</option>
                {mainCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label htmlFor="filter-subcategory-pc" className="sr-only">Filter sub kategori</label>
              <select
                id="filter-subcategory-pc"
                name="subcategory"
                value={filters.subcategory}
                onChange={handleFilterChange}
                disabled={!filters.category}
                className="w-full h-[42px] px-3 bg-[#111827] border border-[#374151] rounded-lg text-[#f9fafb] text-sm outline-none transition-all duration-300 cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2710%27%20height=%2710%27%20viewBox=%270%200%2010%2010%27%3E%3Cpath%20fill=%27%23a0a0a0%27%20d=%27M5%208L1%203h8z%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center] pr-8 focus:border-[#4b5563] focus:shadow-[0_0_0_2px_rgba(75,85,99,0.1)]"
              >
                <option value="">Semua Sub Kategori</option>
                {subcategories.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            {/* PC: Nearby 위치 표시 인라인 */}
            {locationStatus === 'success' && (
              <div className="flex items-center gap-2 h-[42px] px-4 bg-[#111827] border border-[#374151] rounded-lg text-[#9ca3af] text-sm font-medium whitespace-nowrap">
                <svg className="w-[18px] h-[18px] text-[#9ca3af] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span className="font-medium text-[#9ca3af]">50km</span>
                <button className="w-8 h-8 flex items-center justify-center bg-[#374151] border border-[#374151] rounded-md text-[#9ca3af] cursor-pointer transition-all duration-300 flex-shrink-0 ml-1 hover:bg-[#4b5563] hover:text-[#f9fafb] hover:rotate-180" onClick={handleNearbyClick} title="Refresh" aria-label="Refresh produk sekitar">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 4v6h6M23 20v-6h-6"/>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                  </svg>
                </button>
              </div>
            )}

            {/* PC: 위치 거부시 인라인 표시 */}
            {locationStatus === 'denied' && (
              <button
                className="flex items-center justify-center gap-2 h-[42px] px-4 bg-[#4b5563] border-none rounded-lg text-white text-sm font-semibold cursor-pointer transition-all duration-300 whitespace-nowrap hover:bg-[#374151] hover:-translate-y-0.5"
                onClick={handleNearbyClick}
                title="Klik untuk mencari produk di sekitar Anda (izin lokasi diperlukan)"
                aria-label="Aktifkan lokasi untuk mencari produk di sekitar"
              >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="10" r="3"/>
                  <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
                </svg>
                Sekitar Saya
              </button>
            )}

            {locationStatus === 'idle' && (
              <button
                className="flex items-center justify-center gap-2 h-[42px] px-4 bg-[#4b5563] border-none rounded-lg text-white text-sm font-semibold cursor-pointer transition-all duration-300 whitespace-nowrap hover:bg-[#374151] hover:-translate-y-0.5"
                onClick={handleNearbyClick}
                title="Tampilkan produk di sekitar lokasi Anda (radius 50km)"
                aria-label="Cari produk di sekitar lokasi Anda"
              >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="10" r="3"/>
                  <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
                </svg>
                Sekitar Saya
              </button>
            )}

              <button className="h-[42px] px-5 bg-[#374151] border border-[#374151] rounded-lg text-[#9ca3af] text-sm font-semibold cursor-pointer transition-all duration-300 whitespace-nowrap flex items-center justify-center gap-2 hover:bg-[#111827] hover:text-[#f9fafb] hover:border-[#4b5563]" onClick={resetFilters}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 4v6h6M23 20v-6h-6"/>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                </svg>
                Reset
              </button>
          </div>
        </div>
      </section>
      </div>

      {/* Mobile Filter - Bottom Slide-up Popup */}
      {showMobileFilters && (
        <>
          <div className="md:hidden fixed top-0 left-0 right-0 bottom-0 bg-black/70 z-[1500] animate-[fadeIn_0.3s_ease-out]" onClick={() => setShowMobileFilters(false)} />
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1f2937] rounded-t-[20px] z-[1501] animate-[slideUpFromBottom_0.3s_ease-out] max-h-[85vh] overflow-y-auto shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between py-5 px-6 border-b border-[#374151] bg-[#1f2937] sticky top-0 z-10">
              <h3 className="text-xl font-bold text-[#f9fafb] m-0">Filter & Pencarian</h3>
              <button className="w-9 h-9 flex items-center justify-center bg-[#374151] border border-[#374151] rounded-full cursor-pointer transition-all duration-300 hover:bg-[#111827] hover:border-[#9ca3af]" onClick={() => setShowMobileFilters(false)} aria-label="Tutup filter">
                <svg className="w-[18px] h-[18px] text-[#9ca3af]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="py-5">
              <div className="w-full max-w-[1400px] mx-auto px-5 max-md:px-4">
                {/* Mobile: 검색창도 필터 안에 */}
                <form className="flex gap-2 mb-3 pt-4" onSubmit={handleSearch}>
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Cari barang bekas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full h-[42px] px-4 bg-[#111827] border border-[#374151] rounded-lg text-[#f9fafb] text-sm outline-none placeholder:text-[#6b7280]"
              />
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-[#1f2937] border border-[#374151] border-t-0 rounded-b-lg max-h-[250px] overflow-y-auto z-[1001] shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                  {searchSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 py-3 px-4 cursor-pointer transition-colors duration-200 border-b border-[#374151] last:border-b-0 hover:bg-[#374151]"
                      onClick={() => handleSuggestionClick(suggestion.title)}
                    >
                      <svg className="w-4 h-4 text-[#9ca3af] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                      </svg>
                      <span className="text-[#f9fafb] text-sm whitespace-nowrap overflow-hidden text-ellipsis">{suggestion.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" className="w-[42px] h-[42px] flex-shrink-0 flex items-center justify-center bg-[#4b5563] border-none rounded-lg cursor-pointer transition-colors duration-300 hover:bg-[#374151]" disabled={isSearching} aria-label="Cari produk">
              {isSearching ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              )}
            </button>
          </form>

          <div className="flex gap-3 items-center flex-wrap">
            <div className="flex-1 min-w-[150px]">
              <label htmlFor="filter-province-mobile" className="sr-only">Filter provinsi</label>
              <select
                id="filter-province-mobile"
                name="province"
                value={filters.province}
                onChange={handleFilterChange}
                className="w-full h-[42px] px-3 bg-[#111827] border border-[#374151] rounded-lg text-[#f9fafb] text-sm outline-none transition-all duration-300 cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2710%27%20height=%2710%27%20viewBox=%270%200%2010%2010%27%3E%3Cpath%20fill=%27%23a0a0a0%27%20d=%27M5%208L1%203h8z%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center] pr-8 focus:border-[#4b5563] focus:shadow-[0_0_0_2px_rgba(75,85,99,0.1)]"
              >
                <option value="">Semua Provinsi</option>
                {provinces.map(province => (
                  <option key={province} value={province}>{province}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label htmlFor="filter-city-mobile" className="sr-only">Filter kota</label>
              <select
                id="filter-city-mobile"
                name="city"
                value={filters.city}
                onChange={handleFilterChange}
                disabled={!filters.province}
                className="w-full h-[42px] px-3 bg-[#111827] border border-[#374151] rounded-lg text-[#f9fafb] text-sm outline-none transition-all duration-300 cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2710%27%20height=%2710%27%20viewBox=%270%200%2010%2010%27%3E%3Cpath%20fill=%27%23a0a0a0%27%20d=%27M5%208L1%203h8z%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center] pr-8 focus:border-[#4b5563] focus:shadow-[0_0_0_2px_rgba(75,85,99,0.1)]"
              >
                <option value="">Semua Kota</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label htmlFor="filter-category-mobile" className="sr-only">Filter kategori</label>
              <select
                id="filter-category-mobile"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-full h-[42px] px-3 bg-[#111827] border border-[#374151] rounded-lg text-[#f9fafb] text-sm outline-none transition-all duration-300 cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2710%27%20height=%2710%27%20viewBox=%270%200%2010%2010%27%3E%3Cpath%20fill=%27%23a0a0a0%27%20d=%27M5%208L1%203h8z%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center] pr-8 focus:border-[#4b5563] focus:shadow-[0_0_0_2px_rgba(75,85,99,0.1)]"
              >
                <option value="">Semua Kategori</option>
                {mainCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label htmlFor="filter-subcategory-mobile" className="sr-only">Filter sub kategori</label>
              <select
                id="filter-subcategory-mobile"
                name="subcategory"
                value={filters.subcategory}
                onChange={handleFilterChange}
                disabled={!filters.category}
                className="w-full h-[42px] px-3 bg-[#111827] border border-[#374151] rounded-lg text-[#f9fafb] text-sm outline-none transition-all duration-300 cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2710%27%20height=%2710%27%20viewBox=%270%200%2010%2010%27%3E%3Cpath%20fill=%27%23a0a0a0%27%20d=%27M5%208L1%203h8z%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center] pr-8 focus:border-[#4b5563] focus:shadow-[0_0_0_2px_rgba(75,85,99,0.1)]"
              >
                <option value="">Semua Sub Kategori</option>
                {subcategories.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile: Reset + 내주변 버튼을 2열 그리드로 */}
          <div className="grid grid-cols-2 gap-3 mt-3 pb-4">
            <button className="h-[42px] px-4 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap bg-[#374151] border border-[#374151] text-[#9ca3af] hover:bg-[#111827] hover:text-[#f9fafb]" onClick={resetFilters}>
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 4v6h6M23 20v-6h-6"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
              Reset
            </button>

            {locationStatus === 'idle' && (
              <button
                className="h-[42px] px-4 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap bg-[#4b5563] border-none text-white hover:bg-[#374151]"
                onClick={handleNearbyClick}
                title="Tampilkan produk di sekitar 50km"
                aria-label="Cari produk di sekitar lokasi"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="10" r="3"/>
                  <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
                </svg>
                Sekitar Saya
              </button>
            )}

            {locationStatus === 'denied' && (
              <button
                className="h-[42px] px-4 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap bg-[#4b5563] border-none text-white hover:bg-[#374151]"
                onClick={handleNearbyClick}
                title="Aktifkan lokasi untuk fitur ini"
                aria-label="Aktifkan akses lokasi"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="10" r="3"/>
                  <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
                </svg>
                Sekitar Saya
              </button>
            )}

            {locationStatus === 'success' && (
              <button className="h-[42px] px-4 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap bg-[#111827] border border-[#374151] text-[#9ca3af] hover:bg-[#374151]" onClick={handleNearbyClick}>
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                Sekitar 50km
              </button>
            )}
              </div>
            </div>
          </div>
        </div>
        </>
      )}

      {/* Products Grid - CSS로 반응형 제어 */}
      <section className="flex-1 bg-[#111827] pt-4 pb-4 md:pt-5 md:pb-[60px]">
        <div className="w-full max-w-[1400px] mx-auto px-5 max-md:px-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-6">
            {loading ? (
              <div className="col-span-full">
                <LoadingState message="Memuat produk..." />
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                {filteredProducts.map((product, index) => (
                  <React.Fragment key={product.id}>
                    <ProductCard
                      product={product}
                      context="home"
                      priority={index < 4}
                      index={index}
                    />
                    {/* Insert advertisement after every 8 products */}
                    {(index + 1) % 8 === 0 && (
                      <div className="col-span-full">
                        <Advertisement position="between_products" className="my-4" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </>
            ) : (
              <div className="col-span-full text-center py-20 px-5 text-[#9ca3af]">
                <div className="text-[80px] mb-6 opacity-50">🔍</div>
                <h3 className="text-2xl mb-3 text-[#f9fafb]">Produk Tidak Ditemukan</h3>
                <p className="text-base mb-6">Coba ubah filter atau reset pencarian</p>
                <button className="w-full py-3 px-6 rounded-lg font-medium cursor-pointer transition-all border-none text-sm inline-flex items-center justify-center gap-2 bg-[#4b5563] text-white hover:bg-[#374151] hover:-translate-y-px" onClick={resetFilters}>
                  Reset Filter
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Mobile Bottom Nav - CSS로 표시/숨김 제어 */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1f2937] border-t border-[#374151] grid grid-cols-5 py-2 z-[1000]">
          <button className="flex flex-col items-center gap-1 bg-transparent border-none text-[#4b5563] cursor-pointer py-2 transition-colors duration-300" onClick={() => router.push('/')}>
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span className="text-[11px] font-medium">Beranda</span>
          </button>
          <button className="flex flex-col items-center gap-1 bg-transparent border-none text-[#9ca3af] cursor-pointer py-2 transition-colors duration-300" onClick={() => setShowMobileFilters(!showMobileFilters)}>
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6"/>
              <line x1="4" y1="12" x2="20" y2="12"/>
              <line x1="4" y1="18" x2="14" y2="18"/>
              <circle cx="18" cy="18" r="2"/>
            </svg>
            <span className="text-[11px] font-medium">Filter</span>
          </button>
          <button className="flex flex-col items-center gap-1 bg-transparent border-none text-[#9ca3af] cursor-pointer py-2 transition-colors duration-300" onClick={() => router.push('/products/new')}>
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span className="text-[11px] font-medium">Jual</span>
          </button>
          <button
            className="flex flex-col items-center gap-1 bg-transparent border-none text-[#9ca3af] cursor-pointer py-2 transition-colors duration-300"
            onClick={handleNearbyClick}
            title="Produk di sekitar Anda"
            aria-label="Cari produk di sekitar lokasi Anda"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="10" r="3"/>
              <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
            </svg>
            <span className="text-[11px] font-medium">Sekitar</span>
          </button>
          <button className="flex flex-col items-center gap-1 bg-transparent border-none text-[#9ca3af] cursor-pointer py-2 transition-colors duration-300" onClick={() => router.push(isLoggedIn ? '/profile' : '/login')}>
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span className="text-[11px] font-medium">{isLoggedIn ? 'Profil' : 'Login'}</span>
          </button>
        </nav>

      {/* Footer - PC only - CSS로 표시/숨김 제어 */}
      <div className="hidden md:block">
        <Footer />
      </div>

      {/* Notification Permission Banner */}
      <NotificationPermission user={currentUser} supabase={supabase} />
    </div>
  );
}
