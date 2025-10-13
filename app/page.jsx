import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { INDONESIA_REGIONS } from './data/regions';
import { CATEGORIES, getCategoryIcon } from './data/categories';
import Footer from './components/Footer';
import './page.css';

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
  const [cities, setCities] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    // 초기에는 일반 상품 로드
    fetchProducts();
  }, [fetchProducts]);

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
  }, [supabase, setLoading, setProducts, setFilteredProducts]);

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
  }, [supabase, setLoading, setProducts, setFilteredProducts, setFilters, fetchProducts]);

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
      setCities(INDONESIA_REGIONS[value] || []);
      setFilters(prev => ({
        ...prev,
        province: value,
        city: '' // 시/군 초기화
      }));
    }
    // 카테고리 변경 시 서브카테고리 목록 업데이트
    else if (name === 'category') {
      const subs = value ? (CATEGORIES[value]?.subcategories || []) : [];
      setSubcategories(subs);
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
  }, [supabase, userLocation, fetchNearbyProducts, fetchProducts, setIsSearching, setProducts, setFilteredProducts]);

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
  }, [supabase, setSearchSuggestions, setShowSuggestions]);

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

  return (
    <div className="home-page">
      {/* Sticky Header + Filter Wrapper - PC only */}
      <div className={`sticky-top-wrapper ${isMobile ? 'mobile' : 'desktop'}`}>
        {/* Header - PC와 모바일 다른 레이아웃 */}
        <header className={`header ${isMobile ? 'mobile' : 'desktop'}`}>
          <div className="header-content container">
            <div className="header-left">
              <h1 className="logo" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>🛍️ Toko Monggo</h1>
            </div>

            {isMobile === false && (
              <div className="header-center">
                <form className="search-bar" onSubmit={handleSearch}>
                  <div className="search-input-wrapper">
                    <input
                      type="text"
                      placeholder="Cari barang bekas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    />
                    {showSuggestions && searchSuggestions.length > 0 && (
                      <div className="autocomplete-dropdown">
                        {searchSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="autocomplete-item"
                            onClick={() => handleSuggestionClick(suggestion.title)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="11" cy="11" r="8"/>
                              <path d="m21 21-4.35-4.35"/>
                            </svg>
                            <span>{suggestion.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button type="submit" className="search-btn" disabled={isSearching}>
                    {isSearching ? (
                      <div className="spinner-small"></div>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                      </svg>
                    )}
                  </button>
                </form>
              </div>
            )}

            <div className="header-right">
              {isMobile === true ? (
                <button className="btn-icon" onClick={() => setShowMobileFilters(!showMobileFilters)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="4" y1="6" x2="20" y2="6"/>
                    <line x1="4" y1="12" x2="20" y2="12"/>
                    <line x1="4" y1="18" x2="14" y2="18"/>
                    <circle cx="18" cy="18" r="2"/>
                  </svg>
                </button>
              ) : (
                <>
                  <button className="btn-icon" onClick={() => router.push('/profile')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </button>
                  <button className="btn-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                  <button className="btn btn-primary" onClick={() => router.push('/products/new')}>
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
        <section className="filter-section">
        <div className="container">
          {/* Mobile: 검색창도 필터 안에 */}
          {isMobile === true && (
            <div className="mobile-search-inline">
              <input type="text" placeholder="Cari barang bekas..." />
              <button className="search-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </button>
            </div>
          )}

          <div className="filter-bar">
            <div className="filter-group">
              <select
                name="province"
                value={filters.province}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">Semua Provinsi</option>
                {Object.keys(INDONESIA_REGIONS).map(province => (
                  <option key={province} value={province}>{province}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <select
                name="city"
                value={filters.city}
                onChange={handleFilterChange}
                disabled={!filters.province}
                className="filter-select"
              >
                <option value="">Semua Kota</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">Semua Kategori</option>
                {Object.keys(CATEGORIES).map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <select
                name="subcategory"
                value={filters.subcategory}
                onChange={handleFilterChange}
                disabled={!filters.category}
                className="filter-select"
              >
                <option value="">Semua Sub Kategori</option>
                {subcategories.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            {/* PC: Nearby 위치 표시 인라인 */}
            {isMobile === false && locationStatus === 'success' && (
              <div className="nearby-inline">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span>50km</span>
                <button className="btn-refresh-inline" onClick={handleNearbyClick} title="Refresh">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 4v6h6M23 20v-6h-6"/>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                  </svg>
                </button>
              </div>
            )}

            {/* PC: 위치 거부시 인라인 표시 */}
            {isMobile === false && locationStatus === 'denied' && (
              <button className="btn-nearby-inline" onClick={handleNearbyClick}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="10" r="3"/>
                  <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
                </svg>
                Sekitar Saya
              </button>
            )}

            {isMobile === false && locationStatus === 'idle' && (
              <button className="btn btn-primary" onClick={handleNearbyClick}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="10" r="3"/>
                  <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
                </svg>
                Sekitar Saya
              </button>
            )}

            {isMobile === false && (
              <button className="filter-reset-btn" onClick={resetFilters}>
                <svg className="reset-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 4v6h6M23 20v-6h-6"/>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                </svg>
                Reset
              </button>
            )}
          </div>

          {/* Mobile: Reset + 내주변 버튼을 2열 그리드로 */}
          {isMobile === true && (
            <div className="mobile-action-buttons">
              <button className="filter-reset-btn-mobile" onClick={resetFilters}>
                <svg className="reset-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 4v6h6M23 20v-6h-6"/>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                </svg>
                Reset
              </button>

              {locationStatus === 'denied' && (
                <button className="btn-nearby-mobile" onClick={handleNearbyClick}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="10" r="3"/>
                    <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
                  </svg>
                  Sekitar Saya
                </button>
              )}

              {locationStatus === 'idle' && (
                <button className="btn-nearby-mobile" onClick={handleNearbyClick}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="10" r="3"/>
                    <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
                  </svg>
                  Sekitar Saya
                </button>
              )}

              {locationStatus === 'success' && (
                <button className="btn-nearby-active-mobile" onClick={handleNearbyClick}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  Sekitar 50km
                </button>
              )}
            </div>
          )}
        </div>
      </section>
        )}
      </div>

      {/* Mobile Filter - wrapper 밖에 별도로 */}
      {isMobile && showMobileFilters && (
        <section className="filter-section mobile">
        <div className="container">
          {/* Mobile: 검색창도 필터 안에 */}
          <form className="mobile-search-inline" onSubmit={handleSearch}>
            <div className="search-input-wrapper-mobile">
              <input
                type="text"
                placeholder="Cari barang bekas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="autocomplete-dropdown mobile">
                  {searchSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="autocomplete-item"
                      onClick={() => handleSuggestionClick(suggestion.title)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                      </svg>
                      <span>{suggestion.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" className="search-btn" disabled={isSearching}>
              {isSearching ? (
                <div className="spinner-small"></div>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              )}
            </button>
          </form>

          <div className="filter-bar">
            <div className="filter-group">
              <select
                name="province"
                value={filters.province}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">Semua Provinsi</option>
                {Object.keys(INDONESIA_REGIONS).map(province => (
                  <option key={province} value={province}>{province}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <select
                name="city"
                value={filters.city}
                onChange={handleFilterChange}
                disabled={!filters.province}
                className="filter-select"
              >
                <option value="">Semua Kota</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">Semua Kategori</option>
                {Object.keys(CATEGORIES).map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <select
                name="subcategory"
                value={filters.subcategory}
                onChange={handleFilterChange}
                disabled={!filters.category}
                className="filter-select"
              >
                <option value="">Semua Sub Kategori</option>
                {subcategories.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile: Reset + 내주변 버튼을 2열 그리드로 */}
          <div className="mobile-action-buttons">
            <button className="filter-reset-btn-mobile" onClick={resetFilters}>
              <svg className="reset-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 4v6h6M23 20v-6h-6"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
              Reset
            </button>

            {locationStatus === 'idle' && (
              <button className="btn-nearby-mobile" onClick={handleNearbyClick}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="10" r="3"/>
                  <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
                </svg>
                Sekitar Saya
              </button>
            )}

            {locationStatus === 'denied' && (
              <button className="btn-nearby-mobile" onClick={handleNearbyClick}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="10" r="3"/>
                  <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
                </svg>
                Sekitar Saya
              </button>
            )}

            {locationStatus === 'success' && (
              <button className="btn-nearby-active-mobile" onClick={handleNearbyClick}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                Sekitar 50km
              </button>
            )}
          </div>
        </div>
      </section>
      )}

      {/* Products Grid */}
      <section className="products">
        <div className="container">
          <div className="section-header">
            <h3 className="section-title">Produk Terbaru</h3>
          </div>

          <div className={`product-grid ${isMobile ? 'mobile' : 'desktop'}`}>
            {loading ? (
              <LoadingState message="Memuat produk..." />
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} context="home" />
              ))
            ) : (
              <div className="no-products">
                <div className="no-products-icon">🔍</div>
                <h3>Produk Tidak Ditemukan</h3>
                <p>Coba ubah filter atau reset pencarian</p>
                <button className="btn btn-primary" onClick={resetFilters}>
                  Reset Filter
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Mobile Bottom Nav */}
      {isMobile && (
        <nav className="bottom-nav">
          <button className="nav-item active" onClick={() => router.push('/')}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span className="nav-label">Beranda</span>
          </button>
          <button className="nav-item" onClick={() => router.push('/search')}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <span className="nav-label">Cari</span>
          </button>
          <button className="nav-item" onClick={() => router.push('/products/new')}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span className="nav-label">Jual</span>
          </button>
          <button className="nav-item" onClick={() => router.push('/favorites')}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span className="nav-label">Favorit</span>
          </button>
          <button className="nav-item" onClick={() => router.push('/profile')}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span className="nav-label">Profil</span>
          </button>
        </nav>
      )}

      {/* Footer - PC only */}
      {!isMobile && <Footer />}
    </div>
  );
}
