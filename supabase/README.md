# TokoMonggo Database Migrations

인도네시아 중고거래 마켓플레이스 TokoMonggo의 완벽한 데이터베이스 스키마 및 마이그레이션 파일

## 📁 파일 구조

```
supabase/
├── migrations/
│   ├── 00_complete_tokomonggo_schema.sql    # 🌟 메인 스키마 (모든 테이블, 함수, RLS)
│   ├── 20250111_search_index.sql            # Full-text search 인덱스
│   └── 20250111_comments_reviews.sql        # 댓글/리뷰 시스템
│
├── supabase_migrations/
│   ├── 01_add_geolocation.sql               # 위경도 필드 추가
│   ├── 02_add_regency_coordinates.sql       # Regency 좌표 자동 설정
│   └── 03_indonesia_regency_coordinates_full.sql  # 514개 시/군 좌표 데이터
│
├── DATABASE_SETUP_GUIDE.md                  # 📖 완벽한 설정 가이드
├── SQL_CHEATSHEET.md                        # ⚡ 빠른 참조 치트시트
└── README.md                                # 이 파일
```

---

## 🚀 빠른 시작

### 1단계: 메인 스키마 설치

**Supabase Dashboard → SQL Editor**에서 다음 파일을 순서대로 실행:

```sql
-- 1. 메인 스키마 (모든 테이블, 함수, RLS, 트리거)
00_complete_tokomonggo_schema.sql

-- 2. 인도네시아 514개 시/군 좌표 데이터
../supabase_migrations/03_indonesia_regency_coordinates_full.sql
```

### 2단계: Storage Buckets 생성

**Supabase Dashboard → Storage**에서 2개 버킷 생성:

1. **product-images** (공개, 5MB 제한)
2. **profile-avatars** (공개, 2MB 제한)

자세한 설정은 [DATABASE_SETUP_GUIDE.md](./DATABASE_SETUP_GUIDE.md) 참고

### 3단계: 확인

```sql
-- 테이블 생성 확인
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- RLS 활성화 확인
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public';

-- 함수 생성 확인
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

---

## 📊 데이터베이스 개요

### 핵심 테이블 (9개)

| 테이블 | 설명 | 주요 기능 |
|--------|------|-----------|
| **profiles** | 사용자 프로필 | phone/whatsapp 필수, regency 연결 |
| **provinces** | 인도네시아 34개 주 | 지역 계층 구조 |
| **regencies** | 514개 시/군 | 위경도 좌표 포함 |
| **categories** | 상품 카테고리 | 2단계 구조 (24개) |
| **products** | 상품 정보 | 검색 벡터, 위경도 자동 설정 |
| **product_images** | 상품 이미지 | 최대 5장, 순서 지정 |
| **product_comments** | 댓글/리뷰 | 별점, 대댓글, 판매자 답글 |
| **favorites** | 찜하기 | 사용자-상품 관계 |
| **view_history** | 조회 기록 | 최근 100개 유지 |

### 주요 함수 (10개)

| 함수 | 설명 | 사용처 |
|------|------|--------|
| **search_products** | Full-text 검색 | 검색 페이지 |
| **nearby_products** | 근처 상품 검색 | 위치 기반 검색 |
| **products_by_regency** | 지역별 상품 | 지역 필터 |
| **get_product_comment_stats** | 댓글 통계 | 상품 상세 페이지 |
| **get_product_comments_with_replies** | 댓글 + 대댓글 | 댓글 목록 |
| **get_comment_replies** | 대댓글만 | 댓글 확장 |
| **get_user_product_stats** | 사용자 통계 | 프로필 페이지 |
| **upsert_view_history** | 조회 기록 | 상품 조회 시 |
| **cleanup_old_view_history** | 오래된 기록 정리 | 정기 작업 |
| **archive_old_inactive_products** | 비활성 상품 아카이빙 | 정기 작업 |

---

## 🔐 보안 (RLS)

모든 테이블에 **Row Level Security (RLS)** 활성화 및 정책 적용:

### 기본 원칙
- ✅ **읽기**: 대부분 공개 (active/sold 상품만)
- ✅ **쓰기**: 로그인 사용자만
- ✅ **수정/삭제**: 본인 데이터만

### 특수 정책
- 판매자만 `is_seller_reply = true` 설정 가능
- 상품 소유자만 상품 이미지 삭제 가능
- 비활성/삭제 상품은 소유자만 조회 가능

---

## ⚡ 성능 최적화

### 인덱스 (총 20개)

```sql
-- Products 테이블 (8개)
- idx_products_user           (user_id)
- idx_products_regency        (regency_id)
- idx_products_category       (category_id)
- idx_products_status         (status)
- idx_products_created        (created_at DESC)
- idx_products_price          (price)
- idx_products_location       (latitude, longitude)
- products_search_idx         (search_vector GIN)

-- Comments 테이블 (3개)
- idx_comments_product        (product_id, created_at DESC)
- idx_comments_user           (user_id)
- idx_comments_parent         (parent_id)

-- 기타 테이블
- idx_product_images_product  (product_id, order)
- idx_favorites_user          (user_id, created_at DESC)
- idx_favorites_product       (product_id)
- idx_view_history_user       (user_id, viewed_at DESC)
- idx_regencies_location      (latitude, longitude)
- idx_profiles_username       (username)
```

### 자동 트리거 (6개)

1. **updated_at 자동 업데이트** (profiles, products, comments)
2. **search_vector 자동 생성** (products)
3. **위경도 자동 설정** (products ← regencies)
4. **프로필 자동 생성** (회원가입 시)

---

## 🎯 주요 기능

### 1. 인도네시아어 Full-Text Search

```sql
-- 검색 예시
SELECT * FROM search_products('iphone 12', 50);
```

- 인도네시아어 형태소 분석 지원
- 제목 + 설명 통합 검색
- 검색 관련도 순 정렬

### 2. Geolocation 기반 검색

```sql
-- 반경 50km 이내 상품
SELECT * FROM nearby_products(-6.2088, 106.8456, 50, 20);
```

- Haversine 공식 사용
- 거리 계산 (km)
- 가까운 순 정렬

### 3. 댓글/리뷰 시스템

```sql
-- 댓글 통계
SELECT * FROM get_product_comment_stats('product-uuid');
-- → comment_count, average_rating, rating_distribution

-- 댓글 + 대댓글
SELECT * FROM get_product_comments_with_replies('product-uuid');
```

- 1-5 별점
- 무제한 대댓글
- 판매자 답글 표시
- 사용자 정보 자동 조인

### 4. 자동 위치 설정

```sql
-- 상품 등록 시 regency_id만 지정하면 자동으로 위경도 설정
INSERT INTO products (user_id, title, ..., regency_id)
VALUES (..., 3171);
-- → latitude, longitude 자동 복사!
```

---

## 📚 문서

### 완벽한 가이드
[**DATABASE_SETUP_GUIDE.md**](./DATABASE_SETUP_GUIDE.md)
- 상세한 설치 방법
- 테이블별 설명
- API 사용법
- 성능 최적화 팁
- 보안 설정
- 문제 해결

### 빠른 참조
[**SQL_CHEATSHEET.md**](./SQL_CHEATSHEET.md)
- 자주 사용하는 쿼리
- RPC 함수 사용법
- 관리 작업
- 성능 모니터링
- 백업/복원

---

## 🛠️ 유지보수

### 정기 작업 (주 1회)

```sql
-- 1. 오래된 조회 기록 정리
SELECT cleanup_old_view_history();

-- 2. 비활성 상품 아카이빙 (90일 후)
SELECT archive_old_inactive_products();

-- 3. VACUUM ANALYZE
VACUUM ANALYZE products;
VACUUM ANALYZE product_comments;
```

### 모니터링

```sql
-- 테이블 크기
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.'||tablename) DESC;

-- 인덱스 사용 통계
SELECT tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

---

## 🔄 마이그레이션 히스토리

| 날짜 | 파일 | 변경 사항 |
|------|------|-----------|
| 2025-01-11 | 00_complete_tokomonggo_schema.sql | 초기 완벽한 스키마 생성 |
| 2025-01-11 | 20250111_search_index.sql | Full-text search 추가 |
| 2025-01-11 | 20250111_comments_reviews.sql | 댓글/리뷰 시스템 추가 |
| 이전 | 01_add_geolocation.sql | 위경도 필드 추가 |
| 이전 | 02_add_regency_coordinates.sql | 자동 위치 설정 트리거 |
| 이전 | 03_indonesia_regency_coordinates_full.sql | 514개 시/군 좌표 데이터 |

---

## 💡 사용 예시

### Next.js에서 사용

```javascript
import { createClientComponentClient } from '@supabase/ssr';

const supabase = createClientComponentClient();

// 검색
const { data } = await supabase.rpc('search_products', {
  search_query: 'iphone',
  limit_count: 20
});

// 근처 상품
const { data } = await supabase.rpc('nearby_products', {
  user_lat: -6.2088,
  user_lng: 106.8456,
  max_distance_km: 50,
  limit_count: 20
});

// 상품 조회 + 이미지
const { data } = await supabase
  .from('products')
  .select(`
    *,
    product_images (image_url, order),
    users:user_id (full_name, phone_number, whatsapp_number)
  `)
  .eq('id', productId)
  .single();

// 댓글 작성
const { error } = await supabase
  .from('product_comments')
  .insert({
    product_id: productId,
    user_id: user.id,
    comment: '좋은 상품입니다!',
    rating: 5
  });
```

---

## 📈 통계

- **총 테이블**: 9개
- **총 함수**: 10개
- **총 트리거**: 6개
- **총 인덱스**: 20개
- **총 RLS 정책**: 25개
- **지원 지역**: 34개 주, 514개 시/군
- **지원 카테고리**: 24개

---

## 🤝 기여

버그 리포트나 기능 제안은 이슈로 등록해주세요.

---

## 📄 라이선스

MIT License

---

## 🔗 참고 자료

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [PostGIS (Advanced Geo)](https://postgis.net/)
- [Next.js Supabase Integration](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

---

**Last Updated**: 2025-01-11
**Version**: 1.0
**Maintainer**: TokoMonggo Team

---

## ✨ 다음 단계

1. ✅ SQL 스키마 적용
2. ✅ Storage Buckets 생성
3. ⬜ 인도네시아 지역 데이터 완성 (514개 모두)
4. ⬜ 카테고리 아이콘 추가
5. ⬜ 알림 시스템 (댓글, 찜하기)
6. ⬜ 채팅 시스템
7. ⬜ 신고 시스템
8. ⬜ 관리자 대시보드

---

**Happy Coding! 🚀**
