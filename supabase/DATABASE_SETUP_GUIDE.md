# TokoMonggo Database Setup Guide

## 📋 목차
1. [개요](#개요)
2. [데이터베이스 구조](#데이터베이스-구조)
3. [설치 방법](#설치-방법)
4. [테이블 설명](#테이블-설명)
5. [주요 기능](#주요-기능)
6. [API 사용법](#api-사용법)
7. [성능 최적화](#성능-최적화)
8. [보안 설정](#보안-설정)

---

## 개요

TokoMonggo는 인도네시아 중고거래 마켓플레이스를 위한 완벽한 데이터베이스 스키마입니다.

### 주요 특징
- ✅ **완벽한 RLS (Row Level Security)** - 모든 테이블에 보안 정책 적용
- ✅ **Full-Text Search** - 인도네시아어 검색 지원
- ✅ **Geolocation** - 위경도 기반 근처 상품 검색
- ✅ **댓글/리뷰 시스템** - 별점 및 대댓글 지원
- ✅ **자동 트리거** - 타임스탬프, 검색 벡터, 위치 자동 업데이트
- ✅ **찜하기/최근 본 상품** - 사용자 활동 추적
- ✅ **다중 연락 수단** - 전화번호 또는 WhatsApp 필수

---

## 데이터베이스 구조

### ERD (Entity Relationship Diagram)

```
auth.users (Supabase Auth)
    ↓
profiles (사용자 프로필)
    - phone_number, whatsapp_number
    - regency_id → regencies

provinces (34개 주)
    ↓
regencies (514개 시/군)
    - latitude, longitude

categories (카테고리)
    - 2-level structure

products (상품)
    - user_id → auth.users
    - regency_id → regencies
    - category_id → categories
    - latitude, longitude (자동 복사)
    - search_vector (자동 생성)
    ↓
product_images (상품 이미지, 최대 5장)
    - product_id → products
    - order (순서)

product_comments (댓글/리뷰)
    - product_id → products
    - user_id → auth.users
    - parent_id → product_comments (대댓글)
    - rating (1-5 별점)
    - is_seller_reply

favorites (찜하기)
    - user_id → auth.users
    - product_id → products

view_history (최근 본 상품)
    - user_id → auth.users
    - product_id → products
```

---

## 설치 방법

### 1단계: 메인 스키마 적용

Supabase Dashboard → SQL Editor에서 실행:

```bash
# 파일 순서대로 실행
1. 00_complete_tokomonggo_schema.sql  # 메인 스키마
2. 03_indonesia_regency_coordinates_full.sql  # 514개 시/군 데이터
```

### 2단계: Storage Buckets 생성

Supabase Dashboard → Storage에서 생성:

#### product-images (공개)
```javascript
// Bucket 설정
{
  name: "product-images",
  public: true,
  fileSizeLimit: 5242880, // 5MB
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"]
}

// Storage Policy
CREATE POLICY "Anyone can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete own product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

#### profile-avatars (공개)
```javascript
// Bucket 설정
{
  name: "profile-avatars",
  public: true,
  fileSizeLimit: 2097152, // 2MB
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"]
}

// Storage Policy
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 3단계: 검증

```sql
-- 테이블 생성 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- RLS 활성화 확인
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- 함수 생성 확인
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 인덱스 생성 확인
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

## 테이블 설명

### 1. profiles (사용자 프로필)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,  -- auth.users.id와 동일
  username VARCHAR(50) UNIQUE,
  full_name VARCHAR(100),
  phone_number VARCHAR(20),
  whatsapp_number VARCHAR(20),
  avatar_url TEXT,
  bio TEXT,
  regency_id INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  CONSTRAINT phone_or_whatsapp_required CHECK (
    phone_number IS NOT NULL OR whatsapp_number IS NOT NULL
  )
);
```

**중요**: 전화번호 또는 WhatsApp 중 하나는 필수!

### 2. products (상품)
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  condition VARCHAR(50) NOT NULL,  -- 'Baru', 'Seperti Baru', etc.
  is_negotiable BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active',  -- 'active', 'sold', 'inactive', 'deleted'

  -- Location (자동 업데이트)
  province_id INTEGER,
  regency_id INTEGER,
  latitude DECIMAL(10, 8),  -- regency에서 자동 복사
  longitude DECIMAL(11, 8),  -- regency에서 자동 복사

  -- Category
  category_id INTEGER,

  -- Search (자동 생성)
  search_vector tsvector,  -- title + description

  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**자동 기능**:
- `search_vector`: title + description 자동 생성
- `latitude/longitude`: regency_id에서 자동 복사
- `updated_at`: 수정 시 자동 업데이트

### 3. product_comments (댓글/리뷰)
```sql
CREATE TABLE product_comments (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL,
  user_id UUID NOT NULL,
  parent_id UUID,  -- 대댓글용
  comment TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_seller_reply BOOLEAN DEFAULT false
);
```

**구조**:
- 최상위 댓글: `parent_id = NULL`, `rating` 가능
- 대댓글: `parent_id = 부모댓글ID`, `rating = NULL`
- 판매자 답글: `is_seller_reply = true` (RLS로 판매자만 설정 가능)

### 4. favorites (찜하기)
```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  created_at TIMESTAMPTZ,
  UNIQUE(user_id, product_id)
);
```

### 5. view_history (최근 본 상품)
```sql
CREATE TABLE view_history (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  viewed_at TIMESTAMPTZ,
  UNIQUE(user_id, product_id)
);
```

**자동 정리**: 사용자당 최근 100개만 유지

---

## 주요 기능

### 1. Full-Text Search (전체 검색)

```javascript
// 검색 쿼리
const { data, error } = await supabase.rpc('search_products', {
  search_query: 'iphone 12',
  limit_count: 50
});

// 결과: rank (검색 관련도) 순으로 정렬됨
// search_query는 인도네시아어 형태소 분석 지원
```

### 2. Geolocation Search (근처 상품)

```javascript
// 사용자 위치 기준 반경 50km 이내 상품
const { data, error } = await supabase.rpc('nearby_products', {
  user_lat: -6.2088,  // Jakarta
  user_lng: 106.8456,
  max_distance_km: 50,
  limit_count: 20
});

// 결과: distance_km 포함, 가까운 순 정렬
```

### 3. Regency-Based Search (지역 검색)

```javascript
// 위치 정보 없을 때 같은 시/군, 같은 주 순으로 검색
const { data, error } = await supabase.rpc('products_by_regency', {
  user_regency_id: 3171,  // Jakarta Pusat
  limit_count: 20
});
```

### 4. Comment Statistics (댓글 통계)

```javascript
// 상품의 댓글 수, 평균 별점, 별점 분포
const { data, error } = await supabase.rpc('get_product_comment_stats', {
  product_uuid: 'product-uuid-here'
});

// 결과:
// {
//   comment_count: 15,
//   average_rating: 4.2,
//   rating_distribution: {
//     "5": 8,
//     "4": 5,
//     "3": 2
//   }
// }
```

### 5. Comments with Replies (댓글 + 대댓글)

```javascript
// 상품의 모든 댓글 (사용자 정보 포함)
const { data, error } = await supabase.rpc('get_product_comments_with_replies', {
  product_uuid: 'product-uuid-here'
});

// 특정 댓글의 대댓글만
const { data, error } = await supabase.rpc('get_comment_replies', {
  comment_uuid: 'comment-uuid-here'
});
```

### 6. User Statistics (사용자 통계)

```javascript
// 사용자의 상품 통계
const { data, error } = await supabase.rpc('get_user_product_stats', {
  user_uuid: 'user-uuid-here'
});

// 결과:
// {
//   total_products: 10,
//   active_products: 7,
//   sold_products: 3,
//   total_favorites: 25,
//   average_rating: 4.5
// }
```

### 7. View History Upsert (조회 기록)

```javascript
// 상품 조회 시 자동으로 기록 (중복 시 업데이트)
const { error } = await supabase.rpc('upsert_view_history', {
  p_user_id: 'user-uuid',
  p_product_id: 'product-uuid'
});
```

---

## API 사용법

### 상품 등록

```javascript
// 1. 상품 정보 등록
const { data: product, error } = await supabase
  .from('products')
  .insert({
    user_id: user.id,
    title: 'iPhone 12 Pro 128GB',
    description: '깨끗한 상태입니다...',
    price: 8000000,
    condition: 'Seperti Baru',
    is_negotiable: true,
    province_id: 31,
    regency_id: 3171,  // latitude/longitude 자동 설정됨!
    category_id: 1,
    status: 'active'
  })
  .select()
  .single();

// 2. 이미지 업로드
for (let i = 0; i < imageFiles.length; i++) {
  const file = imageFiles[i];
  const fileName = `${product.id}_${i}_${Date.now()}.jpg`;
  const filePath = `products/${fileName}`;

  // Storage에 업로드
  await supabase.storage
    .from('product-images')
    .upload(filePath, file);

  // Public URL 가져오기
  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath);

  // product_images 테이블에 기록
  await supabase
    .from('product_images')
    .insert({
      product_id: product.id,
      image_url: publicUrl,
      order: i
    });
}
```

### 상품 조회 (상세 페이지)

```javascript
// 상품 정보 + 이미지 + 판매자 정보 한 번에 가져오기
const { data: product, error } = await supabase
  .from('products')
  .select(`
    *,
    product_images (
      id,
      image_url,
      order
    ),
    users:user_id (
      full_name,
      phone_number,
      whatsapp_number,
      avatar_url
    ),
    regencies (
      regency_name,
      provinces (
        province_name
      )
    ),
    categories (
      name,
      parent_category
    )
  `)
  .eq('id', productId)
  .single();

// 조회 기록 저장 (로그인 사용자)
if (user) {
  await supabase.rpc('upsert_view_history', {
    p_user_id: user.id,
    p_product_id: productId
  });
}
```

### 댓글 작성

```javascript
// 일반 댓글 (별점 포함)
const { error } = await supabase
  .from('product_comments')
  .insert({
    product_id: productId,
    user_id: user.id,
    comment: '좋은 상품이네요!',
    rating: 5,
    parent_id: null
  });

// 대댓글 (판매자 답글)
const { error } = await supabase
  .from('product_comments')
  .insert({
    product_id: productId,
    user_id: user.id,  // 판매자 ID
    comment: '감사합니다!',
    rating: null,  // 대댓글은 별점 없음
    parent_id: parentCommentId,
    is_seller_reply: true  // RLS가 판매자인지 자동 검증
  });
```

### 찜하기

```javascript
// 찜하기 추가
const { error } = await supabase
  .from('favorites')
  .insert({
    user_id: user.id,
    product_id: productId
  });

// 찜하기 취소
const { error } = await supabase
  .from('favorites')
  .delete()
  .eq('user_id', user.id)
  .eq('product_id', productId);

// 찜한 상품 목록
const { data, error } = await supabase
  .from('favorites')
  .select(`
    created_at,
    products (
      *,
      product_images (image_url)
    )
  `)
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });
```

### 검색

```javascript
// 1. Full-text Search
const { data, error } = await supabase.rpc('search_products', {
  search_query: 'iphone 12 pro',
  limit_count: 50
});

// 2. 필터 + 검색 조합
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('status', 'active')
  .eq('category_id', categoryId)
  .gte('price', minPrice)
  .lte('price', maxPrice)
  .order('created_at', { ascending: false })
  .limit(20);

// 3. 근처 상품 검색 (geolocation)
const { data, error } = await supabase.rpc('nearby_products', {
  user_lat: userLatitude,
  user_lng: userLongitude,
  max_distance_km: 50,
  limit_count: 20
});
```

---

## 성능 최적화

### 인덱스 전략

모든 중요한 쿼리에 인덱스가 적용되어 있습니다:

```sql
-- Products 테이블 인덱스
idx_products_user         -- user_id
idx_products_regency      -- regency_id
idx_products_category     -- category_id
idx_products_status       -- status
idx_products_created      -- created_at DESC
idx_products_price        -- price
idx_products_location     -- (latitude, longitude)
products_search_idx       -- search_vector (GIN)

-- Comments 테이블 인덱스
idx_comments_product      -- (product_id, created_at DESC)
idx_comments_user         -- user_id
idx_comments_parent       -- parent_id

-- Favorites 테이블 인덱스
idx_favorites_user        -- (user_id, created_at DESC)
idx_favorites_product     -- product_id
```

### 쿼리 최적화 팁

```javascript
// ❌ 나쁜 예: N+1 쿼리
const products = await supabase.from('products').select('*');
for (const product of products) {
  const images = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', product.id);
}

// ✅ 좋은 예: JOIN으로 한 번에
const { data: products } = await supabase
  .from('products')
  .select(`
    *,
    product_images (*)
  `);

// ✅ 더 좋은 예: 필요한 컬럼만 선택
const { data: products } = await supabase
  .from('products')
  .select(`
    id,
    title,
    price,
    product_images (image_url)
  `);
```

### 페이지네이션

```javascript
// Offset-based pagination (작은 데이터)
const { data, error } = await supabase
  .from('products')
  .select('*')
  .range(0, 19)  // 0-19 = 첫 20개
  .order('created_at', { ascending: false });

// Cursor-based pagination (큰 데이터, 더 빠름)
const { data, error } = await supabase
  .from('products')
  .select('*')
  .lt('created_at', lastProductTimestamp)  // cursor
  .order('created_at', { ascending: false })
  .limit(20);
```

---

## 보안 설정

### RLS (Row Level Security) 정책

모든 테이블에 RLS가 활성화되어 있으며, 다음 원칙을 따릅니다:

1. **읽기 (SELECT)**: 대부분 공개
2. **쓰기 (INSERT)**: 본인 데이터만
3. **수정 (UPDATE)**: 본인 데이터만
4. **삭제 (DELETE)**: 본인 데이터만

#### 주요 정책 예시

```sql
-- Products: 모두가 active/sold 상품 조회 가능
CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (status IN ('active', 'sold'));

-- Products: 본인만 수정 가능
CREATE POLICY "Users can update own products"
  ON products FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Comments: 판매자만 is_seller_reply = true 설정 가능
CREATE POLICY "Product owner can mark as seller reply"
  ON product_comments FOR INSERT
  WITH CHECK (
    CASE
      WHEN is_seller_reply = true THEN
        EXISTS (
          SELECT 1 FROM products p
          WHERE p.id = product_id
          AND p.user_id = auth.uid()
        )
      ELSE true
    END
  );
```

### 민감 정보 보호

```javascript
// ❌ 나쁜 예: 모든 사용자 정보 노출
const { data } = await supabase
  .from('profiles')
  .select('*');

// ✅ 좋은 예: 필요한 정보만 선택
const { data } = await supabase
  .from('profiles')
  .select('id, username, full_name, avatar_url');
```

### Storage 보안

```sql
-- 이미지 업로드 시 경로에 user_id 포함
-- 예: products/{user_id}_{product_id}_{index}.jpg

-- Storage Policy로 본인만 삭제 가능
CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## 유지보수

### 정기 작업

```sql
-- 1. 오래된 조회 기록 정리 (사용자당 최근 100개만 유지)
SELECT cleanup_old_view_history();

-- 2. 오래된 비활성 상품 아카이빙 (90일 후 삭제 상태로 변경)
SELECT archive_old_inactive_products();

-- 3. VACUUM ANALYZE (성능 유지)
VACUUM ANALYZE products;
VACUUM ANALYZE product_comments;
```

### 모니터링 쿼리

```sql
-- 가장 많이 조회된 상품
SELECT
  p.title,
  COUNT(*) as view_count
FROM view_history vh
JOIN products p ON vh.product_id = p.id
WHERE vh.viewed_at > now() - INTERVAL '7 days'
GROUP BY p.id, p.title
ORDER BY view_count DESC
LIMIT 10;

-- 가장 활발한 판매자
SELECT
  u.full_name,
  COUNT(DISTINCT p.id) as product_count,
  COUNT(DISTINCT f.id) as favorite_count
FROM profiles u
LEFT JOIN products p ON u.id = p.user_id
LEFT JOIN favorites f ON p.id = f.product_id
WHERE p.status = 'active'
GROUP BY u.id, u.full_name
ORDER BY favorite_count DESC
LIMIT 10;

-- 인기 카테고리
SELECT
  c.name,
  COUNT(p.id) as product_count
FROM categories c
LEFT JOIN products p ON c.category_id = p.category_id
WHERE p.status = 'active'
  AND p.created_at > now() - INTERVAL '30 days'
GROUP BY c.category_id, c.name
ORDER BY product_count DESC;
```

---

## 문제 해결

### 일반적인 문제

#### 1. 검색이 작동하지 않음
```sql
-- search_vector가 생성되었는지 확인
SELECT id, title, search_vector
FROM products
WHERE search_vector IS NULL;

-- 없으면 수동으로 업데이트
UPDATE products
SET search_vector = to_tsvector('indonesian', title || ' ' || description)
WHERE search_vector IS NULL;
```

#### 2. 위치 정보가 없음
```sql
-- regency 좌표 확인
SELECT regency_name, latitude, longitude
FROM regencies
WHERE latitude IS NULL OR longitude IS NULL;

-- product 위치 수동 업데이트
UPDATE products p
SET
  latitude = r.latitude,
  longitude = r.longitude
FROM regencies r
WHERE p.regency_id = r.regency_id
  AND (p.latitude IS NULL OR p.longitude IS NULL);
```

#### 3. RLS 정책 문제
```sql
-- RLS 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';

-- 특정 테이블 RLS 비활성화 (디버깅용)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
-- 테스트 후 다시 활성화
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```

---

## 추가 리소스

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [PostGIS for Advanced Geolocation](https://postgis.net/)

---

## 라이선스

MIT License

---

**Last Updated**: 2025-01-11
**Version**: 1.0
**Maintainer**: TokoMonggo Team
