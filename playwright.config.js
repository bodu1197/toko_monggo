import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 테스트 설정
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  // 병렬 실행 설정
  fullyParallel: true,

  // CI 환경에서 실패 시 재시도
  retries: process.env.CI ? 2 : 0,

  // 워커 수 (CI에서는 1개로 제한)
  workers: process.env.CI ? 1 : undefined,

  // 리포터 설정
  reporter: [
    ['html'],
    ['list'],
    ...(process.env.CI ? [['github']] : [])
  ],

  // 공통 설정
  use: {
    // 베이스 URL
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // 스크린샷 및 비디오
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    // 타임아웃
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // 프로젝트별 설정
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // 모바일 테스트
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // 로컬 개발 서버 자동 시작
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
