# GitHub Actions CI/CD 설정 가이드

이 디렉토리에는 프로젝트의 CI/CD 파이프라인 워크플로우가 포함되어 있습니다.

## 워크플로우 목록

### 1. CI Pipeline (`ci.yml`)
**트리거**: Push 또는 Pull Request (main, develop 브랜치)

**수행 작업**:
- ✅ ESLint 실행
- ✅ 단위 테스트 실행 (Node.js 18, 20 매트릭스)
- ✅ 코드 커버리지 생성 및 Codecov 업로드
- ✅ Next.js 빌드
- ✅ TypeScript 타입 체크 (TS 파일이 있는 경우)
- ✅ 보안 감사 (npm audit)

**필요한 Secrets**:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase Anonymous Key
- `CODECOV_TOKEN` (선택사항) - Codecov 토큰

### 2. Deploy Pipeline (`deploy.yml`)
**트리거**: main 브랜치로 Push 또는 수동 실행

**수행 작업**:
- ✅ 테스트 실행
- ✅ 프로덕션 빌드
- ✅ Vercel에 자동 배포

**필요한 Secrets**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `VERCEL_TOKEN` - Vercel 배포 토큰
- `VERCEL_ORG_ID` - Vercel 조직 ID
- `VERCEL_PROJECT_ID` - Vercel 프로젝트 ID

### 3. Database Migration (`database-migration.yml`)
**트리거**: 수동 실행 (workflow_dispatch)

**수행 작업**:
- ✅ Supabase CLI 설치
- ✅ 프로젝트 연결
- ✅ 마이그레이션 실행
- ✅ 마이그레이션 검증

**필요한 Secrets**:
- `SUPABASE_PROJECT_REF` - Supabase 프로젝트 참조 ID
- `SUPABASE_ACCESS_TOKEN` - Supabase Personal Access Token
- `SUPABASE_DB_PASSWORD` - 데이터베이스 비밀번호

**환경 선택**:
- `staging` - 스테이징 환경
- `production` - 프로덕션 환경

## Secrets 설정 방법

### 1. GitHub Secrets 추가

Repository Settings → Secrets and variables → Actions → New repository secret

### 2. 필수 Secrets

#### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_ACCESS_TOKEN=your-access-token
SUPABASE_DB_PASSWORD=your-db-password
```

**Supabase Access Token 생성 방법**:
1. https://supabase.com/dashboard/account/tokens 접속
2. "Generate new token" 클릭
3. 토큰 이름 입력 후 생성
4. 생성된 토큰을 복사하여 GitHub Secrets에 추가

#### Vercel
```
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id
```

**Vercel Token 생성 방법**:
1. https://vercel.com/account/tokens 접속
2. "Create Token" 클릭
3. 토큰 이름 입력 후 생성
4. 생성된 토큰을 복사하여 GitHub Secrets에 추가

**Vercel IDs 확인 방법**:
```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 프로젝트 링크 및 ID 확인
vercel link

# .vercel/project.json 파일에서 확인
cat .vercel/project.json
```

#### Codecov (선택사항)
```
CODECOV_TOKEN=your-codecov-token
```

https://codecov.io/ 에서 토큰 생성

### 3. Environment 설정

Repository Settings → Environments

**production 환경 생성**:
- Protection rules 설정 (예: 승인 필요)
- Environment secrets 추가

**staging 환경 생성**:
- 스테이징용 Supabase 프로젝트 Secrets 추가

## 워크플로우 사용법

### CI Pipeline (자동 실행)
```bash
# main 또는 develop 브랜치에 push하면 자동 실행
git push origin main

# Pull Request 생성 시 자동 실행
gh pr create --base main --head feature-branch
```

### Deploy (자동 배포)
```bash
# main 브랜치에 머지되면 자동 배포
git checkout main
git merge feature-branch
git push origin main
```

### Deploy (수동 배포)
1. GitHub Repository → Actions 탭
2. "Deploy to Production" 워크플로우 선택
3. "Run workflow" 버튼 클릭

### Database Migration (수동 실행)
1. GitHub Repository → Actions 탭
2. "Database Migration" 워크플로우 선택
3. "Run workflow" 버튼 클릭
4. Environment 선택 (staging 또는 production)
5. "Run workflow" 버튼 클릭

## 워크플로우 상태 확인

### 배지 추가 (README.md)
```markdown
![CI](https://github.com/your-username/tokomonggo/actions/workflows/ci.yml/badge.svg)
![Deploy](https://github.com/your-username/tokomonggo/actions/workflows/deploy.yml/badge.svg)
```

### 워크플로우 로그
1. GitHub Repository → Actions 탭
2. 실행된 워크플로우 클릭
3. 각 Job의 로그 확인

## 문제 해결

### 빌드 실패
```bash
# 로컬에서 재현
npm ci
npm run lint
npm test
npm run build
```

### 테스트 실패
```bash
# 특정 테스트만 실행
npm test -- __tests__/specific-test.test.js
```

### 배포 실패
- Vercel 토큰이 만료되지 않았는지 확인
- 환경 변수가 올바르게 설정되었는지 확인
- Vercel 대시보드에서 프로젝트 상태 확인

### 마이그레이션 실패
- Supabase Access Token이 유효한지 확인
- 마이그레이션 파일이 올바른지 로컬에서 먼저 테스트
- `supabase db pull`로 현재 스키마 확인

## 로컬 개발과의 연동

### 브랜치 전략
```
main (production)
  └── develop (staging)
        └── feature/* (개발)
```

### 권장 워크플로우
1. `feature/*` 브랜치에서 개발
2. PR을 `develop`으로 생성 → CI 실행
3. 리뷰 후 `develop`으로 머지
4. `develop`을 테스트 후 `main`으로 PR 생성
5. `main` 머지 시 자동 프로덕션 배포

## 추가 개선 사항

- [ ] E2E 테스트 추가
- [ ] 성능 모니터링 (Lighthouse CI)
- [ ] Slack/Discord 알림 연동
- [ ] 자동 릴리즈 노트 생성
- [ ] 롤백 워크플로우 추가
