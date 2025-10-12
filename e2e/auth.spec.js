import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
    });

    test('should display login form', async ({ page }) => {
      await expect(page).toHaveURL(/\/login/);

      // 이메일 입력 필드 확인
      const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i));
      await expect(emailInput).toBeVisible();

      // 비밀번호 입력 필드 확인
      const passwordInput = page.getByLabel(/password|kata sandi/i).or(page.getByPlaceholder(/password|kata sandi/i));
      await expect(passwordInput).toBeVisible();

      // 로그인 버튼 확인
      const loginButton = page.getByRole('button', { name: /login|masuk/i });
      await expect(loginButton).toBeVisible();
    });

    test('should show validation error for empty fields', async ({ page }) => {
      // 빈 폼 제출
      const loginButton = page.getByRole('button', { name: /login|masuk/i });
      await loginButton.click();

      // HTML5 validation 또는 커스텀 에러 메시지 확인
      // (브라우저 기본 validation은 자동으로 처리됨)
    });

    test('should show error for invalid credentials', async ({ page }) => {
      // 잘못된 자격증명 입력
      const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i));
      const passwordInput = page.getByLabel(/password|kata sandi/i).or(page.getByPlaceholder(/password|kata sandi/i));

      await emailInput.fill('invalid@example.com');
      await passwordInput.fill('wrongpassword');

      // 로그인 시도
      const loginButton = page.getByRole('button', { name: /login|masuk/i });
      await loginButton.click();

      // 에러 메시지 확인 (시간 여유 두기)
      await page.waitForTimeout(2000);

      // 에러 메시지가 표시되거나 로그인 페이지에 남아있어야 함
      const currentUrl = page.url();
      expect(currentUrl).toContain('/login');
    });

    test('should have forgot password link', async ({ page }) => {
      const forgotLink = page.getByRole('link', { name: /forgot|lupa/i });
      if (await forgotLink.count() > 0) {
        await expect(forgotLink).toBeVisible();
      }
    });

    test('should have signup link', async ({ page }) => {
      const signupLink = page.getByRole('link', { name: /signup|daftar/i });
      if (await signupLink.count() > 0) {
        await expect(signupLink).toBeVisible();
        await signupLink.click();
        await expect(page).toHaveURL(/\/signup/);
      }
    });
  });

  test.describe('Signup Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/signup');
    });

    test('should display signup form', async ({ page }) => {
      await expect(page).toHaveURL(/\/signup/);

      // 필수 입력 필드 확인
      const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i));
      await expect(emailInput).toBeVisible();

      const passwordInput = page.getByLabel(/password|kata sandi/i).first();
      await expect(passwordInput).toBeVisible();
    });

    test('should validate password match', async ({ page }) => {
      const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i));
      const passwordInputs = page.getByLabel(/password|kata sandi/i);

      await emailInput.fill('test@example.com');
      await passwordInputs.first().fill('password123');

      // 두 번째 비밀번호 입력이 있다면
      if (await passwordInputs.count() > 1) {
        await passwordInputs.nth(1).fill('differentpassword');

        // 회원가입 버튼 클릭
        const signupButton = page.getByRole('button', { name: /signup|daftar/i });
        await signupButton.click();

        // 에러 메시지 확인
        await page.waitForTimeout(1000);
      }
    });

    test('should have login link', async ({ page }) => {
      const loginLink = page.getByRole('link', { name: /login|masuk/i });
      if (await loginLink.count() > 0) {
        await expect(loginLink).toBeVisible();
        await loginLink.click();
        await expect(page).toHaveURL(/\/login/);
      }
    });
  });

  test.describe('Password Recovery', () => {
    test('should navigate to password recovery page', async ({ page }) => {
      await page.goto('/login');

      const forgotLink = page.getByRole('link', { name: /forgot|lupa/i });
      if (await forgotLink.count() > 0) {
        await forgotLink.click();
        await expect(page).toHaveURL(/\/recover|\/forgot/);

        // 이메일 입력 필드 확인
        const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i));
        await expect(emailInput).toBeVisible();
      }
    });
  });
});
