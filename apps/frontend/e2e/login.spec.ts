import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the login page with correct heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /ProcessFlow Pro/i })).toBeVisible();
  });

  test('should show login form elements', async ({ page }) => {
    await expect(page.getByText(/Anmeldung/i)).toBeVisible();
    await expect(page.getByLabel(/E-Mail-Adresse/i)).toBeVisible();
    await expect(page.getByLabel(/Passwort/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Anmelden/i })).toBeVisible();
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    // Should be redirected back to login (root route)
    await expect(page.getByText(/Anmeldung/i)).toBeVisible();
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    await page.getByLabel(/E-Mail-Adresse/i).fill('wrong@example.com');
    await page.getByLabel(/Passwort/i).fill('wrongpassword');
    await page.getByRole('button', { name: /Anmelden/i }).click();

    // Wait for error message to appear
    await expect(page.getByText(/Ungültige E-Mail oder Passwort/i)).toBeVisible({ timeout: 5000 });
  });

  test('should keep submit button enabled when form is empty', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /Anmelden/i });
    await expect(submitButton).toBeEnabled();
    await expect(submitButton).toBeVisible();
  });

  test('should accept input in email and password fields', async ({ page }) => {
    const emailInput = page.getByLabel(/E-Mail-Adresse/i);
    const passwordInput = page.getByLabel(/Passwort/i);

    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');

    await expect(emailInput).toHaveValue('test@example.com');
    await expect(passwordInput).toHaveValue('password123');
  });

  test('should show demo login credentials', async ({ page }) => {
    await expect(page.getByText(/Demo-Zugang/i)).toBeVisible();
    await expect(page.getByText(/owner@example\.com/i)).toBeVisible();
  });

  test('should populate form when demo link is clicked', async ({ page }) => {
    await page.getByText(/owner@example\.com/i).click();

    await expect(page.getByLabel(/E-Mail-Adresse/i)).toHaveValue('owner@example.com');
    await expect(page.getByLabel(/Passwort/i)).toHaveValue('password123');
  });

  test('should show Angemeldet bleiben checkbox', async ({ page }) => {
    await expect(page.getByText(/Angemeldet bleiben/i)).toBeVisible();
  });
});

