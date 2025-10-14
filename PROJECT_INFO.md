# 프로젝트 정보 (PROJECT INFO)

## 프로젝트 개요
- **프로젝트명**: Toko Monggo (토코몽고)
- **설명**: 인도네시아 지역 기반 중고거래 마켓플레이스
- **언어**: Next.js 14 (App Router), React, JavaScript
- **데이터베이스**: Supabase (PostgreSQL)
- **배포**: Vercel
- **UI 언어**: 인도네시아어 (Bahasa Indonesia)

## 개발 환경 설정

### 1. Git 저장소
- **저장소**: https://github.com/bodu1197/toko_monggo
- **브랜치**: master
- **커밋 규칙**:
  - 모든 커밋에 `🤖 Generated with [Claude Code](https://claude.com/claude-code)` 포함
  - Co-Authored-By: Claude <noreply@anthropic.com> 포함

### 2. Supabase CLI
- **버전**: v2.48.3 (업데이트 가능: v2.51.0)
- **프로젝트 ID**: tokomonggo
- **설정 파일**: `supabase/config.toml`
- **마이그레이션**: `supabase/migrations/`
- **주요 명령어**:
  ```bash
  supabase db pull --schema public  # 원격 스키마 가져오기
  supabase start                     # 로컬 개발 환경 시작
  ```

### 3. Vercel 배포
- **배포 플랫폼**: vercel.com
- **배포 상태**: 배포 중 (Production)
- **배포 설정**: `vercel.json`
- **자동 배포**: master 브랜치 푸시 시 자동 배포

### 4. 환경 변수 (.env)
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 프로젝트 구조

```
tokomonggo/
├── app/                          # Next.js App Router
│   ├── page.jsx                  # 홈페이지 (상품 목록)
│   ├── page.css                  # 홈페이지 스타일
│   ├── layout.jsx                # 루트 레이아웃
│   ├── globals.css               # 글로벌 스타일
│   ├── profile/                  # 마이페이지
│   │   ├── page.jsx
│   │   └── profile.css
│   ├── products/[id]/            # 상품 상세 페이지
│   │   ├── page.jsx
│   │   └── detail.css
│   ├── components/               # 재사용 컴포넌트
│   │   └── products/
│   │       ├── ProductCard.jsx
│   │       └── ProductCard.css
│   ├── data/                     # 정적 데이터
│   │   └── categories.js         # 카테고리 데이터
│   └── utils/                    # 유틸리티 함수
│       ├── supabase.js           # Supabase 클라이언트
│       └── imageCompression.js   # 이미지 압축
├── supabase/                     # Supabase 관련
│   ├── config.toml               # Supabase 설정
│   ├── migrations/               # DB 마이그레이션
│   └── README.md                 # Supabase 문서
├── scripts/                      # 유틸리티 스크립트
├── .env                          # 환경 변수 (로컬)
├── .gitignore                    # Git 무시 파일
├── next.config.mjs               # Next.js 설정
├── package.json                  # 의존성 관리
├── vercel.json                   # Vercel 배포 설정
├── CLAUDE.md                     # Claude Code 가이드
└── PROJECT_INFO.md               # 이 파일
```

## 주요 기능

### 사용자 기능
1. **회원가입/로그인**: Supabase Auth (이메일/비밀번호, OAuth)
2. **상품 등록**: 이미지 업로드, 카테고리 선택, 지역 설정
3. **상품 검색/필터**: 카테고리, 가격, 상태, 지역 필터
4. **내 주변 상품**: Geolocation API로 근처 상품 검색
5. **찜하기**: 관심 상품 저장
6. **상품 상세**: 이미지 갤러리, 판매자 정보, 공유 기능
7. **마이페이지**: 내 상품 관리, 판매 일시중지, 프로필 수정

### 관리자 기능
1. **사용자 관리**: 계정 정지/복구
2. **상품 관리**: 승인/삭제
3. **휴지통**: 삭제된 항목 복구

## CSS 구조 정리 완료 (2025-10-15)

### ProductCard.css = 카드 컴포넌트의 단일 소스
- 모든 상품 카드 스타일은 `ProductCard.css`에서 관리
- `page.css`, `profile.css`에서 중복 제거 완료

### 컨텍스트별 CSS
- `detail.css`: 상품 상세 페이지 전용 (카드와 별도)
- `page.css`: 홈페이지 레이아웃 및 필터
- `profile.css`: 마이페이지 전용

## 데이터베이스 (Supabase)

### 주요 테이블
- `profiles`: 사용자 프로필
- `products`: 상품 정보
- `product_images`: 상품 이미지
- `favorites`: 찜하기
- `access_logs`: 접근 로그
- `provinces`, `regencies`: 인도네시아 지역 데이터

### RLS (Row Level Security) 정책
- 모든 테이블에 RLS 활성화
- 사용자는 자신의 데이터만 수정 가능
- 관리자는 모든 데이터 접근 가능

### 최근 마이그레이션
- `20251015000001_add_paused_status.sql`: 상품 일시중지 상태 추가
- `20251015000002_allow_users_see_own_paused_products.sql`: 사용자가 자신의 중지된 상품 볼 수 있도록 허용
- `20251014212919_remote_schema.sql`: 최신 원격 스키마 동기화

## 개발 명령어

```bash
# 개발 서버 시작
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm start

# Supabase 스키마 동기화
supabase db pull --schema public

# Git 커밋 및 푸시
git add .
git commit -m "메시지"
git push
```

## 주의사항

### 커밋 시
- ALWAYS 사용자가 명시적으로 요청할 때만 커밋
- 커밋 메시지는 한글 또는 영어로 명확하게
- 모든 커밋에 Claude Code 서명 포함

### CSS 수정 시
- ProductCard.css는 카드 컴포넌트의 단일 소스
- 중복 CSS 생성 금지
- 컨텍스트별로 적절한 CSS 파일 사용

### Supabase 작업 시
- 마이그레이션 파일 네이밍: `YYYYMMDD######_description.sql`
- 원격 스키마 변경 후 `supabase db pull` 실행
- RLS 정책 항상 고려

### UI/UX
- 모바일 우선 (Mobile First)
- 인도네시아어 사용 (어드민 제외)
- 다크 테마 기본

## 최근 클린업 (2025-10-15)

### 제거된 항목
- ✅ 테스트 폴더 (`__tests__`, `e2e`)
- ✅ 테스트 설정 파일 (jest, playwright)
- ✅ 임시/백업 파일 (*.bak, *.old)
- ✅ 오래된 문서 (진단, 분석 파일)
- ✅ CSS 중복 정의

### 현재 상태
- 깔끔한 프로젝트 구조
- 최신 Supabase 스키마 동기화 완료
- 과거 축적물 제거 완료
- 새로운 개선 작업 준비 완료

## 문제 해결 참고

### CSS 관련
- 제목 잘림 현상: `line-height`, `padding-bottom` 확인
- 중복 스타일: ProductCard.css 우선 사용

### Supabase 관련
- RLS 에러: 정책 확인, is_admin() 함수 확인
- 마이그레이션 실패: 순서 확인, 기존 정책 DROP 후 CREATE

### 배포 관련
- Vercel 빌드 실패: 환경 변수 확인
- 이미지 로딩 느림: Next.js Image 최적화 사용

---

**마지막 업데이트**: 2025-10-15
**다음 세션 시작 시 이 파일을 먼저 읽으세요!**
