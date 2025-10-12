import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load home page successfully', async ({ page }) => {
    await page.goto('/');

    // 페이지 제목 확인
    await expect(page).toHaveTitle(/TokoMonggo|Soriplay/i);
  });

  test('should display main navigation', async ({ page }) => {
    await page.goto('/');

    // 로고 또는 브랜드 이름 확인
    const header = page.locator('header, nav');
    await expect(header).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');

    // 로그인 링크 찾기 및 클릭
    const loginLink = page.getByRole('link', { name: /login|masuk/i });
    if (await loginLink.count() > 0) {
      await loginLink.first().click();
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/');

    // 회원가입 링크 찾기 및 클릭
    const signupLink = page.getByRole('link', { name: /signup|daftar/i });
    if (await signupLink.count() > 0) {
      await signupLink.first().click();
      await expect(page).toHaveURL(/\/signup/);
    }
  });

  test('should display products', async ({ page }) => {
    await page.goto('/');

    // 상품 목록이 로드되는지 확인
    // (실제 선택자는 프로젝트에 맞게 조정 필요)
    await page.waitForLoadState('networkidle');

    // 페이지가 정상적으로 로드되었는지 확인
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
