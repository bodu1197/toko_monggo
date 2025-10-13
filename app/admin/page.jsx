'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; // Added for image optimization
import './admin.css';

import { useScreenSize } from '../hooks/useScreenSize';
import LoadingState from '../components/common/LoadingState';
import { useAuth } from '../hooks/useAuth'; // useAuth 훅 import
import { useSupabaseClient } from '../components/SupabaseClientProvider';

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth({ redirectTo: '/login' }); // useAuth 훅 적용
  const supabase = useSupabaseClient(); // Get the client instance here
  const [isAuthorized, setIsAuthorized] = useState(false); // 관리자 권한 확인을 위해 유지
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, users, products, access
  const isMobile = useScreenSize();

  // Dashboard stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    activeProducts: 0,
    totalReports: 0,
  });

  // User management
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  // Product management
  const [products, setProducts] = useState([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Report management
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [reportFilter, setReportFilter] = useState('all'); // all, pending, reviewing, resolved

  // Access statistics
  const [accessStats, setAccessStats] = useState({
    hourly: [],
    daily: [],
    monthly: [],
    yearly: [],
  });

  // Regional statistics
  const [regionalStats, setRegionalStats] = useState([]);

  const fetchDashboardStats = useCallback(async () => {
    try {
      // Total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Total products
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Active products
      const { count: activeCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'available');

      // Total reports (pending only)
      const { count: reportsCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setStats({
        totalUsers: usersCount || 0,
        totalProducts: productsCount || 0,
        activeProducts: activeCount || 0,
        totalReports: reportsCount || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  }, [supabase, setStats]);

  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      setFilteredUsers([]);
    }
  }, [supabase, setUsers, setFilteredUsers]);

  const fetchProducts = useCallback(async () => {
    try {
      console.log('[Admin] Fetching products...');

      // First fetch products with images and regencies
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          regencies (
            regency_name,
            provinces (province_name)
          ),
          product_images (
            image_url,
            order
          )
        `)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      console.log('[Admin] Products fetched:', productsData);

      // Get unique user IDs
      const userIds = [...new Set(productsData?.map(p => p.user_id).filter(Boolean))];

      if (userIds.length === 0) {
        setProducts([]);
        setFilteredProducts([]);
        return;
      }

      // Fetch profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      console.log('[Admin] Profiles fetched:', profilesData);

      // Create a map of user_id -> profile
      const profilesMap = {};
      profilesData?.forEach(profile => {
        profilesMap[profile.id] = profile;
      });

      // Merge products with profiles
      const enrichedProducts = productsData?.map(product => ({
        ...product,
        profiles: profilesMap[product.user_id] || null
      }));

      console.log('[Admin] Enriched products:', enrichedProducts);

      setProducts(enrichedProducts || []);
      setFilteredProducts(enrichedProducts || []);
    } catch (error) {
      console.error('[Admin] Error fetching products:', error);
      setProducts([]);
      setFilteredProducts([]);
    }
  }, [supabase, setProducts, setFilteredProducts]);

  const filterReports = (filter, reportsData = reports) => {
    if (filter === 'all') {
      setFilteredReports(reportsData);
    } else {
      setFilteredReports(reportsData.filter(report => report.status === filter));
    }
  };

  const fetchReports = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:reporter_id (
            full_name,
            email
          ),
          reported_product:reported_product_id (
            title,
            seller_id,
            profiles:seller_id (
              full_name
            )
          ),
          reported_user:reported_user_id (
            email,
            profiles (full_name)
          ),
          resolver:resolved_by (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReports(data || []);
      filterReports(reportFilter, data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
      setFilteredReports([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, reportFilter]);

  const handleSuspendProduct = async (productId) => {
    if (!confirm('이 상품을 발행 중지하시겠습니까?')) return;

    try {
      console.log('[Admin] Attempting to suspend product:', productId);
      console.log('[Admin] Current user:', user?.id);
      console.log('[Admin] Current user role:', profile?.role);

      const { data, error } = await supabase
        .from('products')
        .update({ status: 'suspended' })
        .eq('id', productId)
        .select();

      console.log('[Admin] Suspend result:', { data, error });

      if (error) throw error;

      alert('상품이 발행 중지되었습니다.');
      await fetchProducts();
      await fetchReports();
      await fetchDashboardStats();
    } catch (error) {
      console.error('[Admin] Error suspending product:', error);
      console.error('[Admin] Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      alert('발행 중지 실패: ' + error.message);
    }
  };

  const handleActivateProduct = async (productId) => {
    if (!confirm('이 상품을 활성화하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ status: 'active' })
        .eq('id', productId);

      if (error) throw error;

      alert('상품이 활성화되었습니다.');
      await fetchProducts();
      await fetchDashboardStats();
    } catch (error) {
      console.error('Error activating product:', error);
      alert('활성화 실패: ' + error.message);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('이 상품을 완전히 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.')) return;

    try {
      console.log('[Admin] Deleting product:', productId);

      // 1. 먼저 상품의 이미지 URL들을 가져옴
      const { data: productImages, error: fetchError } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', productId);

      if (fetchError) {
        console.error('[Admin] Error fetching images:', fetchError);
      }

      console.log('[Admin] Found images to delete:', productImages);

      // 2. 데이터베이스에서 이미지 레코드 삭제
      const { error: imageError } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productId);

      if (imageError) {
        console.error('[Admin] Error deleting image records:', imageError);
        throw imageError;
      }

      // 3. 상품 삭제 (CASCADE로 연결된 데이터도 자동 삭제)
      const { data: deleteData, error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .select();

      console.log('[Admin] Delete product result:', { deleteData, error });

      if (error) {
        console.error('[Admin] Error deleting product:', error);
        throw error;
      }

      if (!deleteData || deleteData.length === 0) {
        console.warn('[Admin] Product delete returned no data - might indicate RLS issue');
        throw new Error('삭제 작업이 실패했습니다. RLS 정책을 확인해주세요.');
      }

      // 4. 스토리지에서 이미지 파일 삭제
      if (productImages && productImages.length > 0) {
        for (const img of productImages) {
          try {
            // URL에서 파일 경로 추출
            // URL 형식: https://xxx.supabase.co/storage/v1/object/public/product-images/products/filename.jpg
            const urlParts = img.image_url.split('/product-images/');
            if (urlParts.length > 1) {
              const filePath = urlParts[1];

              const { error: storageError } = await supabase.storage
                .from('product-images')
                .remove([filePath]);

              if (storageError) {
                console.error('[Admin] Error deleting image from storage:', storageError);
              } else {
                console.log('[Admin] Deleted image from storage:', filePath);
              }
            }
          } catch (error) {
            console.error('[Admin] Error processing image deletion:', error);
          }
        }
      }

      alert('상품과 모든 이미지가 삭제되었습니다.');
      await fetchProducts();
      await fetchDashboardStats();
    } catch (error) {
      console.error('[Admin] Error deleting product:', error);
      console.error('[Admin] Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      alert('삭제 실패: ' + error.message);
    }
  };

  const handleEditProduct = (productId) => {
    router.push(`/products/${productId}/edit`);
  };

  const handleResolveReport = async (reportId) => {
    if (!confirm('이 신고를 처리 완료하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('reports')
        .update({
          status: 'resolved',
          resolved_by: user?.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      alert('신고 처리가 완료되었습니다.');
      await fetchReports();
      await fetchDashboardStats();
    } catch (error) {
      console.error('Error resolving report:', error);
      alert('처리 실패: ' + error.message);
    }
  };

  const fetchAccessStats = useCallback(async () => {
    const processHourlyStats = (logs) => {
      const now = new Date();
      const hourlyData = [];

      for (let i = 23; i >= 0; i--) {
        const hour = new Date(now);
        hour.setHours(hour.getHours() - i);
        const hourStr = hour.getHours().toString().padStart(2, '0') + ':00';

        const count = logs.filter(log => {
          const logDate = new Date(log.created_at);
          return logDate.getHours() === hour.getHours() &&
                 logDate.getDate() === hour.getDate();
        }).length;

        hourlyData.push({ label: hourStr, count });
      }

      return hourlyData;
    };

    const processDailyStats = (logs) => {
      const now = new Date();
      const dailyData = [];

      for (let i = 29; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);
        const dayStr = `${day.getDate()}/${day.getMonth() + 1}`;

        const count = logs.filter(log => {
          const logDate = new Date(log.created_at);
          return logDate.getDate() === day.getDate() &&
                 logDate.getMonth() === day.getMonth() &&
                 logDate.getFullYear() === day.getFullYear();
        }).length;

        dailyData.push({ label: dayStr, count });
      }

      return dailyData;
    };

    const processMonthlyStats = (logs) => {
      const now = new Date();
      const monthlyData = [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

      for (let i = 11; i >= 0; i--) {
        const month = new Date(now);
        month.setMonth(month.getMonth() - i);
        const monthStr = months[month.getMonth()];

        const count = logs.filter(log => {
          const logDate = new Date(log.created_at);
          return logDate.getMonth() === month.getMonth() &&
                 logDate.getFullYear() === month.getFullYear();
        }).length;

        monthlyData.push({ label: monthStr, count });
      }

      return monthlyData;
    };

    const processYearlyStats = (logs) => {
      const yearCounts = {};

      logs.forEach(log => {
        const year = new Date(log.created_at).getFullYear();
        yearCounts[year] = (yearCounts[year] || 0) + 1;
      });

      return Object.entries(yearCounts)
        .map(([year, count]) => ({ label: year, count }))
        .sort((a, b) => a.label - b.label);
    };

    try {
      // Fetch access logs (assuming access_logs table exists)
      const { data, error } = await supabase
        .from('access_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const logs = data || [];

      // Process hourly stats (last 24 hours)
      const hourly = processHourlyStats(logs);

      // Process daily stats (last 30 days)
      const daily = processDailyStats(logs);

      // Process monthly stats (last 12 months)
      const monthly = processMonthlyStats(logs);

      // Process yearly stats
      const yearly = processYearlyStats(logs);

      setAccessStats({ hourly, daily, monthly, yearly });
    } catch (error) {
      console.error('Error fetching access stats:', error);
      // Set empty data if table doesn't exist
      setAccessStats({ hourly: [], daily: [], monthly: [], yearly: [] });
    }
  }, [supabase, setAccessStats]);

  const fetchRegionalStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('access_logs')
        .select(`
          regency_id,
          regencies (
            regency_name,
            province_id,
            provinces (province_name)
          )
        `);

      if (error) throw error;

      // Count access by regency (시/군 단위)
      const regencyCounts = {};
      data?.forEach(log => {
        const regencyName = log.regencies?.regency_name || 'Tidak Diketahui';
        const provinceName = log.regencies?.provinces?.province_name || '';
        const fullName = provinceName ? `${regencyName}, ${provinceName}` : regencyName;

        regencyCounts[fullName] = (regencyCounts[fullName] || 0) + 1;
      });

      // Convert to array and sort
      const stats = Object.entries(regencyCounts)
        .map(([region, count]) => ({ region, count }))
        .sort((a, b) => b.count - a.count);

      setRegionalStats(stats);
    } catch (error) {
      console.error('Error fetching regional stats:', error);
      setRegionalStats([]);
    }
  }, [supabase, setRegionalStats]);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    if (!query) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user =>
      user.full_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phone_number?.includes(query)
    );

    setFilteredUsers(filtered);
  };

  const handleProductSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setProductSearchQuery(query);

    if (!query) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(product =>
      product.title?.toLowerCase().includes(query) ||
      product.profiles?.full_name?.toLowerCase().includes(query) ||
      product.regencies?.regency_name?.toLowerCase().includes(query)
    );

    setFilteredProducts(filtered);
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

  useEffect(() => {
    if (!loading) {
      if (user && profile?.role === 'admin') {
        setIsAuthorized(true);
        // 초기 데이터 로드
        fetchDashboardStats();
        fetchAccessStats();
        fetchRegionalStats();
        // 활성 탭에 따른 데이터 로드
        if (activeTab === 'users') {
          fetchUsers();
        } else if (activeTab === 'products') {
          fetchProducts();
        } else if (activeTab === 'reports') {
          fetchReports();
        }
      } else if (user) {
        // 로그인했지만 관리자가 아님
        alert('접근 거부. 관리자 권한이 없습니다.\n\n현재 역할: ' + (profile?.role || 'undefined'));
        router.push('/');
      } else {
        // 로그인하지 않음 (useAuth에서 이미 /login으로 리디렉션)
      }
    }
  }, [loading, user, profile, activeTab, fetchAccessStats, fetchReports, fetchRegionalStats, fetchDashboardStats, fetchUsers, fetchProducts, router]);

  if (loading || !isAuthorized) {
    return (
      <div className="admin-page">
        <LoadingState message="Memeriksa akses..." />
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <header className="admin-header">
        <div className="container">
          <div className="header-left">
            <h1 className="admin-title">🛡️ 관리자 대시보드</h1>
          </div>
          <div className="header-right">
            <button className="btn-icon" onClick={() => router.push('/')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      </header>

      <div className="admin-layout">
        {/* Sidebar */}
        {!isMobile && (
          <aside className="admin-sidebar">
            <nav className="sidebar-nav">
              <button
                className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
                대시보드
              </button>
              <button
                className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                회원 관리
              </button>
              <button
                className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => setActiveTab('products')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
                상품 관리
              </button>
              <button
                className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
                onClick={() => setActiveTab('reports')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                신고 관리
                {stats.totalReports > 0 && (
                  <span className="badge">{stats.totalReports}</span>
                )}
              </button>
              <button
                className={`nav-item ${activeTab === 'access' ? 'active' : ''}`}
                onClick={() => setActiveTab('access')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18"/>
                  <path d="m19 9-5 5-4-4-3 3"/>
                </svg>
                접속 통계
              </button>
              <button
                className={`nav-item ${activeTab === 'regional' ? 'active' : ''}`}
                onClick={() => setActiveTab('regional')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                지역별 통계
              </button>
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className="admin-content">
          {/* Mobile Tabs */}
          {isMobile && (
            <div className="mobile-tabs">
              <button
                className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                대시보드
              </button>
              <button
                className={`tab ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                회원
              </button>
              <button
                className={`tab ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => setActiveTab('products')}
              >
                상품
              </button>
              <button
                className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
                onClick={() => setActiveTab('reports')}
              >
                신고
              </button>
              <button
                className={`tab ${activeTab === 'access' ? 'active' : ''}`}
                onClick={() => setActiveTab('access')}
              >
                접속
              </button>
              <button
                className={`tab ${activeTab === 'regional' ? 'active' : ''}`}
                onClick={() => setActiveTab('regional')}
              >
                지역
              </button>
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="dashboard-section">
              <h2 className="section-title">대시보드 통계</h2>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon users">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <div className="stat-number">{stats.totalUsers}</div>
                    <div className="stat-label">총 회원 수</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon products">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <div className="stat-number">{stats.totalProducts}</div>
                    <div className="stat-label">총 상품 수</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon active">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <div className="stat-number">{stats.activeProducts}</div>
                    <div className="stat-label">활성 상품</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon reports">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <div className="stat-number">{stats.totalReports}</div>
                    <div className="stat-label">총 신고 수</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="users-section">
              <div className="section-header">
                <h2 className="section-title">회원 관리</h2>
                <div className="search-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="회원 검색..."
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                </div>
              </div>

              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>이름</th>
                      <th>이메일</th>
                      <th>전화번호</th>
                      <th>가입일</th>
                      <th>상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id}>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar">
                              {user.avatar_url ? (
                                <Image src={user.avatar_url} alt={user.full_name} width={40} height={40} />
                              ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                  <circle cx="12" cy="7" r="4"/>
                                </svg>
                              )}
                            </div>
                            <span>{user.full_name || '사용자'}</span>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>{user.phone_number || '-'}</td>
                        <td>{new Date(user.created_at).toLocaleDateString('ko-KR')}</td>
                        <td>
                          <span className="status-badge active">활성</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredUsers.length === 0 && (
                  <div className="empty-state">
                    <p>검색 결과가 없습니다</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="products-section">
              <div className="section-header">
                <h2 className="section-title">상품 관리</h2>
                <div className="search-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="상품 검색..."
                    value={productSearchQuery}
                    onChange={handleProductSearch}
                  />
                </div>
              </div>

              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>상품명</th>
                      <th>판매자</th>
                      <th>가격</th>
                      <th>지역</th>
                      <th>등록일</th>
                      <th>상태</th>
                      <th>액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(product => {
                      const firstImage = product.product_images?.sort((a, b) => a.order - b.order)?.[0]?.image_url;
                      return (
                        <tr key={product.id}>
                          <td>
                            <div className="user-cell">
                              {firstImage && (
                                <div className="user-avatar">
                                  <Image src={firstImage} alt={product.title} width={40} height={40} />
                                </div>
                              )}
                              <span>{product.title}</span>
                            </div>
                          </td>
                          <td>{product.profiles?.full_name || '-'}</td>
                          <td>Rp {product.price?.toLocaleString('id-ID')}</td>
                          <td>{product.regencies?.regency_name || '-'}</td>
                          <td>{new Date(product.created_at).toLocaleDateString('ko-KR')}</td>
                          <td>
                            <span className={`status-badge ${product.status === 'active' ? 'active' : product.status === 'suspended' ? 'suspended' : ''}`}>
                              {product.status === 'active' ? '활성' : product.status === 'suspended' ? '중지' : product.status === 'sold' ? '판매완료' : '숨김'}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="btn-edit"
                                onClick={() => handleEditProduct(product.id)}
                                title="상품 수정"
                              >
                                수정
                              </button>
                              {product.status === 'active' ? (
                                <button
                                  className="btn-suspend"
                                  onClick={() => handleSuspendProduct(product.id)}
                                  title="상품 발행중지"
                                >
                                  중지
                                </button>
                              ) : product.status === 'suspended' ? (
                                <button
                                  className="btn-activate"
                                  onClick={() => handleActivateProduct(product.id)}
                                  title="상품 활성화"
                                >
                                  활성화
                                </button>
                              ) : null}
                              <button
                                className="btn-delete"
                                onClick={() => handleDeleteProduct(product.id)}
                                title="상품 삭제"
                              >
                                삭제
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredProducts.length === 0 && (
                  <div className="empty-state">
                    <p>검색 결과가 없습니다</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="reports-section">
              <div className="section-header">
                <h2 className="section-title">신고 관리</h2>
                <div className="filter-buttons">
                  <button
                    className={`filter-btn ${reportFilter === 'all' ? 'active' : ''}`}
                    onClick={() => { setReportFilter('all'); filterReports('all'); }}
                  >
                    전체
                  </button>
                  <button
                    className={`filter-btn ${reportFilter === 'pending' ? 'active' : ''}`}
                    onClick={() => { setReportFilter('pending'); filterReports('pending'); }}
                  >
                    대기중
                  </button>
                  <button
                    className={`filter-btn ${reportFilter === 'reviewing' ? 'active' : ''}`}
                    onClick={() => { setReportFilter('reviewing'); filterReports('reviewing'); }}
                  >
                    검토중
                  </button>
                  <button
                    className={`filter-btn ${reportFilter === 'resolved' ? 'active' : ''}`}
                    onClick={() => { setReportFilter('resolved'); filterReports('resolved'); }}
                  >
                    처리완료
                  </button>
                </div>
              </div>

              <div className="reports-table-container">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>신고 유형</th>
                      <th>신고 대상</th>
                      <th>신고자</th>
                      <th>신고 사유</th>
                      <th>신고일</th>
                      <th>상태</th>
                      <th>처리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map(report => (
                      <tr key={report.id}>
                        <td>
                          <span className={`type-badge ${report.report_type}`}>
                            {report.report_type === 'product' ? '상품' : '회원'}
                          </span>
                        </td>
                        <td>
                          {report.report_type === 'product' ? (
                            <div className="report-target">
                              <div>{report.reported_product?.title || '삭제된 상품'}</div>
                              <small>판매자: {report.reported_product?.profiles?.full_name || '-'}</small>
                            </div>
                          ) : (
                            <div className="report-target">
                              <div>{report.reported_user?.profiles?.full_name || '사용자'}</div>
                              <small>{report.reported_user?.email || '-'}</small>
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="reporter-info">
                            <div>{report.reporter?.full_name || '사용자'}</div>
                            <small>{report.reporter?.email || '-'}</small>
                          </div>
                        </td>
                        <td>
                          <span className="reason-badge">
                            {report.reason === 'fraud' ? '사기' :
                             report.reason === 'fake' ? '가짜상품' :
                             report.reason === 'spam' ? '스팸' :
                             report.reason === 'inappropriate' ? '부적절' :
                             report.reason === 'duplicate' ? '중복' : '기타'}
                          </span>
                          {report.description && (
                            <div className="report-description">{report.description}</div>
                          )}
                        </td>
                        <td>{new Date(report.created_at).toLocaleDateString('ko-KR')}</td>
                        <td>
                          <span className={`status-badge ${
                            report.status === 'pending' ? 'pending' :
                            report.status === 'reviewing' ? 'reviewing' :
                            report.status === 'resolved' ? 'resolved' : 'rejected'
                          }`}>
                            {report.status === 'pending' ? '대기중' :
                             report.status === 'reviewing' ? '검토중' :
                             report.status === 'resolved' ? '처리완료' : '반려'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            {report.status === 'pending' && report.report_type === 'product' && (
                              <button
                                className="btn-suspend"
                                onClick={() => handleSuspendProduct(report.reported_product_id)}
                                title="상품 발행중지"
                              >
                                발행중지
                              </button>
                            )}
                            {report.status !== 'resolved' && (
                              <button
                                className="btn-resolve"
                                onClick={() => handleResolveReport(report.id)}
                                title="처리완료"
                              >
                                처리완료
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredReports.length === 0 && (
                  <div className="empty-state">
                    <p>신고 내역이 없습니다</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Access Statistics Tab */}
          {activeTab === 'access' && (
            <div className="access-section">
              <h2 className="section-title">접속 통계</h2>

              {/* Hourly */}
              <div className="chart-container">
                <h3 className="chart-title">시간별 접속 (최근 24시간)</h3>
                <div className="chart">
                  {accessStats.hourly.map((item, index) => (
                    <div key={index} className="chart-bar">
                      <div
                        className="bar"
                        style={{
                          height: `${Math.max(item.count * 10, 5)}px`,
                        }}
                      />
                      <div className="bar-label">{item.label}</div>
                      <div className="bar-value">{item.count}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Daily */}
              <div className="chart-container">
                <h3 className="chart-title">일별 접속 (최근 30일)</h3>
                <div className="chart">
                  {accessStats.daily.map((item, index) => (
                    <div key={index} className="chart-bar">
                      <div
                        className="bar"
                        style={{
                          height: `${Math.max(item.count * 5, 5)}px`,
                        }}
                      />
                      <div className="bar-label">{item.label}</div>
                      <div className="bar-value">{item.count}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly */}
              <div className="chart-container">
                <h3 className="chart-title">월별 접속 (최근 12개월)</h3>
                <div className="chart">
                  {accessStats.monthly.map((item, index) => (
                    <div key={index} className="chart-bar">
                      <div
                        className="bar"
                        style={{
                          height: `${Math.max(item.count * 2, 5)}px`,
                        }}
                      />
                      <div className="bar-label">{item.label}</div>
                      <div className="bar-value">{item.count}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Yearly */}
              <div className="chart-container">
                <h3 className="chart-title">연도별 접속</h3>
                <div className="chart">
                  {accessStats.yearly.map((item, index) => (
                    <div key={index} className="chart-bar">
                      <div
                        className="bar"
                        style={{
                          height: `${Math.max(item.count / 10, 5)}px`,
                        }}
                      />
                      <div className="bar-label">{item.label}</div>
                      <div className="bar-value">{item.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Regional Statistics Tab */}
          {activeTab === 'regional' && (
            <div className="regional-section">
              <h2 className="section-title">지역별 방문자 통계 (GPS 위치 기반)</h2>

              <div className="regional-table-container">
                <table className="regional-table">
                  <thead>
                    <tr>
                      <th>순위</th>
                      <th>시/군</th>
                      <th>접속 수</th>
                      <th>비율</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regionalStats.map((stat, index) => {
                      const totalAccess = regionalStats.reduce((sum, s) => sum + s.count, 0);
                      const percentage = ((stat.count / totalAccess) * 100).toFixed(1);
                      return (
                        <tr key={index}>
                          <td>#{index + 1}</td>
                          <td>{stat.region}</td>
                          <td>{stat.count}회</td>
                          <td>
                            <div className="percentage-cell">
                              <div className="percentage-bar">
                                <div
                                  className="percentage-fill"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span>{percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {regionalStats.length === 0 && (
                  <div className="empty-state">
                    <p>지역 데이터가 없습니다</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
