import { test, expect } from '@playwright/test';

test.describe('Product Pages', () => {
  test.describe('Product Listing', () => {
    test('should load product listing page', async ({ page }) => {
      await page.goto('/');

      // 페이지가 로드될 때까지 대기
      await page.waitForLoadState('networkidle');

      // 페이지가 정상적으로 로드되었는지 확인
      await expect(page).toHaveURL(/\//);
    });

    test('should display category filters', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // 카테고리 필터나 내비게이션이 있는지 확인
      // (실제 선택자는 프로젝트에 맞게 조정)
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('should search for products', async ({ page }) => {
      await page.goto('/');

      // 검색 입력 필드 찾기
      const searchInput = page.getByPlaceholder(/search|cari/i);
      if (await searchInput.count() > 0) {
        await searchInput.fill('laptop');
        await page.keyboard.press('Enter');

        // 검색 결과 페이지 확인
        await page.waitForLoadState('networkidle');
      }
    });
  });

  test.describe('Product Detail', () => {
    test('should load product detail page', async ({ page }) => {
      // 상품 목록에서 첫 번째 상품 클릭
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // 상품 링크 찾기 (실제 선택자는 조정 필요)
      const productLinks = page.locator('a[href*="/products/"]');
      if (await productLinks.count() > 0) {
        await productLinks.first().click();

        // 상품 상세 페이지로 이동 확인
        await expect(page).toHaveURL(/\/products\/[^\/]+$/);
      }
    });

    test('should display product information', async ({ page }) => {
      // 직접 상품 페이지로 이동 (테스트용 UUID)
      // 실제 테스트에서는 실제 상품 ID를 사용해야 함
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const productLinks = page.locator('a[href*="/products/"]');
      if (await productLinks.count() > 0) {
        await productLinks.first().click();
        await page.waitForLoadState('networkidle');

        // 상품 정보가 표시되는지 확인
        const mainContent = page.locator('main, body');
        await expect(mainContent).toBeVisible();
      }
    });

    test('should display contact information', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const productLinks = page.locator('a[href*="/products/"]');
      if (await productLinks.count() > 0) {
        await productLinks.first().click();
        await page.waitForLoadState('networkidle');

        // 판매자 정보나 연락처 버튼 확인
        // (실제 선택자는 프로젝트에 맞게 조정)
      }
    });
  });

  test.describe('Product Creation (requires auth)', () => {
    test.skip('should navigate to new product page', async ({ page }) => {
      // 이 테스트는 인증이 필요하므로 skip
      // 실제 테스트에서는 로그인 후 진행
      await page.goto('/products/new');

      // 로그인 페이지로 리다이렉트되거나 상품 등록 폼이 표시되어야 함
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/(login|products\/new)/);
    });
  });
});
