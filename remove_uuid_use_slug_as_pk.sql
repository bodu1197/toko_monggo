-- ============================================================================
-- 완전 재설계: UUID 제거, slug를 Primary Key로 사용
-- ============================================================================
-- 경고: 이 작업은 기존 데이터를 모두 삭제합니다!
-- 실행 전 반드시 백업하세요!
-- ============================================================================

-- Step 1: 모든 외래키 제약조건 삭제
ALTER TABLE product_images DROP CONSTRAINT IF EXISTS product_images_product_id_fkey;
ALTER TABLE product_comments DROP CONSTRAINT IF EXISTS product_comments_product_id_fkey;
ALTER TABLE favorites DROP CONSTRAINT IF EXISTS favorites_product_id_fkey;
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_reported_product_id_fkey;
ALTER TABLE product_views DROP CONSTRAINT IF EXISTS product_views_product_id_fkey;

-- Step 2: products 테이블의 기존 PRIMARY KEY 제거
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_pkey;

-- Step 3: id(UUID) 컬럼 삭제
ALTER TABLE products DROP COLUMN IF EXISTS id;

-- Step 4: slug를 PRIMARY KEY로 설정
ALTER TABLE products ADD PRIMARY KEY (slug);

-- Step 5: 다른 테이블들의 product_id를 product_slug(TEXT)로 변경
-- product_images
ALTER TABLE product_images DROP COLUMN IF EXISTS product_id;
ALTER TABLE product_images ADD COLUMN product_slug TEXT NOT NULL REFERENCES products(slug) ON DELETE CASCADE;

-- product_comments
ALTER TABLE product_comments DROP COLUMN IF EXISTS product_id;
ALTER TABLE product_comments ADD COLUMN product_slug TEXT NOT NULL REFERENCES products(slug) ON DELETE CASCADE;

-- favorites
ALTER TABLE favorites DROP COLUMN IF EXISTS product_id;
ALTER TABLE favorites ADD COLUMN product_slug TEXT NOT NULL REFERENCES products(slug) ON DELETE CASCADE;

-- product_views
ALTER TABLE product_views DROP COLUMN IF EXISTS product_id;
ALTER TABLE product_views ADD COLUMN product_slug TEXT NOT NULL REFERENCES products(slug) ON DELETE CASCADE;

-- reports
ALTER TABLE reports DROP COLUMN IF EXISTS reported_product_id;
ALTER TABLE reports ADD COLUMN reported_product_slug TEXT REFERENCES products(slug) ON DELETE SET NULL;

-- Step 6: 인덱스 재생성
CREATE INDEX idx_product_images_slug ON product_images(product_slug, "order");
CREATE INDEX idx_product_comments_slug ON product_comments(product_slug, created_at DESC);
CREATE INDEX idx_favorites_slug ON favorites(product_slug);
CREATE INDEX idx_favorites_user_slug ON favorites(user_id, product_slug);
CREATE INDEX idx_product_views_slug ON product_views(product_slug);

-- Step 7: 기존 UNIQUE 제약조건 재생성
ALTER TABLE favorites ADD CONSTRAINT favorites_user_slug_key UNIQUE (user_id, product_slug);

-- ============================================================================
-- 완료! 이제 slug가 Primary Key입니다.
-- 기존 데이터는 모두 삭제되었으므로 새로 상품을 등록해야 합니다.
-- ============================================================================
