# 🔐 Supabase 접속 가이드

## 📌 프로젝트 정보

| 항목             | 값                                         |
| ---------------- | ------------------------------------------ |
| **Project Name** | TokoMonggo                                 |
| **Project Ref**  | `tshngfzijqfuplzvmpoc`                     |
| **Project URL**  | `https://tshngfzijqfuplzvmpoc.supabase.co` |
| **Region**       | Southeast Asia (Singapore)                 |

---

## 🌐 Supabase Dashboard 접속

### URL

```
https://supabase.com/dashboard/project/tshngfzijqfuplzvmpoc
```

### 주요 페이지 바로가기

- **SQL Editor**: https://supabase.com/dashboard/project/tshngfzijqfuplzvmpoc/sql/new
- **Table Editor**: https://supabase.com/dashboard/project/tshngfzijqfuplzvmpoc/editor
- **Storage**: https://supabase.com/dashboard/project/tshngfzijqfuplzvmpoc/storage/buckets
- **Authentication**: https://supabase.com/dashboard/project/tshngfzijqfuplzvmpoc/auth/users
- **Settings > API**: https://supabase.com/dashboard/project/tshngfzijqfuplzvmpoc/settings/api

---

## 🔑 API 키 위치

1. Dashboard → **Settings** → **API**
2. 다음 키들을 확인할 수 있습니다:
   - `anon public` - 클라이언트용 (공개 가능)
   - `service_role` - 서버용 (**절대 공개 금지!**)

---

## 📁 환경변수 설정 (.env.local)

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://tshngfzijqfuplzvmpoc.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

⚠️ **주의**: `.env.local` 파일은 절대 Git에 커밋하지 마세요!

---

## 💻 JavaScript/TypeScript에서 접속

### 클라이언트 사이드 (브라우저)

```javascript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
```

### 서버 사이드 (Admin 권한)

```javascript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

---

## 🗄️ 데이터베이스 직접 연결 (PostgreSQL)

### 연결 문자열 형식

```
postgresql://postgres.[PROJECT_REF]:[DB_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### 예시 (실제 비밀번호 필요)

```
postgresql://postgres.tshngfzijqfuplzvmpoc:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

⚠️ 연결 정보는 **Dashboard → Settings → Database** 에서 확인

---

## 📦 Storage 버킷

| 버킷 이름         | 용도          | 공개 여부 |
| ----------------- | ------------- | --------- |
| `product-images`  | 상품 이미지   | Public    |
| `profile-avatars` | 프로필 이미지 | Public    |

---

## 🔧 자주 사용하는 SQL

### 테이블 목록 확인

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
```

### 특정 테이블 컬럼 확인

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products';
```

---

## 📅 생성일

- **마이그레이션 완료일**: 2025-12-17
- **이전 프로젝트 Ref**: `zthksbitvezxwhbymatz` (삭제됨)

---

## 🆘 문제 해결

### "Tenant or user not found" 오류

- Region이 올바른지 확인 (ap-southeast-1 = Singapore)
- Project Ref가 정확한지 확인

### 이미지가 안 보일 때

- Storage 버킷이 Public인지 확인
- RLS 정책 확인

### API 호출 실패

- ANON_KEY가 올바른지 확인
- CORS 설정 확인 (Dashboard → Settings → API)
