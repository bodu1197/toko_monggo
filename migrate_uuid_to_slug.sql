-- ============================================================================
-- UUID를 slug로 마이그레이션 (데이터 유지)
-- ============================================================================
-- 이 스크립트는 기존 데이터를 유지하면서 UUID를 slug로 교체합니다
-- 현재 데이터: 4개 상품 (모두 UUID와 slug 보유)
-- ============================================================================

-- Step 0: RLS 정책 삭제 (product_id 의존성 제거)
-- product_images 정책들
DROP POLICY IF EXISTS "Product owners and admins can delete images" ON product_images;
DROP POLICY IF EXISTS "Product owners and admins can insert images" ON product_images;
DROP POLICY IF EXISTS "Product owners and admins can update images" ON product_images;
DROP POLICY IF EXISTS "Anyone can view images" ON product_images;

-- product_comments 정책들 (있을 수 있음)
DROP POLICY IF EXISTS "Product owners and admins can delete comments" ON product_comments;
DROP POLICY IF EXISTS "Product owners and admins can insert comments" ON product_comments;
DROP POLICY IF EXISTS "Product owners and admins can update comments" ON product_comments;
DROP POLICY IF EXISTS "Anyone can view comments" ON product_comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON product_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON product_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON product_comments;
DROP POLICY IF EXISTS "Product owner can mark as seller reply" ON product_comments;

-- favorites 정책들 (있을 수 있음)
DROP POLICY IF EXISTS "Users can manage their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;

-- reports 정책들 (있을 수 있음)
DROP POLICY IF EXISTS "Users can insert reports" ON reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON reports;

-- view_history 정책들 (있을 수 있음)
DROP POLICY IF EXISTS "Users can view their own history" ON view_history;
DROP POLICY IF EXISTS "Users can insert their own history" ON view_history;
DROP POLICY IF EXISTS "Users can delete their own history" ON view_history;

-- Step 1: 임시로 id 컬럼 이름 변경 (백업용)
ALTER TABLE products RENAME COLUMN id TO id_old;

-- Step 2: slug를 NOT NULL로 변경 (이미 모든 상품에 slug가 있어야 함)
ALTER TABLE products ALTER COLUMN slug SET NOT NULL;

-- Step 3: 다른 테이블에 product_slug 컬럼 추가 (데이터 복사용)
ALTER TABLE product_images ADD COLUMN product_slug TEXT;
ALTER TABLE product_comments ADD COLUMN product_slug TEXT;
ALTER TABLE favorites ADD COLUMN product_slug TEXT;
ALTER TABLE reports ADD COLUMN reported_product_slug TEXT;
ALTER TABLE view_history ADD COLUMN product_slug TEXT;

-- Step 4: UUID를 slug로 데이터 복사
UPDATE product_images pi
SET product_slug = p.slug
FROM products p
WHERE pi.product_id = p.id_old;

UPDATE product_comments pc
SET product_slug = p.slug
FROM products p
WHERE pc.product_id = p.id_old;

UPDATE favorites f
SET product_slug = p.slug
FROM products p
WHERE f.product_id = p.id_old;

UPDATE reports r
SET reported_product_slug = p.slug
FROM products p
WHERE r.reported_product_id = p.id_old;

UPDATE view_history vh
SET product_slug = p.slug
FROM products p
WHERE vh.product_id = p.id_old;

-- Step 5: 기존 외래키 제약조건 삭제
ALTER TABLE product_images DROP CONSTRAINT IF EXISTS product_images_product_id_fkey;
ALTER TABLE product_comments DROP CONSTRAINT IF EXISTS product_comments_product_id_fkey;
ALTER TABLE favorites DROP CONSTRAINT IF EXISTS favorites_product_id_fkey;
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_reported_product_id_fkey;
ALTER TABLE view_history DROP CONSTRAINT IF EXISTS view_history_product_id_fkey;

-- Step 6: 기존 UUID 컬럼 삭제
ALTER TABLE product_images DROP COLUMN product_id;
ALTER TABLE product_comments DROP COLUMN product_id;
ALTER TABLE favorites DROP COLUMN product_id;
ALTER TABLE reports DROP COLUMN reported_product_id;
ALTER TABLE view_history DROP COLUMN product_id;

-- Step 7: slug 컬럼을 NOT NULL로 설정
ALTER TABLE product_images ALTER COLUMN product_slug SET NOT NULL;
ALTER TABLE product_comments ALTER COLUMN product_slug SET NOT NULL;
ALTER TABLE favorites ALTER COLUMN product_slug SET NOT NULL;
ALTER TABLE view_history ALTER COLUMN product_slug SET NOT NULL;
-- reports는 NULL 허용 (삭제된 상품 가능)

-- Step 8: products 테이블의 PRIMARY KEY 변경
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_pkey;
ALTER TABLE products ADD PRIMARY KEY (slug);

-- Step 9: 외래키 제약조건 재생성
ALTER TABLE product_images
ADD CONSTRAINT product_images_product_slug_fkey
FOREIGN KEY (product_slug) REFERENCES products(slug) ON DELETE CASCADE;

ALTER TABLE product_comments
ADD CONSTRAINT product_comments_product_slug_fkey
FOREIGN KEY (product_slug) REFERENCES products(slug) ON DELETE CASCADE;

ALTER TABLE favorites
ADD CONSTRAINT favorites_product_slug_fkey
FOREIGN KEY (product_slug) REFERENCES products(slug) ON DELETE CASCADE;

ALTER TABLE reports
ADD CONSTRAINT reports_product_slug_fkey
FOREIGN KEY (reported_product_slug) REFERENCES products(slug) ON DELETE SET NULL;

ALTER TABLE view_history
ADD CONSTRAINT view_history_product_slug_fkey
FOREIGN KEY (product_slug) REFERENCES products(slug) ON DELETE CASCADE;

-- Step 10: 인덱스 재생성
DROP INDEX IF EXISTS idx_product_images_product;
DROP INDEX IF EXISTS idx_product_comments_product;
DROP INDEX IF EXISTS idx_favorites_product;
DROP INDEX IF EXISTS favorites_user_id_product_id_key;

CREATE INDEX idx_product_images_slug ON product_images(product_slug, "order");
CREATE INDEX idx_product_comments_slug ON product_comments(product_slug, created_at DESC);
CREATE INDEX idx_favorites_slug ON favorites(product_slug);
CREATE UNIQUE INDEX favorites_user_slug_key ON favorites(user_id, product_slug);
CREATE INDEX idx_view_history_slug ON view_history(product_slug, viewed_at DESC);

-- Step 11: 기존 id_old 컬럼 삭제 (백업 완료 후)
ALTER TABLE products DROP COLUMN id_old;

-- Step 12: RLS 정책 재생성 (product_slug 사용)
-- 기존 정책이 남아있을 수 있으므로 다시 한번 삭제
DROP POLICY IF EXISTS "Anyone can view images" ON product_images;
DROP POLICY IF EXISTS "Product owners and admins can insert images" ON product_images;
DROP POLICY IF EXISTS "Product owners and admins can update images" ON product_images;
DROP POLICY IF EXISTS "Product owners and admins can delete images" ON product_images;
DROP POLICY IF EXISTS "Anyone can view comments" ON product_comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON product_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON product_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON product_comments;
DROP POLICY IF EXISTS "Product owner can mark as seller reply" ON product_comments;
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON favorites;
DROP POLICY IF EXISTS "Authenticated users can insert reports" ON reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON reports;
DROP POLICY IF EXISTS "Users can view their own history" ON view_history;
DROP POLICY IF EXISTS "Users can insert their own history" ON view_history;
DROP POLICY IF EXISTS "Users can delete their own history" ON view_history;

-- product_images 정책들
CREATE POLICY "Anyone can view images"
ON product_images FOR SELECT
TO public
USING (true);

CREATE POLICY "Product owners and admins can insert images"
ON product_images FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.slug = product_images.product_slug
    AND products.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Product owners and admins can update images"
ON product_images FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.slug = product_images.product_slug
    AND products.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Product owners and admins can delete images"
ON product_images FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.slug = product_images.product_slug
    AND products.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- product_comments 정책들
CREATE POLICY "Anyone can view comments"
ON product_comments FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can insert comments"
ON product_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON product_comments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON product_comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Product owner can mark as seller reply"
ON product_comments FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.slug = product_comments.product_slug
    AND products.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.slug = product_comments.product_slug
    AND products.user_id = auth.uid()
  )
);

-- favorites 정책들
CREATE POLICY "Users can view their own favorites"
ON favorites FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
ON favorites FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
ON favorites FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- reports 정책들
CREATE POLICY "Authenticated users can insert reports"
ON reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
ON reports FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- view_history 정책들
CREATE POLICY "Users can view their own history"
ON view_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own history"
ON view_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own history"
ON view_history FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- 완료!
-- - 모든 데이터 유지됨 (4개 상품)
-- - slug가 이제 Primary Key
-- - UUID 완전히 제거됨
-- - RLS 정책 모두 재생성됨 (product_slug 기반)
-- ============================================================================

-- 확인용 쿼리
SELECT slug, title, created_at FROM products ORDER BY created_at DESC LIMIT 5;
