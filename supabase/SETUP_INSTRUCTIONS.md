# 🗄️ Supabase 데이터베이스 설정 가이드

## 1️⃣ Supabase 프로젝트에서 SQL Editor 열기

1. https://supabase.com/dashboard 접속
2. 프로젝트 선택: `qkfgrmuixdysatbpuzmn`
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. **New Query** 클릭

---

## 2️⃣ PostGIS Extension 활성화

```sql
-- PostGIS 확장 활성화 (지리 정보 처리용)
CREATE EXTENSION IF NOT EXISTS postgis;
```

**실행:** `Run` 버튼 클릭

---

## 3️⃣ 테이블 생성

아래 SQL을 복사하여 SQL Editor에 붙여넣고 실행하세요:

### A. 지역 테이블

```sql
-- Provinces (주/도)
CREATE TABLE IF NOT EXISTS public.provinces (
    province_id INTEGER PRIMARY KEY,
    province_name VARCHAR(100) NOT NULL,
    province_code CHAR(2)
);

-- Regencies (도시/군)
CREATE TABLE IF NOT EXISTS public.regencies (
    regency_id INTEGER PRIMARY KEY,
    province_id INTEGER NOT NULL REFERENCES public.provinces(province_id),
    regency_name VARCHAR(100) NOT NULL,
    regency_type VARCHAR(20),
    regency_code VARCHAR(10)
);

-- Districts (구/면)
CREATE TABLE IF NOT EXISTS public.districts (
    district_id INTEGER PRIMARY KEY,
    regency_id INTEGER NOT NULL REFERENCES public.regencies(regency_id),
    district_name VARCHAR(100) NOT NULL,
    district_code VARCHAR(15)
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_regencies_province ON public.regencies(province_id);
CREATE INDEX IF NOT EXISTS idx_districts_regency ON public.districts(regency_id);
```

### B. 카테고리 테이블

```sql
-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    parent_id BIGINT REFERENCES public.categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
```

### C. 상품 관련 테이블

```sql
-- Products
CREATE TABLE IF NOT EXISTS public.products (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL,
    is_negotiable BOOLEAN DEFAULT FALSE,
    condition VARCHAR(50),
    category_id BIGINT REFERENCES public.categories(id),
    regency_id BIGINT REFERENCES public.regencies(regency_id),
    location GEOGRAPHY(Point, 4326), -- GPS 좌표
    phone_number VARCHAR(20),
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Images
CREATE TABLE IF NOT EXISTS public.product_images (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    "order" INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Reviews
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    comment TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Product Likes (찜하기)
CREATE TABLE IF NOT EXISTS public.user_product_likes (
    user_id UUID REFERENCES auth.users(id),
    product_id BIGINT REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, product_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_regency ON public.products(regency_id);
CREATE INDEX IF NOT EXISTS idx_products_location ON public.products USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_products_created ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);
```

---

## 4️⃣ PostGIS 함수 생성 (핵심!)

```sql
-- 내 주변 상품 검색 함수
CREATE OR REPLACE FUNCTION nearby_products(
  user_lat FLOAT,
  user_lng FLOAT,
  radius_meters INTEGER DEFAULT 5000,
  max_results INTEGER DEFAULT 20
)
RETURNS TABLE (
  id BIGINT,
  title VARCHAR,
  description TEXT,
  price NUMERIC,
  is_negotiable BOOLEAN,
  condition VARCHAR,
  category_id BIGINT,
  regency_name VARCHAR,
  distance_meters FLOAT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.description,
    p.price,
    p.is_negotiable,
    p.condition,
    p.category_id,
    r.regency_name,
    ST_Distance(
      p.location::geography,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) as distance_meters,
    p.created_at
  FROM products p
  LEFT JOIN regencies r ON p.regency_id = r.regency_id
  WHERE p.location IS NOT NULL
    AND ST_DWithin(
      p.location::geography,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_meters
    )
  ORDER BY distance_meters ASC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;
```

---

## 5️⃣ RLS (Row Level Security) 설정

```sql
-- RLS 활성화
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_product_likes ENABLE ROW LEVEL SECURITY;

-- 정책: 모든 사용자가 상품 조회 가능
CREATE POLICY "Products are viewable by everyone"
ON public.products FOR SELECT
USING (true);

-- 정책: 본인만 상품 수정/삭제 가능
CREATE POLICY "Users can update own products"
ON public.products FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
ON public.products FOR DELETE
USING (auth.uid() = user_id);

-- 정책: 인증된 사용자만 상품 등록 가능
CREATE POLICY "Authenticated users can insert products"
ON public.products FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Product Images 정책
CREATE POLICY "Product images are viewable by everyone"
ON public.product_images FOR SELECT
USING (true);

-- Reviews 정책
CREATE POLICY "Reviews are viewable by everyone"
ON public.product_reviews FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert reviews"
ON public.product_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

## 6️⃣ 완료 확인

SQL Editor에서 테스트:

```sql
-- 테이블 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- PostGIS 확인
SELECT PostGIS_Version();

-- 함수 확인
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'nearby_products';
```

---

## 📝 다음 단계

데이터베이스 스키마가 준비되었습니다!

이제 다음 파일의 데이터 import 스크립트를 실행하세요:
- `supabase/01_import_provinces.sql`
- `supabase/02_import_regencies.sql`
- `supabase/03_import_categories.sql`

또는 Supabase Dashboard → Table Editor에서 CSV 업로드를 사용할 수 있습니다.
