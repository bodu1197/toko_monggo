# ✅ TokoMonggo 프로덕션 배포 체크리스트

## 📋 배포 전 필수 확인 사항

### 1. 코드 품질

- [ ] ESLint 오류 없음: `npm run lint`
- [ ] 빌드 성공: `npm run build`
- [ ] 타입 오류 없음 (TypeScript 사용 시)
- [ ] 콘솔 로그 제거 (개발용 console.log)
- [ ] 하드코딩된 값 제거 (API 키, URL 등)

### 2. 환경 변수 설정

#### 필수 환경 변수 (.env.local / Vercel)

```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
⚠️ SUPABASE_SERVICE_ROLE_KEY (서버사이드 전용, 절대 노출 금지)
```

#### 선택 환경 변수

```
☐ NEXT_PUBLIC_VAPID_PUBLIC_KEY (푸시 알림)
☐ VAPID_PRIVATE_KEY (푸시 알림)
☐ VAPID_EMAIL
☐ SENTRY_DSN (에러 트래킹)
☐ ROLLBAR_ACCESS_TOKEN (에러 트래킹)
☐ UPSTASH_REDIS_REST_URL (Rate Limiting)
☐ UPSTASH_REDIS_REST_TOKEN (Rate Limiting)
```

### 3. Supabase 설정

#### 데이터베이스

- [ ] 모든 마이그레이션 적용 완료
- [ ] RLS (Row Level Security) 활성화 확인
- [ ] 필요한 인덱스 생성 확인
- [ ] 데이터베이스 백업 설정 (Pro 플랜)

#### Authentication

- [ ] 이메일 인증 설정
- [ ] 소셜 로그인 설정 (Google, Kakao 등)
- [ ] Redirect URL 프로덕션 도메인으로 설정
- [ ] 비밀번호 정책 설정

#### Storage

- [ ] product-images 버킷 생성 및 정책 설정
- [ ] profile-avatars 버킷 생성 및 정책 설정
- [ ] 파일 크기 제한 설정

#### Edge Functions (사용 시)

- [ ] 함수 배포 완료
- [ ] 환경 변수 설정

### 4. 외부 서비스 설정

#### Google OAuth (사용 시)

- [ ] Google Cloud Console에서 OAuth 클라이언트 설정
- [ ] 프로덕션 도메인 Authorized redirect URIs에 추가:
  ```
  https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback
  ```
- [ ] Authorized JavaScript origins에 도메인 추가

#### Kakao OAuth (사용 시)

- [ ] Kakao Developers에서 앱 설정
- [ ] Redirect URI에 프로덕션 URL 추가
- [ ] 동의항목 설정 확인

#### Sentry (에러 트래킹)

- [ ] 프로젝트 생성
- [ ] DSN 환경 변수 설정
- [ ] Source Maps 업로드 설정

### 5. 성능 최적화

#### 이미지 최적화

- [ ] Next.js Image 컴포넌트 사용
- [ ] 적절한 이미지 크기 설정
- [ ] WebP 형식 지원

#### 번들 최적화

- [ ] 동적 임포트 적용 (code splitting)
- [ ] 불필요한 의존성 제거
- [ ] Tree shaking 확인

#### 캐싱

- [ ] 정적 자산 캐시 헤더 설정
- [ ] API 응답 캐싱 (필요시)
- [ ] Vercel Edge Functions 고려

### 6. SEO

- [ ] 메타 태그 설정 (title, description)
- [ ] Open Graph 태그 설정
- [ ] robots.txt 파일 설정
- [ ] sitemap.xml 생성
- [ ] 구조화된 데이터 (Schema.org)

### 7. 보안

#### 헤더 설정 (next.config.mjs 또는 vercel.json)

- [ ] Content-Security-Policy
- [ ] X-Frame-Options
- [ ] X-Content-Type-Options
- [ ] Referrer-Policy
- [ ] Permissions-Policy

#### API 보안

- [ ] Rate Limiting 설정
- [ ] CORS 설정
- [ ] 입력값 검증

#### 인증 보안

- [ ] HTTPS 강제
- [ ] Secure 쿠키 설정
- [ ] CSRF 보호

---

## 🚀 배포 절차

### 1. 최종 빌드 테스트

```powershell
npm run build
npm run start
```

### 2. Git 커밋 및 푸시

```powershell
git add .
git commit -m "chore: prepare for production deployment"
git push origin main
```

### 3. Vercel 배포 확인

1. Vercel Dashboard에서 배포 상태 확인
2. Build 로그 검토
3. 프리뷰 URL에서 테스트

### 4. 도메인 설정 (첫 배포 시)

1. Vercel → Project Settings → Domains
2. 커스텀 도메인 추가
3. DNS 레코드 설정

---

## 🧪 배포 후 테스트 체크리스트

### 기능 테스트

- [ ] 홈페이지 정상 로딩
- [ ] 상품 목록 표시
- [ ] 상품 상세 페이지
- [ ] 상품 검색
- [ ] 위치 기반 검색
- [ ] 회원가입
- [ ] 로그인 (이메일)
- [ ] 소셜 로그인 (Google/Kakao)
- [ ] 상품 등록
- [ ] 상품 수정/삭제
- [ ] 이미지 업로드
- [ ] 댓글 작성
- [ ] 찜하기
- [ ] 프로필 수정
- [ ] 로그아웃

### 성능 테스트

- [ ] Google PageSpeed Insights 점수 확인
  - 목표: 모바일 70+, 데스크탑 90+
- [ ] Lighthouse 감사
- [ ] Core Web Vitals 확인
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1

### 모바일 테스트

- [ ] 반응형 디자인 확인
- [ ] 터치 인터랙션
- [ ] 모바일 카테고리 네비게이션

---

## 🔧 롤백 절차

문제 발생 시:

### Vercel 롤백

1. Vercel Dashboard → Deployments
2. 이전 성공한 배포 선택
3. "..." 메뉴 → "Promote to Production"

### Git 롤백

```powershell
# 이전 커밋으로 되돌리기
git revert HEAD
git push origin main

# 또는 특정 커밋으로 리셋 (주의!)
git reset --hard COMMIT_HASH
git push -f origin main
```

### 데이터베이스 롤백

1. Supabase Dashboard → Database → Backups (Pro 플랜)
2. Point-in-time recovery 사용

---

## 📊 모니터링 설정

### 필수 모니터링

- [ ] Vercel Analytics 활성화
- [ ] Supabase Dashboard 모니터링
- [ ] 에러 트래킹 (Sentry/Rollbar)

### 권장 모니터링

- [ ] Uptime 모니터링 (UptimeRobot 등)
- [ ] 성능 모니터링 (Vercel Speed Insights)
- [ ] 로그 분석

---

## 📞 비상 연락처

- Supabase 상태: https://status.supabase.com
- Vercel 상태: https://www.vercel-status.com
- 긴급 문의: [팀 연락처 추가]

---

## 📅 정기 유지보수 작업

### 주간

- [ ] 에러 로그 검토
- [ ] 성능 메트릭 확인
- [ ] 사용자 피드백 검토

### 월간

- [ ] 의존성 업데이트: `npm outdated`
- [ ] 보안 취약점 스캔: `npm audit`
- [ ] 데이터베이스 최적화 (VACUUM ANALYZE)
- [ ] 백업 확인

### 분기별

- [ ] 전체 보안 감사
- [ ] 성능 최적화 검토
- [ ] 기능 사용 통계 분석
