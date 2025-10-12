# 🛍️ TokoMonggo - 인도네시아 중고 거래 플랫폼 프로젝트 분석

## 📋 프로젝트 개요

**TokoMonggo**는 인도네시아를 타겟으로 하는 **중고 물품 거래 플랫폼**입니다.
OLX, Facebook Marketplace, 당근마켓과 유사한 로컬 C2C (Consumer-to-Consumer) 마켓플레이스입니다.

### 🎯 핵심 가치 제안
- 인도네시아 전역의 지역 기반 중고 물품 거래
- 34개 주(Province), 514개 도시/군(Regency), 7,000+ 구(District) 커버
- 16개 주요 카테고리, 100+ 서브카테고리
- 위치 기반 검색 및 필터링
- 안전한 사용자 간 거래

---

## 🗄️ 데이터베이스 구조 분석

### 📍 **지역 데이터 (Location Hierarchy)**

#### 1. Provinces (주/도)
```sql
provinces
- province_id (PK)
- province_name (예: ACEH, DKI JAKARTA, JAWA BARAT)
- province_code

총 34개 주
```

#### 2. Regencies (도시/군)
```sql
regencies
- regency_id (PK)
- province_id (FK → provinces)
- regency_name (예: KABUPATEN SIMEULUE, KOTA JAKARTA)
- regency_type (Kabupaten/Kota)
- regency_code

총 514개 도시/군
```

#### 3. Districts (구/면)
```sql
districts
- district_id (PK)
- regency_id (FK → regencies)
- district_name
- district_code

총 7,000+ 구
```

### 🏷️ **카테고리 구조**

#### 주요 카테고리 (16개)
1. **Elektronik** - 전자제품
2. **Fashion** - 패션/의류
3. **Rumah & Taman** - 주택 & 정원
4. **Mobil** - 자동차
5. **Motor** - 오토바이
6. **Properti** - 부동산
7. **Jasa & Lowongan Kerja** - 서비스 & 구인구직
8. **Handphone & Gadget** - 휴대폰 & 가젯
9. **Hobi & Olahraga** - 취미 & 스포츠
10. **Keperluan Pribadi** - 개인용품
11. **Perlengkapan Bayi & Anak** - 유아용품
12. **Kantor & Industri** - 사무실 & 산업
13. **Buku & Edukasi** - 도서 & 교육
14. **Olahraga** - 스포츠
15. **Barang Gratis** - 무료 나눔
16. **Lainnya** - 기타

#### 서브카테고리 예시
**Elektronik 하위:**
- Smartphone
- Laptop & Komputer
- Tablet
- TV & Audio
- Kamera & Fotografi
- Gaming
- Aksesoris Elektronik

**Fashion 하위:**
- Pakaian Pria/Wanita
- Sepatu Pria/Wanita
- Tas & Dompet
- Aksesoris Fashion
- Jam Tangan
- Kacamata
- Perhiasan

### 📦 **상품 데이터 구조**

```sql
products
- id (PK)
- user_id (FK → users)
- title (상품명)
- description (설명)
- price (가격 - NUMERIC(12,2))
- is_negotiable (가격 협상 가능 여부)
- condition (상태: new, like-new, used, etc.)
- category_id (FK → categories)
- regency_id (FK → regencies) - 위치
- location (GEOGRAPHY Point) - GPS 좌표
- phone_number (연락처)
- tags (검색 태그 배열)
- created_at, updated_at
```

### 🖼️ **상품 이미지**

```sql
product_images
- id (PK)
- product_id (FK → products)
- image_url (이미지 URL)
- order (이미지 순서)
- created_at
```

### ⭐ **리뷰 시스템**

```sql
product_reviews
- id (PK)
- product_id (FK → products)
- user_id (FK → users)
- comment (리뷰 내용)
- rating (1~5점)
- created_at
```

### 👤 **사용자 관리**

```sql
users
- id (PK)
- email (고유 이메일)
- password (암호화된 비밀번호)
- name (이름)
- role (user/admin)
- created_at
```

### ❤️ **찜하기 기능**

```sql
user_product_likes
- user_id (FK → users)
- product_id (FK → products)
- created_at
```

---

## 🎨 프론트엔드 기능 요구사항

### 📱 필수 페이지

1. **홈 페이지 (/)**
   - 최신 상품 피드
   - 카테고리 탐색
   - 지역별 필터
   - 검색 기능

2. **상품 리스팅 페이지 (/products)**
   - 카테고리별 상품 목록
   - 필터링 (가격, 위치, 상태, 협상 가능 여부)
   - 정렬 (최신순, 가격 낮은순/높은순)
   - 무한 스크롤/페이지네이션

3. **상품 상세 페이지 (/products/:id)**
   - 상품 이미지 갤러리
   - 상품 정보 (제목, 가격, 상태, 위치, 설명)
   - 판매자 정보 및 연락 버튼
   - 리뷰 목록
   - 찜하기 기능
   - 지도 (위치 표시)

4. **상품 등록/수정 페이지 (/products/new, /products/:id/edit)**
   - 이미지 업로드 (다중)
   - 카테고리 선택 (계층 구조)
   - 위치 선택 (Province → Regency → District)
   - 가격 및 협상 가능 여부
   - 상태 선택
   - 연락처 입력
   - 태그 입력

5. **프로필 페이지 (/profile/:userId)**
   - 판매 중인 상품 목록
   - 판매 완료 상품
   - 찜한 상품
   - 사용자 리뷰

6. **검색 페이지 (/search)**
   - 키워드 검색
   - 고급 필터 (카테고리, 위치, 가격 범위)
   - 검색 결과 목록

---

## 🚀 기술 스택 (현재 적용)

### Frontend
- **Next.js 15.5.4** (SSR/SSG for SEO)
- **React 19.2.0**
- **TypeScript** (권장 - 추가 필요)

### Backend/Database
- **Supabase** (PostgreSQL + Auth + Storage)
- **PostGIS** (지리 정보 처리)

### Deployment
- **Vercel** (Next.js 최적화)
- **GitHub** (버전 관리)

---

## 📊 현재 데이터 현황

### 카테고리
- **주요 카테고리**: 16개
- **서브카테고리**: ~100개

### 지역 데이터
- **주(Province)**: 34개
- **도시/군(Regency)**: 514개
- **구(District)**: 7,223개

### 상품
- **테스트 상품**: 4개 (개발용 더미 데이터)

---

## 🎯 다음 단계 (구현 우선순위)

### Phase 1: 데이터 통합 ✅
1. ~~Supabase에 데이터베이스 스키마 복원~~
2. ~~카테고리 데이터 import~~
3. ~~지역 데이터 import~~

### Phase 2: 핵심 기능 개발 🔄
1. **상품 리스팅 페이지**
   - 카테고리별 상품 목록
   - 검색 및 필터링
   - SEO 최적화

2. **상품 상세 페이지**
   - SSR로 SEO 최적화
   - Open Graph 메타태그
   - 이미지 최적화

3. **상품 등록 기능**
   - Supabase Storage 연동 (이미지 업로드)
   - 지역 선택 드롭다운
   - 카테고리 계층 선택

### Phase 3: 사용자 경험 개선
1. 지도 통합 (Google Maps/OpenStreetMap)
2. 실시간 채팅 (Supabase Realtime)
3. 알림 시스템
4. 찜하기/즐겨찾기

### Phase 4: 고급 기능
1. 결제 시스템 통합
2. 배송 추적
3. 사용자 신뢰도 시스템
4. 광고/프리미엄 리스팅

---

## 💡 SEO 전략

### 목표
- 인도네시아 검색 엔진 최적화
- Google Indonesia 1페이지 랭킹
- 지역별 롱테일 키워드 타겟

### 구현
- ✅ Next.js SSR/SSG
- ✅ 인도네시아어 메타데이터
- ✅ Semantic HTML
- 🔄 Schema.org 마크업 (Product, Offer, Review)
- 🔄 Sitemap.xml 생성
- 🔄 robots.txt 최적화

---

## 🌏 경쟁사 분석

### 주요 경쟁사
1. **OLX Indonesia** - 가장 큰 플레이어
2. **Tokopedia** - C2C/B2C 통합
3. **Shopee** - 신규 제품 위주
4. **Facebook Marketplace** - 소셜 기반

### 차별화 전략
- ✅ 더 나은 SEO (Next.js SSR)
- ✅ 빠른 로딩 속도
- 🔄 정확한 지역 필터링
- 🔄 사용자 친화적 UI/UX
- 🔄 모바일 최적화

---

## 📈 비즈니스 모델

### 수익원
1. **프리미엄 리스팅** - 상위 노출
2. **배너 광고**
3. **추천 상품 광고**
4. **프로 셀러 구독**
5. **거래 수수료** (선택적)

---

## 🔐 보안 고려사항

- ✅ Supabase RLS (Row Level Security)
- ✅ 비밀번호 해싱
- 🔄 이미지 검증 및 스캔
- 🔄 스팸 방지
- 🔄 사기 거래 탐지
- 🔄 개인정보 보호

---

## 📞 연락 및 지원

프로젝트 문의: [GitHub Repository](https://github.com/bodu1197/toko_monggo)
