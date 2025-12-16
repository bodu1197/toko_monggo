
-- 1. products 테이블에 slug 컬럼 추가
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. 기존 products에 slug 설정
UPDATE products SET slug = 'notebook-samsung-nt550ebz-15f546bc' WHERE title = 'Notebook Samsung NT550EBZ';
UPDATE products SET slug = 'kimchi-premium-autentik-dibuat-langsung-oleh-chef-asal-7ed0febe' WHERE title = '🇰🇷 KIMCHI PREMIUM AUTENTIK! Dibuat Langsung oleh Chef Asal Korea (500g)';
UPDATE products SET slug = 'disewakan-apartemen-tamansari-prospero-kahuripan-nirwana-f76ddcf0' WHERE title = 'DISEWAKAN APARTEMEN TAMANSARI PROSPERO KAHURIPAN NIRWANA SIDOARJO';

-- 3. slug unique 제약조건 추가
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_slug_unique') THEN
    ALTER TABLE products ADD CONSTRAINT products_slug_unique UNIQUE (slug);
  END IF;
END $$;

-- 4. slug 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- 5. search_vector 컬럼 추가
ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

-- 6. product_comments에 product_slug 컬럼 추가
ALTER TABLE product_comments ADD COLUMN IF NOT EXISTS product_slug TEXT;

-- 7. product_images에 product_slug 컬럼 추가  
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS product_slug TEXT;

-- 8. favorites에 product_slug 컬럼 추가
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS product_slug TEXT;
