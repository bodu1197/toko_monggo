# Gemini 프로젝트 점검 보고서

이 문서는 프로젝트의 문제점, 개선 사항 및 권장 사항을 기록합니다.

---

## 2025년 10월 12일 점검

### 1. ESLint 설정 누락 (해결됨)

- **문제:** 프로젝트에 ESLint 설정이 되어있지 않아 코드 품질 관리가 이루어지지 않고 있었습니다.
- **조치:** `.eslintrc.json` 파일을 생성하고, `eslint` 및 `eslint-config-next` 패키지를 설치하여 기본 설정을 완료했습니다.

### 2. React Hook 의존성 문제

- **문제점:** 다수의 컴포넌트에서 `useEffect` Hook의 의존성 배열이 누락되어, 데이터 불일치 및 버그 발생 위험이 있습니다. (Rule: `react-hooks/exhaustive-deps`)
- **해당 파일:**
  - `app/admin/page.jsx`
  - `app/components/LocationTracker.jsx`
  - `app/page.jsx`
  - `app/products/new/page.jsx`
  - `app/products/[id]/edit/page.jsx`
  - `app/products/[id]/page.jsx`
  - `app/profile/page.jsx`
  - `app/reset-password/page.jsx`
- **권장 사항:** 각 `useEffect`의 의존성 배열에 누락된 변수나 함수를 추가하거나, `useCallback`을 사용하여 함수를 메모이제이션해야 합니다.

### 3. 이미지 최적화 미흡

- **문제점:** Next.js의 `<Image>` 컴포넌트 대신 일반 `<img>` 태그를 사용하여 페이지 로딩 속도 저하 및 대역폭 낭비를 유발하고 있습니다. (Rule: `@next/next/no-img-element`)
- **해당 파일:**
  - `app/admin/page.jsx`
  - `app/products/new/page.jsx`
  - `app/products/[id]/edit/page.jsx`
- **권장 사항:** 성능 향상을 위해 `<img>` 태그를 Next.js의 `<Image>` 컴포넌트로 교체해야 합니다.

### 4. 불필요한 백업 폴더 존재

- **문제점:** `src_backup_vite` 폴더는 현재 프로젝트와 관련 없는 이전 버전의 소스 코드로 보입니다.
- **권장 사항:** 프로젝트를 깔끔하게 유지하고 혼동을 피하기 위해 해당 폴더를 삭제하는 것이 좋습니다.

---
