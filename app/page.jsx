import { createClient } from './utils/supabase-server';
import HomePage from './components/HomePage';

// 서버 컴포넌트 - 초기 데이터를 서버에서 로드하여 TTFB 개선
export default async function Page() {
  const supabase = await createClient();

  // 병렬로 모든 데이터 로드 (200ms 이하 목표)
  const [productsData, provincesData, categoriesData] = await Promise.all([
    // 상품 데이터 (인덱스 활용)
    supabase
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
      .limit(50),

    // 주 목록
    supabase
      .from('provinces')
      .select('province_name')
      .order('province_name'),

    // 카테고리 목록
    supabase
      .from('categories')
      .select('parent_category')
      .not('parent_category', 'is', null)
  ]);

  // 데이터 변환
  const initialProducts = productsData.data?.map(product => ({
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

  const initialProvinces = provincesData.data?.map(p => p.province_name) || [];
  const initialCategories = [...new Set(categoriesData.data?.map(cat => cat.parent_category))].sort() || [];

  return (
    <HomePage
      initialProducts={initialProducts}
      initialProvinces={initialProvinces}
      initialCategories={initialCategories}
    />
  );
}
