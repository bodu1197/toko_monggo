# 데이터베이스 마이그레이션 가이드

## 개요

이 프로젝트는 **Supabase CLI**를 사용하여 데이터베이스 스키마를 안전하게 관리합니다. 수동으로 SQL을 복사/붙여넣기하는 방식은 더 이상 사용하지 않습니다.

## 전제 조건

1. **Supabase CLI 설치**
   ```bash
   npm install -g supabase
   ```

2. **Docker Desktop 실행** (로컬 개발용)
   - `supabase db pull`과 같은 명령어를 실행하려면 Docker가 필요합니다

## 현재 상태

- **현재 마이그레이션**: `supabase/migrations/20251011211807_remote_schema.sql`
- 이 파일은 Supabase 리모트 데이터베이스에서 가져온 **실제 현재 스키마**입니다
- 모든 테이블, 함수, 트리거, RLS 정책이 포함되어 있습니다

## 워크플로우

### 1. 로컬 개발 환경 시작

```bash
supabase start
```

이 명령어는:
- Docker를 통해 로컬 Supabase 인스턴스를 시작합니다
- `supabase/migrations/` 폴더의 모든 마이그레이션을 자동으로 적용합니다
- 로컬 Studio UI를 `http://localhost:54323`에서 제공합니다

### 2. 스키마 변경하기

#### 옵션 A: 수동으로 마이그레이션 파일 작성

```bash
supabase migration new add_new_column
```

생성된 파일(`supabase/migrations/YYYYMMDDHHMMSS_add_new_column.sql`)에 SQL을 작성:

```sql
-- 예시: products 테이블에 새 컬럼 추가
ALTER TABLE products ADD COLUMN contact_number VARCHAR(20);
```

#### 옵션 B: Supabase Studio에서 변경 후 diff 생성

1. 로컬 Studio에서 테이블을 수정합니다
2. 변경 사항을 마이그레이션 파일로 생성:

```bash
supabase db diff -f add_new_column
```

### 3. 로컬에서 마이그레이션 적용

```bash
supabase db reset
```

이 명령어는:
- 로컬 데이터베이스를 초기화합니다
- 모든 마이그레이션을 순서대로 적용합니다
- Seed 데이터를 로드합니다 (설정된 경우)

### 4. 리모트(프로덕션)에 배포

```bash
supabase db push
```

**주의**: 이 명령어는 프로덕션 데이터베이스를 변경하므로 신중하게 사용하세요.

### 5. 리모트 스키마 가져오기

다른 개발자가 리모트에서 변경한 사항을 가져오려면:

```bash
supabase db pull
```

이 명령어는 현재 리모트 스키마와 로컬 마이그레이션을 비교하여 새 마이그레이션 파일을 생성합니다.

## 주요 명령어 요약

| 명령어 | 설명 |
|--------|------|
| `supabase start` | 로컬 Supabase 시작 (Docker 필요) |
| `supabase stop` | 로컬 Supabase 중지 |
| `supabase status` | 로컬 서비스 상태 확인 |
| `supabase migration new <name>` | 새 마이그레이션 파일 생성 |
| `supabase db diff -f <name>` | 로컬 변경사항으로 마이그레이션 생성 |
| `supabase db reset` | 로컬 DB 초기화 및 마이그레이션 적용 |
| `supabase db push` | 마이그레이션을 리모트에 배포 |
| `supabase db pull` | 리모트 스키마를 로컬로 가져오기 |

## 협업 시나리오

### 시나리오 1: 새로운 기능 추가

1. 로컬 환경 시작: `supabase start`
2. 마이그레이션 생성: `supabase migration new add_feature_x`
3. SQL 작성 및 저장
4. 로컬 테스트: `supabase db reset`
5. Git에 커밋: `git add supabase/migrations/ && git commit -m "Add feature X schema"`
6. 푸시: `git push`
7. 프로덕션 배포: `supabase db push`

### 시나리오 2: 다른 개발자의 변경사항 동기화

1. Git pull: `git pull origin main`
2. 로컬 DB 업데이트: `supabase db reset`

### 시나리오 3: 프로덕션에서 직접 변경된 경우 (긴급)

1. 리모트 스키마 가져오기: `supabase db pull`
2. 생성된 마이그레이션 검토
3. Git에 커밋: `git add supabase/migrations/ && git commit -m "Sync remote changes"`

## 모범 사례

### ✅ 해야 할 것

- 모든 스키마 변경은 **마이그레이션 파일**로 관리하세요
- 마이그레이션 파일은 **절대 수정하지 말고** 새로 생성하세요
- `supabase db reset`으로 로컬에서 먼저 테스트하세요
- 마이그레이션 파일을 **Git에 커밋**하세요
- 배포 전에 팀과 **코드 리뷰**를 하세요

### ❌ 하지 말아야 할 것

- ~~Supabase Dashboard에서 직접 SQL 실행~~ (긴급한 경우 제외)
- ~~마이그레이션 파일을 수정하거나 삭제~~ (이미 적용된 경우)
- ~~`supabase db push`를 테스트 없이 실행~~
- ~~수동으로 SQL을 복사/붙여넣기~~

## 롤백

마이그레이션을 롤백하려면 **새로운 마이그레이션**을 생성하여 역변경을 수행하세요:

```bash
supabase migration new rollback_feature_x
```

```sql
-- 예시: 이전에 추가한 컬럼 제거
ALTER TABLE products DROP COLUMN contact_number;
```

## 문제 해결

### Docker 오류

```
failed to start docker container: Bind for 0.0.0.0:54320 failed: port is already allocated
```

**해결책**: 기존 Supabase 인스턴스를 중지하세요
```bash
supabase stop --project-id tokomonggo
```

### 마이그레이션 충돌

여러 개발자가 동시에 마이그레이션을 생성한 경우, Git에서 충돌이 발생할 수 있습니다. 마이그레이션 파일 이름에 타임스탬프가 포함되어 있으므로, 순서대로 병합하세요.

## 추가 리소스

- [Supabase CLI 공식 문서](https://supabase.com/docs/guides/cli)
- [로컬 개발 가이드](https://supabase.com/docs/guides/local-development)
- [마이그레이션 가이드](https://supabase.com/docs/guides/cli/managing-migrations)
