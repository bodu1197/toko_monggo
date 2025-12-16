# 🚀 TokoMonggo Supabase 마이그레이션 가이드

## 📋 개요

이 가이드는 기존 Supabase 프로젝트를 새로운 계정/프로젝트로 완전히 이전하는 방법을 설명합니다.

### 예상 소요 시간

- 소규모 (100개 미만 상품): 30분 ~ 1시간
- 중규모 (1,000개 미만 상품): 1 ~ 2시간
- 대규모 (1,000개 이상 상품): 2 ~ 4시간

---

## 📦 1단계: 기존 프로젝트 백업

### 1.1 데이터베이스 백업 (자동)

```powershell
# 프로젝트 루트에서 실행
node scripts/backup-supabase-data.js
```

**결과물:**

- `backups/YYYY-MM-DD/` 폴더에 모든 테이블의 JSON/SQL 파일
- `_storage_info.json` - Storage 파일 목록
- `_RESTORE_ORDER.sql` - 복원 순서 가이드

### 1.2 스키마 백업 (이미 완료)

이미 `supabase/current_schema.sql`에 전체 스키마가 저장되어 있습니다.

### 1.3 Storage 이미지 백업 (수동)

> ⚠️ 이미지는 수동으로 다운로드해야 합니다.

1. [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. **Storage** 메뉴 클릭
3. 각 버킷별로:
   - `product-images` 버킷 → 전체 다운로드
   - `profile-avatars` 버킷 → 전체 다운로드

**팁:** 파일이 많으면 Supabase CLI 사용:

```powershell
# 로그인
npx supabase login

# 프로젝트 링크
npx supabase link --project-ref YOUR_PROJECT_REF

# Storage 다운로드 (수동으로 해야 함)
# 현재 CLI에서 bulk download는 지원되지 않아 대시보드 사용 권장
```

### 1.4 Auth 사용자 목록 기록 (수동)

1. Supabase 대시보드 → **Authentication** → **Users**
2. 사용자 목록 스크린샷 또는 Export (있는 경우)

> ⚠️ **중요:** Auth 사용자는 자동 마이그레이션이 불가능합니다.
> 새 계정에서 사용자들이 다시 가입하거나, 비밀번호 재설정을 안내해야 합니다.

---

## 🆕 2단계: 새 Supabase 프로젝트 생성

### 2.1 새 프로젝트 생성

1. [Supabase](https://supabase.com) 접속 (새 계정으로)
2. **New Project** 클릭
3. 설정:
   - **Name:** tokomonggo (또는 원하는 이름)
   - **Database Password:** 강력한 비밀번호 설정 (저장해두기!)
   - **Region:** Southeast Asia (Singapore) 권장
   - **Pricing Plan:** Free 또는 Pro

### 2.2 프로젝트 정보 기록

새 프로젝트가 생성되면 다음 정보를 기록:

```
Project URL: https://xxxxx.supabase.co
Anon Key: eyJ...
Service Role Key: eyJ... (Settings → API에서 확인)
```

---

## 🗄️ 3단계: 데이터베이스 스키마 적용

### 3.1 스키마 적용

1. 새 Supabase 대시보드 → **SQL Editor**
2. `supabase/current_schema.sql` 파일 내용 복사
3. SQL Editor에 붙여넣기
4. **Run** 클릭

> ⚠️ 오류 발생 시: 일부 extension은 Pro 플랜에서만 사용 가능할 수 있습니다.

### 3.2 마이그레이션 파일 적용 (선택사항)

스키마에 누락된 부분이 있으면:

```powershell
# 마이그레이션 폴더의 파일들을 순서대로 적용
# supabase/migrations/ 폴더 참조
```

---

## 📥 4단계: 데이터 복원

### 4.1 기초 데이터 복원 (순서 중요!)

SQL Editor에서 아래 순서로 실행:

```sql
-- 1. 지역 데이터
-- backups/YYYY-MM-DD/provinces.sql 내용 실행
-- backups/YYYY-MM-DD/regencies.sql 내용 실행

-- 2. 카테고리
-- backups/YYYY-MM-DD/categories.sql 내용 실행
```

### 4.2 사용자 프로필 복원

```sql
-- profiles.sql 실행
-- ⚠️ 주의: auth.users와 연결이 끊어진 상태
-- 새로 가입한 사용자의 UUID가 일치해야 함
```

### 4.3 상품 데이터 복원

```sql
-- 1. products.sql 실행
-- 2. product_images.sql 실행
-- 3. product_comments.sql 실행
```

### 4.4 나머지 데이터 복원

```sql
-- favorites.sql
-- view_history.sql
-- advertisements.sql (있는 경우)
-- push_subscriptions.sql (있는 경우)
```

---

## 📸 5단계: Storage 설정 및 이미지 업로드

### 5.1 Storage 버킷 생성

1. 새 대시보드 → **Storage**
2. **New Bucket** 클릭

**product-images 버킷:**

```
Name: product-images
Public: ✅ Yes
File size limit: 5MB
Allowed MIME types: image/jpeg, image/png, image/webp
```

**profile-avatars 버킷:**

```
Name: profile-avatars
Public: ✅ Yes
File size limit: 2MB
Allowed MIME types: image/jpeg, image/png, image/webp
```

### 5.2 Storage 정책 설정

SQL Editor에서 실행:

```sql
-- product-images 정책
CREATE POLICY "Anyone can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own product images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- profile-avatars 정책
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

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 5.3 이미지 업로드

1. 백업한 이미지 폴더를 Storage에 업로드
2. 대시보드에서 드래그 앤 드롭으로 업로드 가능

---

## 🔐 6단계: 인증 설정

### 6.1 이메일 인증 설정

1. **Authentication** → **Providers** → **Email**
2. 설정:
   - Enable Email Signup: ✅
   - Confirm email: ✅
   - Secure email change: ✅

### 6.2 소셜 로그인 설정 (사용하는 경우)

**Google OAuth:**

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. OAuth 2.0 클라이언트 설정
3. Authorized redirect URIs 추가:
   ```
   https://YOUR_NEW_PROJECT.supabase.co/auth/v1/callback
   ```
4. Supabase Dashboard → Authentication → Providers → Google
5. Client ID 및 Secret 입력

**Kakao OAuth:**

1. [Kakao Developers](https://developers.kakao.com) 접속
2. 앱 설정 → 플랫폼 → Redirect URI 추가:
   ```
   https://YOUR_NEW_PROJECT.supabase.co/auth/v1/callback
   ```
3. Supabase Dashboard → Authentication → Providers → Kakao 설정

---

## ⚙️ 7단계: 애플리케이션 설정 업데이트

### 7.1 환경 변수 업데이트

`.env.local` 파일 수정:

```env
# 새 Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_NEW_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_NEW_ANON_KEY

# Service Role Key (서버사이드에서만 사용)
SUPABASE_SERVICE_ROLE_KEY=YOUR_NEW_SERVICE_ROLE_KEY

# VAPID Keys (변경 없음)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

### 7.2 Vercel 환경 변수 업데이트 (배포용)

1. [Vercel Dashboard](https://vercel.com) 접속
2. 프로젝트 선택 → **Settings** → **Environment Variables**
3. 다음 변수들 업데이트:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 7.3 재배포

```powershell
git add .
git commit -m "chore: update Supabase configuration for new project"
git push
```

---

## ✅ 8단계: 검증

### 8.1 로컬 테스트

```powershell
npm run dev
```

확인 항목:

- [ ] 홈페이지 로딩
- [ ] 상품 목록 표시
- [ ] 상품 이미지 표시
- [ ] 로그인/회원가입
- [ ] 상품 등록
- [ ] 댓글 작성
- [ ] 찜하기 기능

### 8.2 프로덕션 테스트

배포 후 동일한 항목 테스트

---

## 🔧 문제 해결

### 이미지가 표시되지 않음

1. Storage 버킷이 Public인지 확인
2. 이미지 URL이 새 Supabase URL을 가리키는지 확인
3. product_images 테이블의 image_url 업데이트 필요할 수 있음:

```sql
UPDATE product_images
SET image_url = REPLACE(
  image_url,
  'OLD_SUPABASE_URL',
  'NEW_SUPABASE_URL'
);
```

### RLS 오류 발생

```sql
-- RLS가 활성화되어 있는지 확인
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- 필요한 정책이 있는지 확인
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### 외래 키 오류

데이터 복원 순서가 잘못되었을 수 있음. 의존성 순서:

1. provinces → regencies
2. categories
3. profiles (auth.users 필요)
4. products
5. product_images, product_comments, favorites, view_history

---

## 📞 지원

문제가 발생하면:

1. Supabase 공식 문서: https://supabase.com/docs
2. Supabase Discord: https://discord.supabase.com
3. GitHub Issues

---

## 📝 체크리스트

### 백업 완료

- [ ] `node scripts/backup-supabase-data.js` 실행
- [ ] Storage 이미지 다운로드
- [ ] Auth 사용자 목록 기록

### 새 프로젝트 설정

- [ ] 새 Supabase 프로젝트 생성
- [ ] 스키마 적용
- [ ] Storage 버킷 생성
- [ ] Storage 정책 설정

### 데이터 복원

- [ ] provinces, regencies 복원
- [ ] categories 복원
- [ ] profiles 복원
- [ ] products 복원
- [ ] product_images 복원
- [ ] product_comments 복원
- [ ] favorites, view_history 복원
- [ ] 이미지 업로드

### 인증 설정

- [ ] 이메일 인증 설정
- [ ] 소셜 로그인 설정 (사용 시)
- [ ] Redirect URL 업데이트

### 애플리케이션 설정

- [ ] .env.local 업데이트
- [ ] Vercel 환경 변수 업데이트
- [ ] 재배포

### 검증

- [ ] 로컬 테스트 완료
- [ ] 프로덕션 테스트 완료
