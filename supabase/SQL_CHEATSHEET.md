# TokoMonggo SQL Cheatsheet

빠른 참조를 위한 SQL 명령어 및 쿼리 모음

## 📌 목차
- [기본 쿼리](#기본-쿼리)
- [RPC 함수](#rpc-함수)
- [관리 작업](#관리-작업)
- [성능 모니터링](#성능-모니터링)

---

## 기본 쿼리

### 상품 조회

```sql
-- 전체 상품 (활성 상태만)
SELECT * FROM products
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 20;

-- 특정 카테고리
SELECT p.*, c.name as category_name
FROM products p
JOIN categories c ON p.category_id = c.category_id
WHERE p.category_id = 1
  AND p.status = 'active';

-- 가격 범위 필터
SELECT * FROM products
WHERE price BETWEEN 100000 AND 1000000
  AND status = 'active'
ORDER BY price ASC;

-- 특정 지역
SELECT p.*, r.regency_name, pr.province_name
FROM products p
JOIN regencies r ON p.regency_id = r.regency_id
JOIN provinces pr ON r.province_id = pr.province_id
WHERE p.regency_id = 3171
  AND p.status = 'active';

-- 이미지 포함
SELECT
  p.*,
  json_agg(
    json_build_object(
      'id', pi.id,
      'url', pi.image_url,
      'order', pi."order"
    ) ORDER BY pi."order"
  ) as images
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
WHERE p.id = 'your-product-uuid'
GROUP BY p.id;
```

### 사용자 조회

```sql
-- 프로필 정보
SELECT * FROM profiles WHERE id = 'user-uuid';

-- 사용자의 활성 상품
SELECT * FROM products
WHERE user_id = 'user-uuid'
  AND status = 'active'
ORDER BY created_at DESC;

-- 사용자의 판매 통계
SELECT
  COUNT(*) FILTER (WHERE status = 'active') as active_count,
  COUNT(*) FILTER (WHERE status = 'sold') as sold_count,
  COUNT(*) FILTER (WHERE status = 'inactive') as inactive_count
FROM products
WHERE user_id = 'user-uuid';
```

### 댓글 조회

```sql
-- 상품의 모든 댓글 (최상위만)
SELECT
  c.*,
  p.full_name,
  p.avatar_url,
  (SELECT COUNT(*) FROM product_comments WHERE parent_id = c.id) as reply_count
FROM product_comments c
LEFT JOIN profiles p ON c.user_id = p.id
WHERE c.product_id = 'product-uuid'
  AND c.parent_id IS NULL
ORDER BY c.created_at DESC;

-- 특정 댓글의 대댓글
SELECT
  c.*,
  p.full_name,
  p.avatar_url
FROM product_comments c
LEFT JOIN profiles p ON c.user_id = p.id
WHERE c.parent_id = 'parent-comment-uuid'
ORDER BY c.created_at ASC;

-- 평균 별점
SELECT
  ROUND(AVG(rating), 1) as avg_rating,
  COUNT(*) as total_reviews
FROM product_comments
WHERE product_id = 'product-uuid'
  AND rating IS NOT NULL
  AND parent_id IS NULL;
```

### 찜하기 조회

```sql
-- 사용자가 찜한 상품
SELECT
  p.*,
  f.created_at as favorited_at
FROM favorites f
JOIN products p ON f.product_id = p.id
WHERE f.user_id = 'user-uuid'
ORDER BY f.created_at DESC;

-- 상품을 찜한 사용자 수
SELECT COUNT(*) as favorite_count
FROM favorites
WHERE product_id = 'product-uuid';
```

---

## RPC 함수

### 검색 함수

```sql
-- Full-text search
SELECT * FROM search_products(
  'iphone 12',  -- 검색어
  50            -- 결과 수
);

-- 근처 상품 검색
SELECT * FROM nearby_products(
  -6.2088,      -- 위도
  106.8456,     -- 경도
  50,           -- 반경 (km)
  20            -- 결과 수
);

-- 지역별 상품 검색
SELECT * FROM products_by_regency(
  3171,         -- regency_id
  20            -- 결과 수
);
```

### 댓글 함수

```sql
-- 댓글 통계
SELECT * FROM get_product_comment_stats('product-uuid');
-- 결과: comment_count, average_rating, rating_distribution

-- 댓글 + 대댓글
SELECT * FROM get_product_comments_with_replies('product-uuid');

-- 대댓글만
SELECT * FROM get_comment_replies('comment-uuid');
```

### 사용자 통계

```sql
-- 사용자 상품 통계
SELECT * FROM get_user_product_stats('user-uuid');
-- 결과: total_products, active_products, sold_products, total_favorites, average_rating
```

### 조회 기록

```sql
-- 조회 기록 추가/업데이트
SELECT upsert_view_history(
  'user-uuid',
  'product-uuid'
);
```

---

## 관리 작업

### 데이터 삽입

```sql
-- 상품 등록
INSERT INTO products (
  user_id, title, description, price, condition,
  is_negotiable, province_id, regency_id, category_id, status
) VALUES (
  'user-uuid',
  'iPhone 12 Pro 128GB',
  '깨끗한 상태입니다',
  8000000,
  'Seperti Baru',
  true,
  31,
  3171,
  1,
  'active'
) RETURNING *;

-- 상품 이미지 등록
INSERT INTO product_images (product_id, image_url, "order")
VALUES
  ('product-uuid', 'https://...image1.jpg', 0),
  ('product-uuid', 'https://...image2.jpg', 1),
  ('product-uuid', 'https://...image3.jpg', 2);

-- 댓글 작성
INSERT INTO product_comments (product_id, user_id, comment, rating)
VALUES (
  'product-uuid',
  'user-uuid',
  '좋은 상품입니다!',
  5
) RETURNING *;

-- 찜하기 추가
INSERT INTO favorites (user_id, product_id)
VALUES ('user-uuid', 'product-uuid')
ON CONFLICT (user_id, product_id) DO NOTHING;
```

### 데이터 수정

```sql
-- 상품 수정
UPDATE products
SET
  title = 'Updated Title',
  price = 7500000,
  status = 'active'
WHERE id = 'product-uuid'
  AND user_id = 'user-uuid';  -- 본인만 수정

-- 상품 판매 완료 처리
UPDATE products
SET status = 'sold'
WHERE id = 'product-uuid';

-- 프로필 수정
UPDATE profiles
SET
  full_name = 'John Doe',
  phone_number = '081234567890',
  whatsapp_number = '081234567890',
  bio = 'Jual barang bekas berkualitas'
WHERE id = 'user-uuid';
```

### 데이터 삭제

```sql
-- 찜하기 취소
DELETE FROM favorites
WHERE user_id = 'user-uuid'
  AND product_id = 'product-uuid';

-- 댓글 삭제
DELETE FROM product_comments
WHERE id = 'comment-uuid'
  AND user_id = 'user-uuid';  -- 본인만 삭제

-- 상품 soft delete (상태만 변경)
UPDATE products
SET status = 'deleted'
WHERE id = 'product-uuid'
  AND user_id = 'user-uuid';

-- 상품 hard delete (실제 삭제, 이미지도 CASCADE 삭제)
DELETE FROM products
WHERE id = 'product-uuid'
  AND user_id = 'user-uuid';
```

---

## 성능 모니터링

### 인덱스 사용 확인

```sql
-- 인덱스 사용 통계
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- 사용되지 않는 인덱스 찾기
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexname NOT LIKE '%_pkey';
```

### 테이블 크기 확인

```sql
-- 테이블별 크기
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 전체 데이터베이스 크기
SELECT pg_size_pretty(pg_database_size(current_database()));
```

### 느린 쿼리 찾기

```sql
-- pg_stat_statements 활성화 필요
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_time DESC
LIMIT 10;
```

### 테이블 통계

```sql
-- 각 테이블의 레코드 수
SELECT
  schemaname,
  tablename,
  n_live_tup as row_count,
  n_dead_tup as dead_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- VACUUM 필요 여부 확인
SELECT
  schemaname,
  tablename,
  n_dead_tup,
  n_live_tup,
  ROUND(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_ratio
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND n_dead_tup > 1000
ORDER BY dead_ratio DESC;
```

---

## 유지보수 작업

### 정기 작업

```sql
-- 오래된 조회 기록 정리
SELECT cleanup_old_view_history();

-- 오래된 비활성 상품 아카이빙
SELECT archive_old_inactive_products();

-- VACUUM ANALYZE (자동 분석 + 공간 회수)
VACUUM ANALYZE products;
VACUUM ANALYZE product_comments;
VACUUM ANALYZE favorites;

-- Full VACUUM (테이블 잠금, 주의!)
VACUUM FULL products;
```

### 검색 벡터 재생성

```sql
-- 전체 상품 검색 벡터 재생성
UPDATE products
SET search_vector = to_tsvector('indonesian', title || ' ' || description);

-- NULL인 것만 업데이트
UPDATE products
SET search_vector = to_tsvector('indonesian', title || ' ' || description)
WHERE search_vector IS NULL;
```

### 위치 정보 동기화

```sql
-- 위치 정보가 없는 상품에 regency 좌표 복사
UPDATE products p
SET
  latitude = r.latitude,
  longitude = r.longitude
FROM regencies r
WHERE p.regency_id = r.regency_id
  AND (p.latitude IS NULL OR p.longitude IS NULL)
  AND r.latitude IS NOT NULL
  AND r.longitude IS NOT NULL;
```

---

## 백업 & 복원

### 데이터 백업

```bash
# 전체 데이터베이스 백업
pg_dump -h your-host -U postgres -d tokomonggo > backup.sql

# 특정 테이블만 백업
pg_dump -h your-host -U postgres -d tokomonggo -t products -t product_images > products_backup.sql

# 데이터만 백업 (스키마 제외)
pg_dump -h your-host -U postgres -d tokomonggo --data-only > data_backup.sql
```

### 데이터 복원

```bash
# 전체 복원
psql -h your-host -U postgres -d tokomonggo < backup.sql

# 특정 테이블만 복원
psql -h your-host -U postgres -d tokomonggo < products_backup.sql
```

---

## 유용한 쿼리

### 인기 상품 순위

```sql
-- 최근 7일간 가장 많이 조회된 상품
SELECT
  p.id,
  p.title,
  COUNT(vh.id) as view_count
FROM products p
JOIN view_history vh ON p.id = vh.product_id
WHERE vh.viewed_at > now() - INTERVAL '7 days'
GROUP BY p.id, p.title
ORDER BY view_count DESC
LIMIT 10;

-- 찜이 가장 많은 상품
SELECT
  p.id,
  p.title,
  COUNT(f.id) as favorite_count
FROM products p
LEFT JOIN favorites f ON p.id = f.product_id
GROUP BY p.id, p.title
ORDER BY favorite_count DESC
LIMIT 10;
```

### 판매자 순위

```sql
-- 가장 활발한 판매자 (상품 수)
SELECT
  pr.id,
  pr.full_name,
  COUNT(p.id) as product_count,
  COUNT(p.id) FILTER (WHERE p.status = 'sold') as sold_count
FROM profiles pr
LEFT JOIN products p ON pr.id = p.user_id
GROUP BY pr.id, pr.full_name
ORDER BY product_count DESC
LIMIT 10;

-- 평균 별점이 높은 판매자
SELECT
  pr.id,
  pr.full_name,
  ROUND(AVG(c.rating), 1) as avg_rating,
  COUNT(c.id) as review_count
FROM profiles pr
JOIN products p ON pr.id = p.user_id
JOIN product_comments c ON p.id = c.product_id
WHERE c.rating IS NOT NULL
  AND c.parent_id IS NULL
GROUP BY pr.id, pr.full_name
HAVING COUNT(c.id) >= 5
ORDER BY avg_rating DESC
LIMIT 10;
```

### 카테고리 통계

```sql
-- 카테고리별 상품 수
SELECT
  c.name,
  c.parent_category,
  COUNT(p.id) as product_count,
  ROUND(AVG(p.price), 0) as avg_price
FROM categories c
LEFT JOIN products p ON c.category_id = p.category_id
  AND p.status = 'active'
GROUP BY c.category_id, c.name, c.parent_category
ORDER BY product_count DESC;
```

### 지역별 통계

```sql
-- 지역별 상품 수
SELECT
  pr.province_name,
  COUNT(p.id) as product_count
FROM provinces pr
LEFT JOIN regencies r ON pr.province_id = r.province_id
LEFT JOIN products p ON r.regency_id = p.regency_id
  AND p.status = 'active'
GROUP BY pr.province_id, pr.province_name
ORDER BY product_count DESC;

-- 가장 활발한 시/군
SELECT
  r.regency_name,
  pr.province_name,
  COUNT(p.id) as product_count
FROM regencies r
JOIN provinces pr ON r.province_id = pr.province_id
LEFT JOIN products p ON r.regency_id = p.regency_id
  AND p.status = 'active'
GROUP BY r.regency_id, r.regency_name, pr.province_name
ORDER BY product_count DESC
LIMIT 20;
```

---

## 트러블슈팅

### RLS 디버깅

```sql
-- 현재 사용자 확인
SELECT current_user, auth.uid();

-- RLS 정책 확인
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- 특정 테이블 RLS 임시 비활성화 (주의!)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- 다시 활성화
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```

### 검색 문제

```sql
-- 검색 벡터 확인
SELECT id, title, search_vector
FROM products
LIMIT 5;

-- 검색 테스트
SELECT id, title
FROM products
WHERE search_vector @@ to_tsquery('indonesian', 'iphone')
LIMIT 10;

-- 검색 벡터 NULL 확인
SELECT COUNT(*)
FROM products
WHERE search_vector IS NULL;
```

### 연결 문제

```sql
-- 현재 연결 수 확인
SELECT COUNT(*) FROM pg_stat_activity;

-- 활성 쿼리 확인
SELECT pid, usename, state, query
FROM pg_stat_activity
WHERE state = 'active';

-- 오래 실행 중인 쿼리 찾기
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active'
  AND now() - query_start > INTERVAL '5 minutes';
```

---

## 참고 자료

- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)
- [Supabase 문서](https://supabase.com/docs)
- [Full-Text Search 가이드](https://www.postgresql.org/docs/current/textsearch.html)

---

**Last Updated**: 2025-01-11
