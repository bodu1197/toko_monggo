'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Footer from './components/Footer';

import { useScreenSize } from './hooks/useScreenSize';
import LoadingState from './components/common/LoadingState';
import ProductCard from './components/products/ProductCard';
import { useSupabaseClient } from './components/SupabaseClientProvider';

export default function HomePage() {
  const router = useRouter();
  const supabase = useSupabaseClient(); // Get the client instance here
  const isMobile = useScreenSize();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle'); // idle, loading, success, denied

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
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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
      console.log('[Home] 🗺️ Loaded provinces from DB:', provinceNames.length);
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
      console.log('[Home] 🏙️ Loaded cities for', provinceName, ':', cityNames.length);
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

      const uniqueParents = [...new Set(data.map(cat => cat.parent_category))].sort();
      setMainCategories(uniqueParents);
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
    } catch (error) {
      console.error('Error loading subcategories:', error);
      setSubcategories([]);
    }
  }, [supabase]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
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
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // 데이터 변환
      const transformedProducts = data?.map(product => ({
        id: product.id,
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
  }, [supabase]); // ✅ FIXED: Remove setter functions from dependencies

  const fetchNearbyProducts = useCallback(async (lat, lng) => {
    try {
      setLoading(true);

      // RPC 함수 호출
      const { data, error } = await supabase.rpc('nearby_products', {
        user_lat: lat,
        user_lng: lng,
        max_distance_km: 50,
        limit_count: 50
      });

      if (error) {
        console.error('❌ nearby_products RPC error:', error);
        console.error('Error details:', {
          message: error.message || 'No message',
          details: error.details || 'No details',
          hint: error.hint || 'No hint',
          code: error.code || 'No code'
        });

        // RPC 함수가 없거나 실패하면 일반 상품 로드
        console.log('⚠️ Falling back to regular product fetch');
        await fetchProducts();
        return;
      }

      if (!data || data.length === 0) {
        // 주변에 상품 없으면 일반 상품 로드
        await fetchProducts();
        return;
      }

      // RPC 함수가 이미 모든 상세 정보를 반환하므로, 바로 변환
      const transformedProducts = data?.map(product => ({
        id: product.id,
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

      // 거리순 정렬 (RPC에서 이미 정렬되지만, 혹시 몰라 클라이언트에서도 유지)
      setProducts(transformedProducts);
      setFilteredProducts(transformedProducts);

      // 위치 기반 필터 드롭다운 업데이트
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
      // 에러시 일반 상품 로드
      await fetchProducts();
    } finally {
      setLoading(false);
    }
  }, [supabase, fetchProducts]); // ✅ FIXED: Remove setter functions

  const tryGetLocationAndFetch = useCallback(() => {
    if (!navigator.geolocation) {
      // Geolocation 미지원 - 일반 상품 로드
      setLocationStatus('denied');
      fetchProducts();
      return;
    }

    setLocationStatus('loading');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // 위치 허용됨
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        setLocationStatus('success');
        fetchNearbyProducts(latitude, longitude);
      },
      (error) => {
        // 위치 거부됨 또는 에러
        console.log('위치 정보 접근 거부 또는 에러:', error.message);
        setLocationStatus('denied');
        fetchProducts(); // 일반 상품 로드
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5분 캐시
      }
    );
  }, [fetchProducts, fetchNearbyProducts]);

  const handleNearbyClick = () => {
    if (userLocation) {
      // 이미 위치 있으면 바로 재검색
      fetchNearbyProducts(userLocation.latitude, userLocation.longitude);
    } else {
      // 위치 없으면 다시 요청
      tryGetLocationAndFetch();
    }
  };

  // 필터링 로직
  useEffect(() => {
    let result = [...products];

    // 지역 필터 (주)
    if (filters.province) {
      result = result.filter(p => p.province === filters.province);
    }

    // 지역 필터 (시/군)
    if (filters.city) {
      result = result.filter(p => p.city === filters.city);
    }

    // 카테고리 필터
    if (filters.category) {
      result = result.filter(p => p.category === filters.category);
    }

    // 서브카테고리 필터
    if (filters.subcategory) {
      result = result.filter(p => p.subcategory === filters.subcategory);
    }

    setFilteredProducts(result);
  }, [filters, products]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    // 주 변경 시 시/군 목록 업데이트
    if (name === 'province') {
      loadCities(value);
      setFilters(prev => ({
        ...prev,
        province: value,
        city: '' // 시/군 초기화
      }));
    }
    // 카테고리 변경 시 서브카테고리 목록 업데이트
    else if (name === 'category') {
      loadSubcategories(value);
      setFilters(prev => ({
        ...prev,
        category: value,
        subcategory: '' // 서브카테고리 초기화
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
    // Reset시 원래 상품 목록으로 (위치 기반 or 전체)
    if (userLocation) {
      fetchNearbyProducts(userLocation.latitude, userLocation.longitude);
    } else {
      fetchProducts();
    }
  };

  // 검색 함수
  const searchProducts = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      // 검색어가 없으면 기본 상품 로드
      if (userLocation) {
        fetchNearbyProducts(userLocation.latitude, userLocation.longitude);
      } else {
        fetchProducts();
      }
      return;
    }

    try {
      setIsSearching(true);

      // PostgreSQL tsquery 형식으로 변환 (공백을 & 로)
      const tsQuery = query.trim().split(/\s+/).join(' & ');

      const { data, error } = await supabase.rpc('search_products', {
        search_query: tsQuery,
        limit_count: 50
      });

      if (error) throw error;

      // 검색 결과가 있으면 상세 정보 가져오기
      if (data && data.length > 0) {
        const productIds = data.map(p => p.id);

        const { data: fullData, error: fullError } = await supabase
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
          .in('id', productIds)
          .eq('status', 'active');

        if (fullError) throw fullError;

        // rank 정보를 매핑
        const rankMap = {};
        data.forEach(p => {
          rankMap[p.id] = p.rank;
        });

        const transformedProducts = fullData?.map(product => ({
          id: product.id,
          title: product.title,
          price: product.price,
          province: product.regencies?.provinces?.province_name || '',
          city: product.regencies?.regency_name || '',
          category: product.categories?.name || '',
          condition: product.condition || '',
          image: product.product_images?.[0]?.image_url || null,
          latitude: product.latitude,
          longitude: product.longitude,
          rank: rankMap[product.id],
        })) || [];

        // rank 순으로 정렬
        transformedProducts.sort((a, b) => (b.rank || 0) - (a.rank || 0));

        setProducts(transformedProducts);
        setFilteredProducts(transformedProducts);
      } else {
        setProducts([]);
        setFilteredProducts([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setIsSearching(false);
    }
  }, [supabase, userLocation, fetchNearbyProducts, fetchProducts]); // ✅ FIXED: Remove setter functions

  // 자동완성 함수
  const fetchAutocompleteSuggestions = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      // PostgreSQL prefix search용 tsquery
      const tsQuery = query.trim().split(/\s+/).join(' & ');

      const { data, error } = await supabase.rpc('autocomplete_products', {
        search_query: tsQuery,
        limit_count: 8
      });

      if (error) throw error;

      setSearchSuggestions(data || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Autocomplete error:', error);
      setSearchSuggestions([]);
    }
  }, [supabase]); // ✅ FIXED: Remove setter functions

  // 검색 입력 핸들러 (debouncing)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        fetchAutocompleteSuggestions(searchQuery);
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, fetchAutocompleteSuggestions]);

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
    // 초기에 지역, 카테고리 로드 및 일반 상품 로드
    loadProvinces();
    loadMainCategories();
    fetchProducts();
  }, [loadProvinces, loadMainCategories, fetchProducts]);

  return (
    <div className="min-h-screen pb-20">
      {/* Sticky Header + Filter Wrapper - PC only */}
      <div className={`${isMobile ? 'sticky top-0 z-[1000] bg-[#1f2937]' : 'sticky top-0 z-[1000] bg-[#1f2937] will-change-transform transform-gpu backface-hidden'}`}>
        {/* Header - PC와 모바일 다른 레이아웃 */}
        <header className={`${isMobile ? 'sticky top-0 z-[1000]' : ''} bg-[#1f2937] border-b border-[#374151] relative z-[1] ${isMobile ? 'py-3' : 'py-4'}`}>
          <div className="w-full max-w-[1400px] mx-auto px-5 max-md:px-4 flex items-center justify-between gap-8">
            <div className="flex items-center gap-12">
              <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold whitespace-nowrap cursor-pointer`} onClick={() => router.push('/')}>🛍️ Toko Monggo</h1>
            </div>

            {isMobile === false && (
              <div className="flex-1 max-w-[600px]">
                <form className="flex gap-5 relative" onSubmit={handleSearch}>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Cari barang bekas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      className="w-full bg-[#111827] border border-[#374151] text-[#f9fafb] py-3 px-4 rounded-lg text-sm transition-all outline-none font-[inherit] focus:border-[#4b5563] focus:shadow-[0_0_0_3px_rgba(75,85,99,0.1)] placeholder:text-[#6b7280]"
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
                  <button type="submit" className="py-3 px-5 bg-[#4b5563] border-none rounded-lg cursor-pointer transition-colors duration-300 flex items-center justify-center hover:bg-[#374151]" disabled={isSearching}>
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
            )}

            <div className="flex items-center gap-4">
              {isMobile === false && (
                <>
                  <button
                    className="flex items-center justify-center w-10 h-10 bg-[#374151] border border-[#374151] rounded-lg cursor-pointer transition-all hover:bg-[#111827] hover:border-[#4b5563] hover:-translate-y-0.5"
                    onClick={() => router.push('/profile')}
                  >
                    <svg className="w-5 h-5 text-[#f9fafb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </button>
                  <button className="flex items-center justify-center w-10 h-10 bg-[#374151] border border-[#374151] rounded-lg cursor-pointer transition-all hover:bg-[#111827] hover:border-[#4b5563] hover:-translate-y-0.5">
                    <svg className="w-5 h-5 text-[#f9fafb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                  <button className="w-full py-3 px-6 rounded-lg font-medium cursor-pointer transition-all border-none text-sm inline-flex items-center justify-center gap-2 bg-[#4b5563] text-white hover:bg-[#374151] hover:-translate-y-px" onClick={() => router.push('/products/new')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Jual
                  </button>
                </>
              )}
            </div>
          </div>

        </header>

        {/* Filter Bar - PC는 wrapper 안, 모바일은 wrapper 밖 */}
        {isMobile === false && (
        <section className="bg-[#1f2937] border-b border-[#374151] py-5 relative z-[1]">
        <div className="w-full max-w-[1400px] mx-auto px-5 max-md:px-4">
          <div className="flex gap-3 items-center flex-wrap">
            <div className="flex-1 min-w-[150px]">
              <select
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
              <select
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
              <select
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
              <select
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
            {isMobile === false && locationStatus === 'success' && (
              <div className="flex items-center gap-2 h-[42px] px-4 bg-[#111827] border border-[#374151] rounded-lg text-[#9ca3af] text-sm font-medium whitespace-nowrap">
                <svg className="w-[18px] h-[18px] text-[#9ca3af] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span className="font-medium text-[#9ca3af]">50km</span>
                <button className="w-8 h-8 flex items-center justify-center bg-[#374151] border border-[#374151] rounded-md text-[#9ca3af] cursor-pointer transition-all duration-300 flex-shrink-0 ml-1 hover:bg-[#4b5563] hover:text-[#f9fafb] hover:rotate-180" onClick={handleNearbyClick} title="Refresh">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 4v6h6M23 20v-6h-6"/>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                  </svg>
                </button>
              </div>
            )}

            {/* PC: 위치 거부시 인라인 표시 */}
            {isMobile === false && locationStatus === 'denied' && (
              <button className="flex items-center justify-center gap-2 h-[42px] px-4 bg-[#4b5563] border-none rounded-lg text-white text-sm font-semibold cursor-pointer transition-all duration-300 whitespace-nowrap hover:bg-[#374151] hover:-translate-y-0.5" onClick={handleNearbyClick}>
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="10" r="3"/>
                  <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
                </svg>
                Sekitar Saya
              </button>
            )}

            {isMobile === false && locationStatus === 'idle' && (
              <button className="flex items-center justify-center gap-2 h-[42px] px-4 bg-[#4b5563] border-none rounded-lg text-white text-sm font-semibold cursor-pointer transition-all duration-300 whitespace-nowrap hover:bg-[#374151] hover:-translate-y-0.5" onClick={handleNearbyClick}>
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="10" r="3"/>
                  <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
                </svg>
                Sekitar Saya
              </button>
            )}

            {isMobile === false && (
              <button className="h-[42px] px-5 bg-[#374151] border border-[#374151] rounded-lg text-[#9ca3af] text-sm font-semibold cursor-pointer transition-all duration-300 whitespace-nowrap flex items-center justify-center gap-2 hover:bg-[#111827] hover:text-[#f9fafb] hover:border-[#4b5563]" onClick={resetFilters}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 4v6h6M23 20v-6h-6"/>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                </svg>
                Reset
              </button>
            )}
          </div>
        </div>
      </section>
        )}
      </div>

      {/* Mobile Filter - Bottom Slide-up Popup */}
      {isMobile && showMobileFilters && (
        <>
          <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/70 z-[1500] animate-[fadeIn_0.3s_ease-out]" onClick={() => setShowMobileFilters(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-[#1f2937] rounded-t-[20px] z-[1501] animate-[slideUpFromBottom_0.3s_ease-out] max-h-[85vh] overflow-y-auto shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between py-5 px-6 border-b border-[#374151] bg-[#1f2937] sticky top-0 z-10">
              <h3 className="text-xl font-bold text-[#f9fafb] m-0">Filter & Pencarian</h3>
              <button className="w-9 h-9 flex items-center justify-center bg-[#374151] border border-[#374151] rounded-full cursor-pointer transition-all duration-300 hover:bg-[#111827] hover:border-[#9ca3af]" onClick={() => setShowMobileFilters(false)}>
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
            <div className="flex-1 relative min-w-[293px] max-w-[293px]">
              <input
                type="text"
                placeholder="Cari barang bekas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-[293px] min-w-[293px] max-w-[293px] h-[42px] px-4 bg-[#111827] border border-[#374151] rounded-lg text-[#f9fafb] text-sm outline-none placeholder:text-[#6b7280]"
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
            <button type="submit" className="w-[42px] h-[42px] p-0 flex items-center justify-center py-3 px-5 bg-[#4b5563] border-none rounded-lg cursor-pointer transition-colors duration-300 hover:bg-[#374151]" disabled={isSearching}>
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
              <select
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
              <select
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
              <select
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
              <select
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
              <button className="h-[42px] px-4 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap bg-[#4b5563] border-none text-white hover:bg-[#374151]" onClick={handleNearbyClick}>
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="10" r="3"/>
                  <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
                </svg>
                Sekitar Saya
              </button>
            )}

            {locationStatus === 'denied' && (
              <button className="h-[42px] px-4 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap bg-[#4b5563] border-none text-white hover:bg-[#374151]" onClick={handleNearbyClick}>
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

      {/* Products Grid */}
      <section className="py-[60px] bg-[#111827]">
        <div className="w-full max-w-[1400px] mx-auto px-5 max-md:px-4">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[1.25rem] font-bold text-[#f9fafb]">Produk Terbaru</h3>
          </div>

          <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-4 gap-6'}`}>
            {loading ? (
              <div className="col-span-full">
                <LoadingState message="Memuat produk..." />
              </div>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} context="home" />
              ))
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

      {/* Mobile Bottom Nav */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#1f2937] border-t border-[#374151] grid grid-cols-5 py-2 z-[1000]">
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
          <button className="flex flex-col items-center gap-1 bg-transparent border-none text-[#9ca3af] cursor-pointer py-2 transition-colors duration-300" onClick={handleNearbyClick}>
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="10" r="3"/>
              <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
            </svg>
            <span className="text-[11px] font-medium">Sekitar</span>
          </button>
          <button className="flex flex-col items-center gap-1 bg-transparent border-none text-[#9ca3af] cursor-pointer py-2 transition-colors duration-300" onClick={() => router.push('/profile')}>
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span className="text-[11px] font-medium">Profil</span>
          </button>
        </nav>
      )}

      {/* Footer - PC only */}
      {!isMobile && <Footer />}
    </div>
  );
}
