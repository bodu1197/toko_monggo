'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; // Added for image optimization

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

  // Trash management
  const [trashProducts, setTrashProducts] = useState([]);
  const [filteredTrashProducts, setFilteredTrashProducts] = useState([]);
  const [trashSearchQuery, setTrashSearchQuery] = useState('');

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
        .eq('status', 'active');

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
      console.log('[Admin] Fetching users with get_all_users_with_email RPC...');

      // Use RPC function to get users with email
      const { data, error } = await supabase
        .rpc('get_all_users_with_email');

      console.log('[Admin] RPC result:', { data, error });

      if (error) {
        console.error('[Admin] RPC Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('[Admin] Successfully fetched', data?.length || 0, 'users');
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error('[Admin] Error fetching users:', error);
      console.error('[Admin] Full error object:', JSON.stringify(error, null, 2));
      alert(`회원 목록을 불러오는데 실패했습니다.\n\n에러: ${error.message || '알 수 없는 오류'}`);
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
      // Fetch reports without joins first
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      if (!reportsData || reportsData.length === 0) {
        setReports([]);
        filterReports(reportFilter, []);
        return;
      }

      // Get unique IDs for related data
      const reporterIds = [...new Set(reportsData.map(r => r.reporter_id).filter(Boolean))];
      const productIds = [...new Set(reportsData.map(r => r.reported_product_id).filter(Boolean))];
      const userIds = [...new Set(reportsData.map(r => r.reported_user_id).filter(Boolean))];
      const resolverIds = [...new Set(reportsData.map(r => r.resolved_by).filter(Boolean))];

      // Fetch all profiles
      const allProfileIds = [...new Set([...reporterIds, ...userIds, ...resolverIds])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', allProfileIds);

      // Fetch products with seller info
      const { data: productsData } = await supabase
        .from('products')
        .select('id, title, user_id')
        .in('id', productIds);

      // Create maps
      const profilesMap = {};
      profilesData?.forEach(p => { profilesMap[p.id] = p; });

      const productsMap = {};
      productsData?.forEach(p => { productsMap[p.id] = p; });

      // Enrich reports with related data
      const enrichedReports = reportsData.map(report => ({
        ...report,
        reporter: profilesMap[report.reporter_id] || null,
        reported_product: report.reported_product_id ? {
          ...productsMap[report.reported_product_id],
          seller: profilesMap[productsMap[report.reported_product_id]?.user_id] || null
        } : null,
        reported_user: profilesMap[report.reported_user_id] || null,
        resolver: profilesMap[report.resolved_by] || null
      }));

      setReports(enrichedReports);
      filterReports(reportFilter, enrichedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      console.error('Error details:', error);
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

      // 2. 상품을 먼저 삭제 (CASCADE 설정이 있으면 이미지도 자동 삭제)
      const { data: deleteData, error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .select();

      console.log('[Admin] Delete product result:', { deleteData, deleteError });

      if (deleteError) {
        console.error('[Admin] Error deleting product:', deleteError);
        throw deleteError;
      }

      // 3. CASCADE가 없는 경우를 대비해 이미지 레코드 명시적 삭제 시도
      if (!deleteError) {
        const { error: imageError } = await supabase
          .from('product_images')
          .delete()
          .eq('product_id', productId);

        if (imageError) {
          // 이미 CASCADE로 삭제되었을 수 있으므로 에러 로그만 출력
          console.log('[Admin] Image records delete (might already be deleted by CASCADE):', imageError);
        }
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

  const handleSuspendUser = async (userId) => {
    const reason = prompt('활동 중지 사유를 입력하세요:');
    if (!reason) return;

    if (!confirm('이 회원의 활동을 중지하시겠습니까?\n\n중지된 회원은 로그인 및 모든 활동이 제한됩니다.')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_suspended: true,
          suspended_at: new Date().toISOString(),
          suspended_by: user?.id,
          suspension_reason: reason
        })
        .eq('id', userId);

      if (error) throw error;

      alert('회원 활동이 중지되었습니다.');
      await fetchUsers();
      await fetchDashboardStats();
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('활동 중지 실패: ' + error.message);
    }
  };

  const handleActivateUser = async (userId) => {
    if (!confirm('이 회원의 활동 중지를 해제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_suspended: false,
          suspended_at: null,
          suspended_by: null,
          suspension_reason: null
        })
        .eq('id', userId);

      if (error) throw error;

      alert('회원 활동이 재개되었습니다.');
      await fetchUsers();
      await fetchDashboardStats();
    } catch (error) {
      console.error('Error activating user:', error);
      alert('활동 재개 실패: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    const reason = prompt('회원 삭제 사유를 입력하세요 (증거 보관용):');
    if (!reason) return;

    if (!confirm('이 회원을 삭제하시겠습니까?\n\n📦 회원의 상품은 휴지통으로 이동됩니다.\n⚠️ 이 작업은 되돌릴 수 없습니다.')) return;

    const confirmText = prompt('정말로 삭제하시려면 "삭제확인"을 입력하세요:');
    if (confirmText !== '삭제확인') {
      alert('삭제가 취소되었습니다.');
      return;
    }

    try {
      console.log('[Admin] Deleting user:', userId);

      // 1. Move user's products to trash (for evidence preservation)
      const { data: movedResult, error: trashError } = await supabase
        .rpc('move_user_products_to_trash', {
          target_user_id: userId,
          admin_user_id: user?.id,
          reason: reason
        });

      if (trashError) {
        console.error('[Admin] Error moving products to trash:', trashError);
        throw trashError;
      }

      const movedCount = movedResult?.[0]?.moved_count || 0;
      console.log('[Admin] Moved products to trash:', movedCount);

      // 2. Delete user's profile (CASCADE will delete comments, favorites, etc.)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      alert(`회원이 삭제되었습니다.\n\n📦 ${movedCount}개의 상품이 휴지통으로 이동되었습니다.\n💡 휴지통 탭에서 증거를 확인하고 영구 삭제할 수 있습니다.\n\n참고: 인증 계정은 Supabase Dashboard에서 수동으로 삭제해야 합니다.`);
      await fetchUsers();
      await fetchDashboardStats();
    } catch (error) {
      console.error('[Admin] Error deleting user:', error);
      alert('삭제 실패: ' + error.message);
    }
  };

  const fetchAccessStats = useCallback(async () => {
    const processHourlyStats = (logs) => {
      const now = new Date();
      const hourlyData = [];

      // 24시간 고정: 00:00 ~ 23:00
      for (let hour = 0; hour < 24; hour++) {
        const hourStr = hour.toString().padStart(2, '0') + ':00';

        // 오늘 해당 시간대의 접속 수 계산
        const count = logs.filter(log => {
          const logDate = new Date(log.created_at);
          const isToday = logDate.getDate() === now.getDate() &&
                          logDate.getMonth() === now.getMonth() &&
                          logDate.getFullYear() === now.getFullYear();
          return isToday && logDate.getHours() === hour;
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
      user.username?.toLowerCase().includes(query)
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

  const fetchTrashProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('trash_products')
        .select('*')
        .order('deleted_at', { ascending: false });

      if (error) throw error;

      setTrashProducts(data || []);
      setFilteredTrashProducts(data || []);
    } catch (error) {
      console.error('Error fetching trash products:', error);
      setTrashProducts([]);
      setFilteredTrashProducts([]);
    }
  }, [supabase, setTrashProducts, setFilteredTrashProducts]);

  const handleTrashSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setTrashSearchQuery(query);

    if (!query) {
      setFilteredTrashProducts(trashProducts);
      return;
    }

    const filtered = trashProducts.filter(product =>
      product.title?.toLowerCase().includes(query) ||
      product.user_full_name?.toLowerCase().includes(query) ||
      product.user_email?.toLowerCase().includes(query)
    );

    setFilteredTrashProducts(filtered);
  };

  const handleRestoreProduct = async (trashId) => {
    if (!confirm('이 상품을 복구하시겠습니까?\n\n복구된 상품은 "숨김" 상태로 복구됩니다.')) return;

    try {
      const { data, error } = await supabase
        .rpc('restore_product_from_trash', {
          trash_id: trashId,
          admin_user_id: user?.id
        });

      if (error) throw error;

      alert('상품이 복구되었습니다.\n\n상품은 "숨김" 상태로 복구되었습니다.');
      await fetchTrashProducts();
      await fetchProducts();
      await fetchDashboardStats();
    } catch (error) {
      console.error('[Admin] Error restoring product:', error);
      alert('복구 실패: ' + error.message);
    }
  };

  const handlePermanentDeleteProduct = async (trashId, productTitle) => {
    if (!confirm(`"${productTitle}" 상품을 영구적으로 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없으며, 모든 증거가 사라집니다.`)) return;

    const confirmText = prompt('정말로 영구 삭제하시려면 "영구삭제"를 입력하세요:');
    if (confirmText !== '영구삭제') {
      alert('삭제가 취소되었습니다.');
      return;
    }

    try {
      const { error } = await supabase
        .from('trash_products')
        .delete()
        .eq('id', trashId);

      if (error) throw error;

      alert('상품이 영구적으로 삭제되었습니다.');
      await fetchTrashProducts();
    } catch (error) {
      console.error('[Admin] Error permanently deleting product:', error);
      alert('영구 삭제 실패: ' + error.message);
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
        } else if (activeTab === 'trash') {
          fetchTrashProducts();
        }
      } else if (user) {
        // 로그인했지만 관리자가 아님
        alert('접근 거부. 관리자 권한이 없습니다.\n\n현재 역할: ' + (profile?.role || 'undefined'));
        router.push('/');
      } else {
        // 로그인하지 않음 (useAuth에서 이미 /login으로 리디렉션)
      }
    }
  }, [loading, user, profile, activeTab, fetchAccessStats, fetchReports, fetchRegionalStats, fetchDashboardStats, fetchUsers, fetchProducts, fetchTrashProducts, router]);

  if (loading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-[#111827]">
        <LoadingState message="Memeriksa akses..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111827]">
      {/* Header */}
      <header className="bg-[#1f2937] border-b border-[#374151] py-4 sticky top-0 z-[1000]">
        <div className="container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl max-md:text-xl font-bold text-[#f9fafb]">🛡️ 관리자 대시보드</h1>
            </div>
            <div className="flex items-center gap-3">
              <button className="btn-icon btn-icon-md" onClick={() => router.push('/')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </button>
              <button className="logout-btn max-md:px-3.5 max-md:py-2.5" onClick={handleLogout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                <span className="max-md:hidden">로그아웃</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="grid max-md:grid-cols-1 md:grid-cols-[250px_1fr] md:min-h-[calc(100vh-73px)]">
        {/* Sidebar */}
        {!isMobile && (
          <aside className="bg-[#1f2937] border-r border-[#374151] py-6">
            <nav className="flex flex-col gap-1 px-4">
              <button
                className={`flex items-center gap-3 py-3.5 px-4 border-none rounded-lg text-[#9ca3af] text-[15px] font-medium cursor-pointer transition-all text-left ${
                  activeTab === 'dashboard' ? 'bg-[#6366f1] text-white' : 'bg-transparent hover:bg-[#374151] hover:text-[#f9fafb]'
                }`}
                onClick={() => setActiveTab('dashboard')}
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
                대시보드
              </button>
              <button
                className={`flex items-center gap-3 py-3.5 px-4 border-none rounded-lg text-[#9ca3af] text-[15px] font-medium cursor-pointer transition-all text-left ${
                  activeTab === 'users' ? 'bg-[#6366f1] text-white' : 'bg-transparent hover:bg-[#374151] hover:text-[#f9fafb]'
                }`}
                onClick={() => setActiveTab('users')}
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                회원 관리
              </button>
              <button
                className={`flex items-center gap-3 py-3.5 px-4 border-none rounded-lg text-[#9ca3af] text-[15px] font-medium cursor-pointer transition-all text-left ${
                  activeTab === 'products' ? 'bg-[#6366f1] text-white' : 'bg-transparent hover:bg-[#374151] hover:text-[#f9fafb]'
                }`}
                onClick={() => setActiveTab('products')}
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
                상품 관리
              </button>
              <button
                className={`flex items-center gap-3 py-3.5 px-4 border-none rounded-lg text-[#9ca3af] text-[15px] font-medium cursor-pointer transition-all text-left ${
                  activeTab === 'reports' ? 'bg-[#6366f1] text-white' : 'bg-transparent hover:bg-[#374151] hover:text-[#f9fafb]'
                }`}
                onClick={() => setActiveTab('reports')}
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                신고 관리
                {stats.totalReports > 0 && (
                  <span className="ml-auto py-0.5 px-2 bg-[#ef4444] text-white rounded-[10px] text-[11px] font-semibold">{stats.totalReports}</span>
                )}
              </button>
              <button
                className={`flex items-center gap-3 py-3.5 px-4 border-none rounded-lg text-[#9ca3af] text-[15px] font-medium cursor-pointer transition-all text-left ${
                  activeTab === 'access' ? 'bg-[#6366f1] text-white' : 'bg-transparent hover:bg-[#374151] hover:text-[#f9fafb]'
                }`}
                onClick={() => setActiveTab('access')}
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18"/>
                  <path d="m19 9-5 5-4-4-3 3"/>
                </svg>
                접속 통계
              </button>
              <button
                className={`flex items-center gap-3 py-3.5 px-4 border-none rounded-lg text-[#9ca3af] text-[15px] font-medium cursor-pointer transition-all text-left ${
                  activeTab === 'regional' ? 'bg-[#6366f1] text-white' : 'bg-transparent hover:bg-[#374151] hover:text-[#f9fafb]'
                }`}
                onClick={() => setActiveTab('regional')}
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                지역별 통계
              </button>
              <button
                className={`flex items-center gap-3 py-3.5 px-4 border-none rounded-lg text-[#9ca3af] text-[15px] font-medium cursor-pointer transition-all text-left ${
                  activeTab === 'trash' ? 'bg-[#6366f1] text-white' : 'bg-transparent hover:bg-[#374151] hover:text-[#f9fafb]'
                }`}
                onClick={() => setActiveTab('trash')}
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
                휴지통
              </button>
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className="py-8 px-6 max-md:py-5 max-md:px-4 overflow-x-hidden">
          {/* Mobile Tabs */}
          {isMobile && (
            <div className="flex gap-2 py-4 px-5 bg-[#1f2937] border-b border-[#374151] overflow-x-auto">
              <button
                className={`py-2.5 px-4 border-none rounded-lg text-sm font-medium cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'dashboard' ? 'bg-[#6366f1] text-white' : 'bg-transparent text-[#9ca3af]'
                }`}
                onClick={() => setActiveTab('dashboard')}
              >
                대시보드
              </button>
              <button
                className={`py-2.5 px-4 border-none rounded-lg text-sm font-medium cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'users' ? 'bg-[#6366f1] text-white' : 'bg-transparent text-[#9ca3af]'
                }`}
                onClick={() => setActiveTab('users')}
              >
                회원
              </button>
              <button
                className={`py-2.5 px-4 border-none rounded-lg text-sm font-medium cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'products' ? 'bg-[#6366f1] text-white' : 'bg-transparent text-[#9ca3af]'
                }`}
                onClick={() => setActiveTab('products')}
              >
                상품
              </button>
              <button
                className={`py-2.5 px-4 border-none rounded-lg text-sm font-medium cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'reports' ? 'bg-[#6366f1] text-white' : 'bg-transparent text-[#9ca3af]'
                }`}
                onClick={() => setActiveTab('reports')}
              >
                신고
              </button>
              <button
                className={`py-2.5 px-4 border-none rounded-lg text-sm font-medium cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'access' ? 'bg-[#6366f1] text-white' : 'bg-transparent text-[#9ca3af]'
                }`}
                onClick={() => setActiveTab('access')}
              >
                접속
              </button>
              <button
                className={`py-2.5 px-4 border-none rounded-lg text-sm font-medium cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'regional' ? 'bg-[#6366f1] text-white' : 'bg-transparent text-[#9ca3af]'
                }`}
                onClick={() => setActiveTab('regional')}
              >
                지역
              </button>
              <button
                className={`py-2.5 px-4 border-none rounded-lg text-sm font-medium cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'trash' ? 'bg-[#6366f1] text-white' : 'bg-transparent text-[#9ca3af]'
                }`}
                onClick={() => setActiveTab('trash')}
              >
                휴지통
              </button>
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div>
              <h2 className="section-title section-title-lg">대시보드 통계</h2>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6 mb-10 max-md:grid-cols-1 max-md:gap-4">
                <div className="flex items-center gap-5 p-6 bg-[#1f2937] border border-[#374151] rounded-2xl transition-all hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:border-[#6366f1] max-md:p-5 max-md:gap-4">
                  <div className="w-[60px] h-[60px] flex items-center justify-center rounded-xl shrink-0 bg-gradient-to-br from-[#667eea] to-[#764ba2] max-md:w-[50px] max-md:h-[50px]">
                    <svg className="w-7 h-7 text-white max-md:w-6 max-md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="stat-number stat-number-lg max-md:text-[28px]">{stats.totalUsers}</div>
                    <div className="stat-label stat-label-md max-md:text-[13px]">총 회원 수</div>
                  </div>
                </div>

                <div className="flex items-center gap-5 p-6 bg-[#1f2937] border border-[#374151] rounded-2xl transition-all hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:border-[#6366f1] max-md:p-5 max-md:gap-4">
                  <div className="w-[60px] h-[60px] flex items-center justify-center rounded-xl shrink-0 bg-gradient-to-br from-[#f093fb] to-[#f5576c] max-md:w-[50px] max-md:h-[50px]">
                    <svg className="w-7 h-7 text-white max-md:w-6 max-md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="stat-number stat-number-lg max-md:text-[28px]">{stats.totalProducts}</div>
                    <div className="stat-label stat-label-md max-md:text-[13px]">총 상품 수</div>
                  </div>
                </div>

                <div className="flex items-center gap-5 p-6 bg-[#1f2937] border border-[#374151] rounded-2xl transition-all hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:border-[#6366f1] max-md:p-5 max-md:gap-4">
                  <div className="w-[60px] h-[60px] flex items-center justify-center rounded-xl shrink-0 bg-gradient-to-br from-[#4facfe] to-[#00f2fe] max-md:w-[50px] max-md:h-[50px]">
                    <svg className="w-7 h-7 text-white max-md:w-6 max-md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="stat-number stat-number-lg max-md:text-[28px]">{stats.activeProducts}</div>
                    <div className="stat-label stat-label-md max-md:text-[13px]">활성 상품</div>
                  </div>
                </div>

                <div className="flex items-center gap-5 p-6 bg-[#1f2937] border border-[#374151] rounded-2xl transition-all hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:border-[#6366f1] max-md:p-5 max-md:gap-4">
                  <div className="w-[60px] h-[60px] flex items-center justify-center rounded-xl shrink-0 bg-gradient-to-br from-[#fa709a] to-[#fee140] max-md:w-[50px] max-md:h-[50px]">
                    <svg className="w-7 h-7 text-white max-md:w-6 max-md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="stat-number stat-number-lg max-md:text-[28px]">{stats.totalReports}</div>
                    <div className="stat-label stat-label-md max-md:text-[13px]">총 신고 수</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="min-h-[600px]">
              <div className="section-header">
                <h2 className="section-title section-title-lg">회원 관리</h2>
                <div className="flex items-center gap-3 py-2.5 px-4 bg-[#1f2937] border border-[#374151] rounded-lg min-w-[300px] transition-all focus-within:border-[#6366f1] focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] max-md:min-w-full">
                  <svg className="w-[18px] h-[18px] text-[#6b7280] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="회원 검색..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="flex-1 bg-transparent border-none outline-none text-[#f9fafb] text-sm placeholder:text-[#6b7280]"
                  />
                </div>
              </div>

              <div className="bg-[#1f2937] border border-[#374151] rounded-xl overflow-hidden max-md:overflow-x-auto">
                <table className="w-full border-collapse max-md:min-w-[600px]">
                  <thead className="bg-[#374151]">
                    <tr>
                      <th className="py-4 px-5 text-left text-[13px] font-semibold text-[#9ca3af] uppercase tracking-wide max-md:py-3 max-md:px-4 max-md:text-[13px]">이름</th>
                      <th className="py-4 px-5 text-left text-[13px] font-semibold text-[#9ca3af] uppercase tracking-wide max-md:py-3 max-md:px-4 max-md:text-[13px]">사용자명</th>
                      <th className="py-4 px-5 text-left text-[13px] font-semibold text-[#9ca3af] uppercase tracking-wide max-md:py-3 max-md:px-4 max-md:text-[13px]">이메일</th>
                      <th className="py-4 px-5 text-left text-[13px] font-semibold text-[#9ca3af] uppercase tracking-wide max-md:py-3 max-md:px-4 max-md:text-[13px]">가입일</th>
                      <th className="py-4 px-5 text-left text-[13px] font-semibold text-[#9ca3af] uppercase tracking-wide max-md:py-3 max-md:px-4 max-md:text-[13px]">상태</th>
                      <th className="py-4 px-5 text-left text-[13px] font-semibold text-[#9ca3af] uppercase tracking-wide max-md:py-3 max-md:px-4 max-md:text-[13px]">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="transition-colors hover:bg-[#374151]">
                        <td className="py-4 px-5 text-sm text-[#f9fafb] border-t border-[#374151] max-md:py-3 max-md:px-4 max-md:text-[13px]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#374151] border-2 border-[#374151] flex items-center justify-center overflow-hidden shrink-0">
                              {user.avatar_url ? (
                                <Image
                                  src={user.avatar_url}
                                  alt={user.full_name || '사용자'}
                                  width={40}
                                  height={40}
                                  unoptimized
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'block';
                                  }}
                                />
                              ) : null}
                              <svg
                                className="w-5 h-5 text-[#6b7280]"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                style={{ display: user.avatar_url ? 'none' : 'block' }}
                              >
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                              </svg>
                            </div>
                            <span>{user.full_name || '사용자'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-sm text-[#f9fafb] border-t border-[#374151] max-md:py-3 max-md:px-4 max-md:text-[13px]">{user.username || '-'}</td>
                        <td className="py-4 px-5 text-sm text-[#f9fafb] border-t border-[#374151] max-md:py-3 max-md:px-4 max-md:text-[13px]">{user.email}</td>
                        <td className="py-4 px-5 text-sm text-[#f9fafb] border-t border-[#374151] max-md:py-3 max-md:px-4 max-md:text-[13px]">{new Date(user.created_at).toLocaleDateString('ko-KR')}</td>
                        <td className="py-4 px-5 text-sm text-[#f9fafb] border-t border-[#374151] max-md:py-3 max-md:px-4 max-md:text-[13px]">
                          {user.is_suspended ? (
                            <span className="inline-block py-1 px-3 rounded-xl text-xs font-semibold bg-[rgba(251,191,36,0.1)] text-[#f59e0b]" title={`중지 사유: ${user.suspension_reason || '-'}`}>
                              활동중지
                            </span>
                          ) : (
                            <span className="inline-block py-1 px-3 rounded-xl text-xs font-semibold bg-[rgba(16,185,129,0.1)] text-[#10b981]">활성</span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-sm text-[#f9fafb] border-t border-[#374151] max-md:py-3 max-md:px-4 max-md:text-[13px]">
                          <div className="flex items-center gap-2 flex-wrap">
                            {user.role !== 'admin' && (
                              <>
                                {user.is_suspended ? (
                                  <button
                                    className="py-1.5 px-3.5 border-none rounded-md text-[13px] font-medium cursor-pointer transition-all whitespace-nowrap bg-[#10b981] text-white hover:bg-[#059669] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(16,185,129,0.4)]"
                                    onClick={() => handleActivateUser(user.id)}
                                    title="활동 재개"
                                  >
                                    재개
                                  </button>
                                ) : (
                                  <button
                                    className="py-1.5 px-3.5 border-none rounded-md text-[13px] font-medium cursor-pointer transition-all whitespace-nowrap bg-[#f59e0b] text-white hover:bg-[#d97706] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(245,158,11,0.4)]"
                                    onClick={() => handleSuspendUser(user.id)}
                                    title="활동 중지"
                                  >
                                    중지
                                  </button>
                                )}
                                <button
                                  className="py-1.5 px-3.5 border-none rounded-md text-[13px] font-medium cursor-pointer transition-all whitespace-nowrap bg-[#ef4444] text-white hover:bg-[#dc2626] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(239,68,68,0.4)]"
                                  onClick={() => handleDeleteUser(user.id)}
                                  title="회원 삭제"
                                >
                                  삭제
                                </button>
                              </>
                            )}
                            {user.role === 'admin' && (
                              <span className="py-1.5 px-3.5 rounded-md text-[13px] font-medium bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white whitespace-nowrap">관리자</span>
                            )}
                          </div>
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
            <div>
              <div className="section-header">
                <h2 className="section-title section-title-lg">상품 관리</h2>
                <div className="flex items-center gap-3 py-2.5 px-4 bg-[#1f2937] border border-[#374151] rounded-lg min-w-[300px] transition-all focus-within:border-[#6366f1] focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] max-md:min-w-full">
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
                              <small>판매자: {report.reported_product?.seller?.full_name || '-'}</small>
                            </div>
                          ) : (
                            <div className="report-target">
                              <div>{report.reported_user?.full_name || '사용자'}</div>
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

          {/* Trash Tab */}
          {activeTab === 'trash' && (
            <div className="trash-section">
              <div className="section-header">
                <h2 className="section-title">휴지통 (삭제된 상품)</h2>
                <div className="search-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="상품 검색..."
                    value={trashSearchQuery}
                    onChange={handleTrashSearch}
                  />
                </div>
              </div>

              <div className="info-banner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <div>
                  <strong>증거 보관소:</strong> 삭제된 회원의 상품들이 증거로 보관됩니다. 복구하거나 영구 삭제할 수 있습니다.
                </div>
              </div>

              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>상품명</th>
                      <th>원소유자</th>
                      <th>가격</th>
                      <th>상태</th>
                      <th>삭제일</th>
                      <th>삭제 사유</th>
                      <th>액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrashProducts.map(product => {
                      const images = product.images || [];
                      const firstImage = images[0]?.image_url;
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
                          <td>
                            <div className="user-info">
                              <div>{product.user_full_name || '-'}</div>
                              <small>{product.user_email || '-'}</small>
                            </div>
                          </td>
                          <td>Rp {product.price?.toLocaleString('id-ID')}</td>
                          <td>
                            <span className={`status-badge ${product.status === 'active' ? 'active' : product.status === 'suspended' ? 'suspended' : ''}`}>
                              {product.status === 'active' ? '활성' : product.status === 'suspended' ? '중지' : product.status === 'sold' ? '판매완료' : '숨김'}
                            </span>
                          </td>
                          <td>{new Date(product.deleted_at).toLocaleDateString('ko-KR')}</td>
                          <td>
                            <span className="reason-text" title={product.deletion_reason}>
                              {product.deletion_reason ?
                                (product.deletion_reason.length > 20 ?
                                  product.deletion_reason.substring(0, 20) + '...' :
                                  product.deletion_reason)
                                : '-'}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="btn-activate"
                                onClick={() => handleRestoreProduct(product.id)}
                                title="상품 복구"
                              >
                                복구
                              </button>
                              <button
                                className="btn-delete"
                                onClick={() => handlePermanentDeleteProduct(product.id, product.title)}
                                title="영구 삭제"
                              >
                                영구삭제
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredTrashProducts.length === 0 && (
                  <div className="empty-state">
                    <p>휴지통이 비어 있습니다</p>
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
